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
    
    const targetId = invoiceId || publicToken;
    let invoice: any = null;

    // 1. Try by id first
    const { data: invById, error: errById } = await supabase
      .from('invoices')
      .select('*, company:companies(*)')
      .eq('id', targetId)
      .maybeSingle();

    if (!errById && invById) {
      invoice = invById;
    } else if (publicToken) {
      // 2. Try by public_token if column exists
      try {
        const { data: invByToken } = await supabase
          .from('invoices')
          .select('*, company:companies(*)')
          .eq('public_token', publicToken)
          .maybeSingle();
        if (invByToken) invoice = invByToken;
      } catch (e) {
        // Ignore missing public_token column
      }
    }

    if (!invoice) {
      return corsResponse({ error: 'Facture introuvable pour ce lien.' }, 404);
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

    const sessionPayload: any = {
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
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        ...sessionPayload,
        ...(connectAccountId ? {
          payment_intent_data: {
            transfer_data: {
              destination: connectAccountId,
            },
          },
        } : {}),
      });
    } catch (stripeErr: any) {
      if (stripeErr.message?.includes('No such destination') || stripeErr.code === 'resource_missing') {
        console.warn('Destination Connect account mismatch, creating direct checkout session:', stripeErr.message);
        session = await stripe.checkout.sessions.create(sessionPayload);
      } else {
        throw stripeErr;
      }
    }

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
