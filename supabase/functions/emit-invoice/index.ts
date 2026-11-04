import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bylz Monetization',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Authorization header required' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return corsResponse({ error: 'invoiceId is required' }, 400);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || !company) {
      return corsResponse({ error: 'Company or Profile not found' }, 404);
    }

    // Server-side plan limit check for Starter
    if (profile.plan === 'starter') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .neq('status', 'draft')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if ((count ?? 0) >= 3) {
        return corsResponse(
          { error: 'Limite de 3 factures mensuelles atteinte sur le plan Starter.' },
          402
        );
      }
    }

    // Fetch invoice to emit
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('company_id', company.id)
      .single();

    if (invError || !invoice) {
      return corsResponse({ error: 'Invoice not found or unauthorized' }, 404);
    }

    // Call SECURITY DEFINER emit_invoice RPC which locks company FOR UPDATE,
    // generates the next sequential number, sets issue_date = CURRENT_DATE, status = 'pending',
    // and freezes legal_snapshot.
    const { data: emittedInvoice, error: emitError } = await supabase
      .rpc('emit_invoice', { p_invoice_id: invoiceId });

    if (emitError || !emittedInvoice) {
      const msg = emitError?.message?.includes("Cette facture vient d'être émise") || emitError?.message?.includes("statut brouillon")
        ? "Cette facture vient d'être émise."
        : (emitError?.message || 'Erreur lors de l’émission de la facture');
      return corsResponse({ error: msg }, 400);
    }

    let updatedInvoice = emittedInvoice;
    let paymentLinkUrl: string | null = null;
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // Generate Stripe Connect Payment Link if company has Connect account
    if (
      company.stripe_connect_account_id &&
      emittedInvoice.type !== 'credit_note' &&
      Number(emittedInvoice.total_ttc || 0) > 0
    ) {
      try {
        const unitAmount = Math.round(Number(emittedInvoice.total_ttc) * 100);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Facture ${emittedInvoice.number}`,
                },
                unit_amount: unitAmount,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${origin}/invoices/${emittedInvoice.id}?payment=success`,
          cancel_url: `${origin}/invoices/${emittedInvoice.id}`,
          metadata: {
            invoice_id: emittedInvoice.id,
          },
          payment_intent_data: {
            transfer_data: {
              destination: company.stripe_connect_account_id,
            },
          },
        });
        paymentLinkUrl = session.url;
        if (paymentLinkUrl) {
          const { data: invWithLink, error: linkErr } = await supabase
            .from('invoices')
            .update({ stripe_payment_link: paymentLinkUrl })
            .eq('id', emittedInvoice.id)
            .select('*')
            .single();
          if (!linkErr && invWithLink) {
            updatedInvoice = invWithLink;
          }
        }
      } catch (e) {
        console.error('Error generating Stripe Connect payment link during emission:', e);
      }
    }

    return corsResponse({ invoice: updatedInvoice });
  } catch (error: any) {
    console.error(`Emit invoice error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
