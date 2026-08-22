import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Parse .env file
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
  console.log("Isolating Hello Bank connections exclusively to Matthias's account...");

  // 1. Get Matthias's user profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', '%matthiasollivier%');

  console.log("Matthias profiles:", profiles);
  const matthiasUserIds = (profiles || []).map(p => p.id);

  // 2. Get Matthias's company IDs
  const { data: matthiasCompanies } = await supabase
    .from('companies')
    .select('id, legal_name, user_id')
    .in('user_id', matthiasUserIds);

  console.log("Matthias companies:", matthiasCompanies);
  const matthiasCompanyIds = (matthiasCompanies || []).map(c => c.id);

  // 3. Delete bank connections for all companies that DO NOT belong to Matthias
  if (matthiasCompanyIds.length > 0) {
    const { data: deleted, error: delErr } = await supabase
      .from('bank_connections')
      .delete()
      .not('company_id', 'in', `(${matthiasCompanyIds.map(id => `"${id}"`).join(',')})`)
      .select();

    console.log("Deleted bank connections from other accounts:", deleted?.length || 0, delErr);
  } else {
    console.error("Could not locate Matthias's company ID!");
  }
}

run().catch(console.error);
