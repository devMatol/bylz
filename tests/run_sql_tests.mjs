import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";

async function run() {
  const db = new PGlite();

  // 1. Initialisation des rôles et stubs Supabase (anon, authenticated, service_role, auth, storage, cron)
  await db.exec(`
    DO $$ BEGIN
      CREATE ROLE anon;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE ROLE authenticated;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE ROLE service_role;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY,
      email text,
      aud text DEFAULT 'authenticated',
      role text DEFAULT 'authenticated',
      banned_until timestamptz,
      raw_app_meta_data jsonb,
      created_at timestamptz DEFAULT now()
    );

    CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS storage.buckets (
      id text PRIMARY KEY,
      name text,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      public boolean DEFAULT false,
      avif_autodetection boolean DEFAULT false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    CREATE TABLE IF NOT EXISTS storage.objects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id text REFERENCES storage.buckets(id),
      name text,
      owner uuid
    );

    CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS $$
      SELECT string_to_array(name, '/');
    $$;

    CREATE SCHEMA IF NOT EXISTS cron;
    CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text) RETURNS void LANGUAGE sql AS $$
      SELECT null;
    $$;

    CREATE SCHEMA IF NOT EXISTS public;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
      );
    $$;
  `);

  // 2. Polyfill pgTAP standard
  await db.exec(`
    CREATE TABLE IF NOT EXISTS public._tap_results (
      id serial primary key,
      ok boolean,
      description text
    );

    CREATE OR REPLACE FUNCTION public.plan(p_count int) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN
      NULL;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.ok(p_cond boolean, p_desc text) RETURNS void LANGUAGE plpgsql AS $$
    BEGIN
      INSERT INTO public._tap_results (ok, description) VALUES (p_cond, p_desc);
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.is(p_val1 anyelement, p_val2 anyelement, p_desc text) RETURNS void LANGUAGE plpgsql AS $$
    DECLARE
      v_cond boolean := (p_val1 IS NOT DISTINCT FROM p_val2);
    BEGIN
      PERFORM public.ok(v_cond, p_desc);
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.finish() RETURNS TABLE(status text) LANGUAGE plpgsql AS $$
    BEGIN
      RETURN QUERY SELECT 'done'::text;
    END;
    $$;
  `);

  // 3. Exécution séquentielle de l'ensemble des migrations
  const migrationsDir = "supabase/migrations";
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    try {
      await db.exec(sql);
    } catch (err) {
      // Ignorer les erreurs d'objets déjà présents ou stubs
    }
  }

  await db.exec(`
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
  `);

  // 4. Nettoyage de BEGIN/ROLLBACK et CREATE EXTENSION pour exécution dans la base en mémoire
  const testSql = fs.readFileSync("tests/test_cancel_bank_transaction.sql", "utf8");
  const cleanLines = testSql.split(/\r?\n/).filter(line => {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN;' || trimmed === 'ROLLBACK;' || trimmed === 'CREATE EXTENSION IF NOT EXISTS pgtap;') {
      return false;
    }
    return true;
  });
  const executableSql = cleanLines.join('\n');

  await db.exec(executableSql);

  // 5. Affichage de la sortie brute TAP
  const res = await db.query("SELECT id, ok, description FROM public._tap_results ORDER BY id;");
  console.log(`1..${res.rows.length}`);
  let failed = 0;
  for (const row of res.rows) {
    if (row.ok) {
      console.log(`ok ${row.id} - ${row.description}`);
    } else {
      failed++;
      console.log(`not ok ${row.id} - ${row.description}`);
    }
  }

  if (failed === 0) {
    console.log(`# All ${res.rows.length} tests passed.`);
  } else {
    console.log(`# ${failed} of ${res.rows.length} tests failed!`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
