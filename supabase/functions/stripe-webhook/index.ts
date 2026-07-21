import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bylz Monetization',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const STRIPE_PRICE_SOLO = "price_1TvYmr2X0yCzQQsNrPbSS9NC";
const STRIPE_PRICE_PRO = "price_1TvYnW2X0yCzQQsN930PPkgJ";

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 401 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 401 });
    }

    // Idempotency check via stripe_webhook_events table
    const { error: insertEventError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        type: event.type,
        payload: event as any,
      });

    if (insertEventError) {
      // 23505 is unique constraint violation in Postgres
      if (insertEventError.code === '23505') {
        console.log(`Event ${event.id} already processed`);
        return Response.json({ received: true, duplicate: true });
      }
      console.error('Error recording webhook event:', insertEventError);
    }

    await handleWebhookEvent(event);

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleWebhookEvent(event: Stripe.Event) {
  console.log(`Processing event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Handle subscription checkout
      if (session.mode === 'subscription') {
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.user_id;

        let query = supabase.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          trial_used: true,
        });

        if (userId) {
          query = query.eq('id', userId);
        } else if (customerId) {
          query = query.eq('stripe_customer_id', customerId);
        }

        await query;
      }

      // Handle Connect Payment Link payment for invoice
      if (session.metadata?.invoice_id) {
        const invoiceId = session.metadata.invoice_id;
        const amountTotal = (session.amount_total ?? 0) / 100;

        // Check if invoice already paid or payment recorded
        const { data: invoice } = await supabase
          .from('invoices')
          .select('status, total_amount')
          .eq('id', invoiceId)
          .single();

        if (invoice && invoice.status !== 'paid') {
          const paidAt = new Date().toISOString();
          
          // Insert payment record
          await supabase.from('payments').insert({
            invoice_id: invoiceId,
            amount: amountTotal || invoice.total_amount,
            payment_method: 'stripe',
            payment_date: paidAt.split('T')[0],
            notes: 'Paiement en ligne Stripe Connect',
          });

          // Mark invoice as paid
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: paidAt,
            })
            .eq('id', invoiceId);

          console.log(`Invoice ${invoiceId} marked as paid via Stripe Connect payment`);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price?.id;
      const status = subscription.status;

      let newPlan: 'starter' | 'solo' | 'pro' = 'starter';
      if (status === 'active' || status === 'trialing') {
        if (priceId === STRIPE_PRICE_PRO) newPlan = 'pro';
        else if (priceId === STRIPE_PRICE_SOLO) newPlan = 'solo';
      }

      const trialEndsAt = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null;

      await supabase
        .from('profiles')
        .update({
          plan: newPlan,
          stripe_subscription_id: subscription.id,
          trial_ends_at: trialEndsAt,
        })
        .eq('stripe_customer_id', customerId);

      console.log(`Updated subscription for customer ${customerId}: plan = ${newPlan}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from('profiles')
        .update({
          plan: 'starter',
          stripe_subscription_id: null,
          trial_ends_at: null,
        })
        .eq('stripe_customer_id', customerId);

      console.log(`Subscription deleted for customer ${customerId}: plan set to starter`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}