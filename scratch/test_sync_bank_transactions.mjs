import https from "https";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

function callSyncBank() {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/functions/v1/sync-bank-transactions`;
    const bodyStr = JSON.stringify({ company_id: "test" });
    const u = new URL(url);
    
    const req = https.request(u, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log("Testing sync-bank-transactions Edge Function...");
  const res = await callSyncBank();
  console.log("Status:", res.status);
  console.log("Body:", res.body);
}

run();
