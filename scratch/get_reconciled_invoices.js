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
  console.log("Fetching matched transactions & paid invoices...");

  const { data: matchedTxs, error: txErr } = await supabase
    .from('bank_transactions')
    .select('*, matched_invoice:invoices(*, client:clients(*))')
    .eq('match_status', 'auto_matched')
    .order('created_at', { ascending: false });

  if (txErr) {
    console.error("Error fetching transactions:", txErr);
    return;
  }

  console.log("Matched Transactions Count:", matchedTxs?.length || 0);

  if (matchedTxs && matchedTxs.length > 0) {
    console.log("\n=== RECONCILED INVOICES & TRANSACTIONS ===");
    for (const tx of matchedTxs) {
      const inv = tx.matched_invoice;
      console.log(`- Facture N° : ${inv?.number || 'Inconnue'} | Client : ${inv?.client?.name || tx.counterparty_name || 'N/A'} | Montant : ${tx.amount} € | Statut : Payée le ${tx.transaction_date}`);
    }
  } else {
    // If matched_invoice relation is not loaded directly, fetch recent paid invoices
    const { data: paidInvoices } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(10);

    console.log("\n=== RECENT PAID INVOICES ===");
    for (const inv of paidInvoices || []) {
      console.log(`- Facture N° : ${inv.number} | Client : ${inv.client?.name || 'Client'} | Montant : ${inv.total_ttc} € | Payée le : ${inv.paid_at || 'Aujourd\'hui'}`);
    }
  }
}

run().catch(console.error);
