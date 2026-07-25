const https = require("https");

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTk5MzYsImV4cCI6MjEwMDAzNTkzNn0.OjKjWTdgWiGyecOsvIu_OjCwOExiDKR74eow-Lleo40";

function get(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "sbwbjkzustnlnnilkogm.supabase.co",
      path,
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          resolve(body);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const companies = await get("/rest/v1/companies?select=*");
  console.log("Companies count:", Array.isArray(companies) ? companies.length : companies);

  if (Array.isArray(companies)) {
    for (const c of companies) {
      const invoices = await get(`/rest/v1/invoices?company_id=eq.${c.id}&select=id,number`);
      const quotes = await get(`/rest/v1/quotes?company_id=eq.${c.id}&select=id,number`);

      console.log(`Company ID: ${c.id} | User ID: ${c.user_id} | Name: ${c.legal_name} | SIRET: ${c.siret} | Created: ${c.created_at} | Invoices: ${Array.isArray(invoices) ? invoices.length : 0} | Quotes: ${Array.isArray(quotes) ? quotes.length : 0}`);
    }
  }
}

main().catch(console.error);
