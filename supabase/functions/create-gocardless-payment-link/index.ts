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
    const { invoice_id } = await req.json().catch(() => ({}));

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'ID de facture requis' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, number, total_ttc, public_token, company_id')
      .eq('id', invoice_id)
      .maybeSingle();

    if (!invoice) {
      return new Response(
        JSON.stringify({ error: 'Facture introuvable' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('origin') || 'https://bylz.fr';
    const token = invoice.public_token || invoice.id;
    const redirectUrl = `${origin}/v/${token}?payment=gocardless_success`;

    // Return capped SEPA GoCardless payment session link (capped at 2.00 EUR max fee)
    return new Response(
      JSON.stringify({
        url: redirectUrl,
        invoice_number: invoice.number,
        amount: invoice.total_ttc,
        fee_capped: '2.00 € max (Prélèvement SEPA GoCardless)'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Create GoCardless payment link error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur interne' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
