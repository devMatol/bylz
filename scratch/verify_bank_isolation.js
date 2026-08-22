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
  const { data: conns } = await supabase
    .from('bank_connections')
    .select('*, company:companies(legal_name, user_id)');

  console.log("ALL CURRENT BANK CONNECTIONS IN DATABASE:", conns);
}

run().catch(console.error);
