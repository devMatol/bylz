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

async function getOrCreateCustomer(userId: string, email?: string, existingCustomerId?: string | null): Promise<string> {
  if (existingCustomerId) {
    try {
      const cust = await stripe.customers.retrieve(existingCustomerId);
      if (!cust.deleted) {
        return existingCustomerId;
      }
    } catch (_e) {
      console.log(`Existing customer ${existingCustomerId} not found in current Stripe account, recreating...`);
    }
  }

  const newCust = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: newCust.id })
    .eq('id', userId);

  return newCust.id;
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

    const { priceId } = await req.json();
    if (!priceId) {
      return corsResponse({ error: 'priceId is required' }, 400);
    }

    // Allow both Stripe price IDs and client price constant aliases
    const ALLOWED_PRICE_IDS = new Set([
      'price_1TvYmr2X0yCzQQsNrPbSS9NC', // solo Stripe ID
      'price_1TvYnW2X0yCzQQsN930PPkgJ', // pro Stripe ID
      'price_SOLO_ANNUAL_50',
      'price_SOLO_MONTHLY_890',
      'price_PRO_ANNUAL_75',
      'price_PRO_ANNUAL_80',
      'price_PRO_MONTHLY_1290',
      'price_SOLO',
      'price_PRO',
    ]);
    const isValidPrice =
      ALLOWED_PRICE_IDS.has(String(priceId)) ||
      /^(price_|plan_)(SOLO|PRO)_(ANNUAL|MONTHLY)/i.test(String(priceId));

    if (!isValidPrice) {
      return corsResponse({ error: 'Offre invalide' }, 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return corsResponse({ error: 'Profile not found' }, 404);
    }

    // Safely get or recreate Customer ID for current Stripe account
    const customerId = await getOrCreateCustomer(user.id, user.email, profile.stripe_customer_id);

    const origin =
      req.headers.get('origin') ||
      (req.headers.get('referer') ? new URL(req.headers.get('referer')!).origin : null) ||
      'https://bylz.fr';
    const successUrl = `${origin}/settings?checkout=success`;
    const cancelUrl = `${origin}/settings`;

    // Only apply 14-day trial if user has never used a trial and has no subscription
    const eligibleForTrial = !profile.trial_used && !profile.stripe_subscription_id;

    // Detect plan and cadence
    const pLower = String(priceId || '').toLowerCase();
    const isPro = pLower.includes('pro') || priceId === 'price_1TvYnW2X0yCzQQsN930PPkgJ';
    const isMonthly = pLower.includes('_m') || pLower.includes('month');

    let unitAmount = 5000; // Solo Annual (50 €)
    let interval: 'year' | 'month' = 'year';
    let planName = 'Bylz Solo (Annuel)';

    if (isPro && !isMonthly) {
      unitAmount = 8000; // Pro Annual (80 €)
      planName = 'Bylz Pro (Annuel)';
      interval = 'year';
    } else if (isPro && isMonthly) {
      unitAmount = 1290; // Pro Monthly (12.90 €)
      planName = 'Bylz Pro (Mensuel)';
      interval = 'month';
    } else if (!isPro && isMonthly) {
      unitAmount = 890; // Solo Monthly (8.90 €)
      planName = 'Bylz Solo (Mensuel)';
      interval = 'month';
    }

    const isCustomVirtualPrice =
      priceId.startsWith('price_SOLO') ||
      priceId.startsWith('price_PRO') ||
      priceId.startsWith('plan_');

    const subscriptionData: any = {
      metadata: {
        user_id: user.id,
        plan: isPro ? 'pro' : 'solo',
      },
    };
    if (eligibleForTrial) {
      subscriptionData.trial_period_days = 14;
    }

    const buildLineItems = (usePriceData = false) => {
      if (usePriceData || isCustomVirtualPrice) {
        return [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: planName },
              unit_amount: unitAmount,
              recurring: { interval },
            },
            quantity: 1,
          },
        ];
      }
      return [{ price: priceId, quantity: 1 }];
    };

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: buildLineItems(false),
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: subscriptionData,
        metadata: {
          user_id: user.id,
          plan: isPro ? 'pro' : 'solo',
        },
      });
    } catch (err: any) {
      // Fallback 1: Customer invalid during creation (recreated in Stripe)
      if (err.message?.includes('No such customer')) {
        const freshCustId = await getOrCreateCustomer(user.id, user.email, null);
        session = await stripe.checkout.sessions.create({
          customer: freshCustId,
          payment_method_types: ['card'],
          line_items: buildLineItems(false),
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          subscription_data: subscriptionData,
          metadata: {
            user_id: user.id,
            plan: isPro ? 'pro' : 'solo',
          },
        });
      }
      // Fallback 2: Price ID does not exist in Stripe -> fallback to price_data
      else if (
        err.message?.includes('No such price') ||
        err.code === 'resource_missing' ||
        err.statusCode === 404
      ) {
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: buildLineItems(true),
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          subscription_data: subscriptionData,
          metadata: {
            user_id: user.id,
            plan: isPro ? 'pro' : 'solo',
          },
        });
      } else {
        throw err;
      }
    }

    return corsResponse({ url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});