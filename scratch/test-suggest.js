// Native fetch is global in Node.js 18+

import fs from "fs";
import path from "path";

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

const url = `${env.VITE_SUPABASE_URL}/functions/v1/blog-suggest-topics`;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const envUrl = `${env.VITE_SUPABASE_URL}/functions/v1/test-env`;
  console.log("Calling Edge Function:", envUrl);
  try {
    const res = await fetch(envUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ guidance: "immobilier B2B" })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
