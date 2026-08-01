import https from "https";

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

function restQuery(path) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/rest/v1/${path}`;
    const req = https.get(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on("error", reject);
  });
}

async function run() {
  console.log("Fetching all invoices from database...");
  const res = await restQuery("invoices?select=id,number,status,total_ttc,stripe_payment_link,company_id");
  console.log("Invoices count:", Array.isArray(res.data) ? res.data.length : res.status);
  console.log("Invoices:", JSON.stringify(res.data, null, 2));
}

run();
