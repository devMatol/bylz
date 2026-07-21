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

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, company:companies(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return corsResponse({ error: 'Invoice not found' }, 404);
    }

    const company = invoice.company;
    const connectAccountId = company?.stripe_connect_account_id;

    if (!connectAccountId) {
      return corsResponse({ error: 'Compte Stripe Connect non configuré' }, 400);
    }

    // Verify charges_enabled on Connect account
    const account = await stripe.accounts.retrieve(connectAccountId);
    if (!account.charges_enabled) {
      return corsResponse({ error: 'Le compte Stripe Connect n\'est pas encore actif pour recevoir des paiements' }, 400);
    }

    const unitAmount = Math.round(invoice.total_amount * 100);
    if (unitAmount <= 0) {
      return corsResponse({ error: 'Le montant de la facture doit être supérieur à 0' }, 400);
    }

    const paymentLink = await stripe.paymentLinks.create(
      {
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
        metadata: {
          invoice_id: invoice.id,
        },
      },
      {
        stripeAccount: connectAccountId,
      }
    );

    // Save payment link URL on invoice
    await supabase
      .from('invoices')
      .update({ stripe_payment_link: paymentLink.url })
      .eq('id', invoice.id);

    return corsResponse({ url: paymentLink.url });
  } catch (error: any) {
    console.error(`Create payment link error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
