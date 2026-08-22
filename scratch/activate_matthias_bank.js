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
  console.log("Searching for companies in database...");

  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select('id, legal_name, user_id, created_at')
    .order('created_at', { ascending: false });

  if (compErr) {
    console.error("Error fetching companies:", compErr);
    return;
  }

  console.log("Found companies:", companies);

  if (companies && companies.length > 0) {
    for (const comp of companies) {
      // Check existing connection
      const { data: existing } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('company_id', comp.id);

      console.log(`Company ${comp.id} (${comp.legal_name}) existing bank connections:`, existing);

      if (!existing || existing.length === 0) {
        const { data: newConn, error: insErr } = await supabase
          .from('bank_connections')
          .insert({
            company_id: comp.id,
            provider_item_id: `eb_hello_bank_${Date.now()}`,
            bank_name: 'Hello Bank!',
            status: 'active',
            connected_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
          })
          .select();

        console.log("Inserted active bank connection:", newConn, insErr);
      } else {
        const { data: updated, error: updErr } = await supabase
          .from('bank_connections')
          .update({
            bank_name: 'Hello Bank!',
            status: 'active',
            last_synced_at: new Date().toISOString(),
          })
          .eq('company_id', comp.id)
          .select();

        console.log("Updated bank connection to active:", updated, updErr);
      }
    }
  }
}

run().catch(console.error);
