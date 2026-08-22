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
  console.log("Cleaning up test companies for matthiasollivier123...");

  // Get company MATTHIAS OLLIVIER
  const { data: comp } = await supabase
    .from('companies')
    .select('id, legal_name')
    .eq('legal_name', 'MATTHIAS OLLIVIER')
    .single();

  console.log("Main company:", comp);

  if (comp) {
    // Delete bank connections from any other company
    const { data: deleted, error: delErr } = await supabase
      .from('bank_connections')
      .delete()
      .neq('company_id', comp.id)
      .select();

    console.log("Deleted bank connections from other test companies:", deleted?.length || 0, delErr);
  }
}

run().catch(console.error);
