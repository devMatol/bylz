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
  console.log("Cleaning up synthetic transactions and reverting invoices to pending...");

  // Delete synthetic transactions
  const { data: deletedTxs, error: delErr } = await supabase
    .from('bank_transactions')
    .delete()
    .or('external_id.like.eb-sync-%,external_id.like.mock-tx-%')
    .select();

  console.log("Deleted synthetic transactions count:", deletedTxs?.length || 0, delErr);

  // Revert invoices to pending that were updated today
  const targetInvoiceNumbers = ['FAC-2026-006', 'FP-REC-8703', 'FAC-2026-002', 'FAC-2026-004', 'FAC-2026-005', 'FAC-2026-001'];
  
  const { data: updatedInvoices, error: invErr } = await supabase
    .from('invoices')
    .update({
      status: 'pending',
      paid_at: null,
    })
    .in('number', targetInvoiceNumbers)
    .select();

  console.log("Reverted invoices to pending status:", updatedInvoices?.map(i => i.number), invErr);
}

run().catch(console.error);
