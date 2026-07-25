const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://sbwbjkzustnlnnilkogm.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2Jqa3p1c3RubG5uaWxrb2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ1OTkzNiwiZXhwIjoyMDAwMDM1OTM2fQ.t9R8oE-Kj5eZ-E6d3-Qe9uK5J-uV6pQ5Z2g6G7Q9g8k";

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: companies, error: cErr } = await supabase.from("companies").select("*");
  console.log("Companies count:", companies?.length, cErr);

  if (companies) {
    for (const c of companies) {
      const { count: iCount } = await supabase.from("invoices").select("*", { count: "exact", head: true }).eq("company_id", c.id);
      const { count: qCount } = await supabase.from("quotes").select("*", { count: "exact", head: true }).eq("company_id", c.id);
      console.log(`Company ID: ${c.id} | User ID: ${c.user_id} | Name: ${c.legal_name} | SIRET: ${c.siret} | Created: ${c.created_at} | Invoices: ${iCount} | Quotes: ${qCount}`);
    }
  }
}

main().catch(console.error);
