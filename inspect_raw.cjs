const url = "https://sbwbjkzustnlnnilkogm.supabase.co/rest/v1/companies?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ1OTkzNiwiZXhwIjoyMDAwMDM1OTM2fQ.t9R8oE-Kj5eZ-E6d3-Qe9uK5J-uV6pQ5Z2g6G7Q9g8k";

async function main() {
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const companies = await res.json();
  console.log("Found companies:", companies.length);

  for (const c of companies) {
    const invRes = await fetch(`https://sbwbjkzustnlnnilkogm.supabase.co/rest/v1/invoices?company_id=eq.${c.id}&select=id,number`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const invoices = await invRes.json();

    const qRes = await fetch(`https://sbwbjkzustnlnnilkogm.supabase.co/rest/v1/quotes?company_id=eq.${c.id}&select=id,number`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const quotes = await qRes.json();

    console.log(`Company ID: ${c.id} | User ID: ${c.user_id} | Name: ${c.legal_name} | SIRET: ${c.siret} | Created: ${c.created_at} | Invoices count: ${invoices.length} | Quotes count: ${quotes.length}`);
  }
}

main().catch(console.error);
