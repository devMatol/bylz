import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Cleaning up duplicate test companies for matthiasollivier123@gmail.com...");

  // Get user profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', '%matthiasollivier123%');

  const userId = profiles?.[0]?.id;
  if (!userId) {
    console.error("User not found!");
    return;
  }

  // Get all companies for user
  const { data: companies } = await supabase
    .from('companies')
    .select('id, legal_name, siret, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log("Found companies:", companies?.length || 0);

  if (companies && companies.length > 1) {
    // Keep the main company MATTHIAS OLLIVIER or the most recent one with siret
    const mainComp = companies.find(c => c.legal_name === 'MATTHIAS OLLIVIER') || companies[0];
    const duplicateIds = companies.filter(c => c.id !== mainComp.id).map(c => c.id);

    console.log("Main company to keep:", mainComp);
    console.log("Duplicate company IDs to delete:", duplicateIds.length);

    if (duplicateIds.length > 0) {
      const { error: delErr } = await supabase
        .from('companies')
        .delete()
        .in('id', duplicateIds);

      console.log("Delete duplicates result error:", delErr);
    }
  }
}

run().catch(console.error);
