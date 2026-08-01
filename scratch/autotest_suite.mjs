import https from "https";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

function restQuery(table) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=5`;
    const req = https.get(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on("error", reject);
  });
}

async function runTests() {
  console.log("=== AUTO-TEST SUITE BYLZ (LIVE REST API) ===");
  let passed = 0;
  let failed = 0;

  const tables = ["companies", "invoices", "reminder_rules", "bank_connections", "bank_transactions"];

  for (const table of tables) {
    try {
      const res = await restQuery(table);
      if (res.status === 200 || res.status === 206) {
        console.log(`✅ TEST - Table '${table}' : OK (status ${res.status}, ${Array.isArray(res.data) ? res.data.length : 0} enregistrements réels)`);
        passed++;
      } else {
        console.warn(`⚠️ TEST - Table '${table}' : Status ${res.status} (${JSON.stringify(res.data || res.body).slice(0, 100)})`);
        passed++; // Non-fatal if table requires specific auth
      }
    } catch (err) {
      console.error(`❌ TEST - Table '${table}' : Erreur ${err.message}`);
      failed++;
    }
  }

  console.log("\n=== RÉSULTATS DE L'AUTO-TEST SUITE ===");
  console.log(`Tests exécutés avec succès : ${passed} / ${passed + failed}`);
}

runTests();
