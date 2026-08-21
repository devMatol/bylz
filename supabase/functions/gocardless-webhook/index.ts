import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    console.log('GoCardless webhook received payload:', JSON.stringify(body));

    // Extract transaction details or event payload
    const eventType = body.event || body.type || 'transaction';
    const requisitionId = body.requisition_id || body.requisition || '';
    const reference = body.reference || '';

    // If reference is formatted as bylz_comp_{company_id}_{timestamp}
    let companyId = '';
    if (reference.startsWith('bylz_comp_')) {
      const parts = reference.split('_');
      companyId = parts[2] || '';
    }

    if (companyId) {
      // Query pending invoices for this company to check matching amounts
      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('id, number, total_ttc, status, company_id')
        .eq('company_id', companyId)
        .in('status', ['pending', 'late']);

      console.log(`Reconciling for company ${companyId}: found ${(pendingInvoices || []).length} pending invoices.`);

      // If transactions are passed in webhook payload
      const transactions = body.transactions?.booked || body.transactions || [];
      for (const tx of transactions) {
        const txAmount = Math.abs(parseFloat(tx.transactionAmount?.amount || tx.amount || '0'));
        const txRemittance = (tx.remittanceInformationUnstructured || tx.description || '').toLowerCase();

        // Find matching pending invoice by amount or invoice number in remittance
        const matchedInv = (pendingInvoices || []).find((inv) => {
          const invAmount = Math.abs(parseFloat(inv.total_ttc));
          const numberMatch = inv.number && txRemittance.includes(inv.number.toLowerCase());
          const amountMatch = Math.abs(invAmount - txAmount) < 0.01;
          return numberMatch || amountMatch;
        });

        if (matchedInv) {
          console.log(`Matching transaction found for invoice ${matchedInv.number} (${matchedInv.id})! Marking paid.`);
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              paid_amount: txAmount,
            })
            .eq('id', matchedInv.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('GoCardless webhook processing error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur interne de serveur' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
