import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Manually parse .env file
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
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, is_admin, created_at");
    
  if (error) {
    console.error("Error querying profiles:", error);
  } else {
    console.log("Profiles list:");
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
