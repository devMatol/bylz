const https = require("https");

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ1OTkzNiwiZXhwIjoyMDAwMDM1OTM2fQ.t9R8oE-Kj5eZ-E6d3-Qe9uK5J-uV6pQ5Z2g6G7Q9g8k";

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
      res.on("end", () => resolve(JSON.parse(body)));
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const companies = await get("/rest/v1/companies?select=*");
  console.log("Found companies count:", companies.length);

  for (const c of companies) {
    const invoices = await get(`/rest/v1/invoices?company_id=eq.${c.id}&select=id,number`);
    const quotes = await get(`/rest/v1/quotes?company_id=eq.${c.id}&select=id,number`);

    console.log(`Company ID: ${c.id} | User ID: ${c.user_id} | Name: ${c.legal_name} | SIRET: ${c.siret} | Created: ${c.created_at} | Invoices: ${invoices.length} | Quotes: ${quotes.length}`);
  }
}

main().catch(console.error);
