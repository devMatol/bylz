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

    const body = await req.json();
    const { invoiceId, publicToken } = body || {};
    
    if (!invoiceId && !publicToken) {
      return corsResponse({ error: 'invoiceId or publicToken is required' }, 400);
    }

    let invoiceQuery = supabase.from('invoices').select('*, company:companies(*)');
    if (publicToken) {
      invoiceQuery = invoiceQuery.or(`public_token.eq.${publicToken},id.eq.${publicToken}`);
    } else {
      invoiceQuery = invoiceQuery.eq('id', invoiceId);
    }

    const { data: invoiceList, error: invoiceError } = await invoiceQuery.limit(1);
    const invoice = invoiceList?.[0];

    if (invoiceError || !invoice) {
      return corsResponse({ error: 'Invoice not found' }, 404);
    }

    const company = invoice.company;
    const connectAccountId = company?.stripe_connect_account_id;

    if (!connectAccountId) {
      return corsResponse({ error: 'Compte Stripe Connect non configuré' }, 400);
    }

    const unitAmount = Math.round(Number(invoice.total_ttc || 0) * 100);
    if (unitAmount <= 0) {
      return corsResponse({ error: 'Le montant de la facture doit être supérieur à 0' }, 400);
    }

    const origin = req.headers.get('origin') || 'https://bylz.fr';
    const redirectToken = invoice.public_token || invoice.id;

    // Create a Checkout Session with Destination Charge for reliable payment handling
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Facture ${invoice.number || 'N° non défini'}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/v/${redirectToken}?payment=success`,
      cancel_url: `${origin}/v/${redirectToken}`,
      metadata: {
        invoice_id: invoice.id,
      },
      payment_intent_data: {
        transfer_data: {
          destination: connectAccountId,
        },
      },
    });

    // Save payment link URL on invoice
    await supabase
      .from('invoices')
      .update({ stripe_payment_link: session.url })
      .eq('id', invoice.id);

    return corsResponse({ url: session.url });
  } catch (error: any) {
    console.error(`Create payment link error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
