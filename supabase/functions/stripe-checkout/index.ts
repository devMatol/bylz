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

    const origin = req.headers.get('origin') || 'http://localhost:5173';
    const successUrl = `${origin}/settings?checkout=success`;
    const cancelUrl = `${origin}/settings`;

    // Only apply 14-day trial if user has never used a trial and has no subscription
    const eligibleForTrial = !profile.trial_used && !profile.stripe_subscription_id;

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(eligibleForTrial ? { subscription_data: { trial_period_days: 14 } } : {}),
        metadata: {
          user_id: user.id,
        },
      });
    } catch (err: any) {
      // Fallback 1: Customer invalid during creation
      if (err.message?.includes('No such customer')) {
        const freshCustId = await getOrCreateCustomer(user.id, user.email, null);
        session = await stripe.checkout.sessions.create({
          customer: freshCustId,
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          ...(eligibleForTrial ? { subscription_data: { trial_period_days: 14 } } : {}),
          metadata: { user_id: user.id },
        });
      }
      // Fallback 2: Price ID does not exist in current Stripe account -> create inline price data
      else if (err.message?.includes('No such price') || err.code === 'resource_missing' || err.statusCode === 404) {
        const isPro = priceId.includes('PRO') || priceId === 'price_1TvYnW2X0yCzQQsN930PPkgJ';
        const unitAmount = isPro ? 1900 : 900;
        const planName = isPro ? 'Bylz Pro' : 'Bylz Solo';

        session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: { name: planName },
                unit_amount: unitAmount,
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          ...(eligibleForTrial ? { subscription_data: { trial_period_days: 14 } } : {}),
          metadata: {
            user_id: user.id,
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