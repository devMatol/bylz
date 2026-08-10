import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, bridge-version, bridge-signature',
};

const webhookSecret = Deno.env.get('BRIDGE_WEBHOOK_SECRET') ?? '';

/**
 * Bridge signs each webhook with an HMAC-SHA256 of the raw body, sent as
 * "v1=<base64>" (possibly several values) in the signature header. Without this
 * check anyone could post a forged bank event to this endpoint.
 */
async function verifyBridgeSignature(bodyText: string, header: string | null): Promise<boolean> {
  if (!header) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bodyText));
  const bytes = new Uint8Array(mac);
  const expectedB64 = btoa(String.fromCharCode(...bytes));
  const expectedHex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const candidates = header
    .split(',')
    .map((part) => part.trim().replace(/^v\d+=/, ''))
    .filter((part) => part.length > 0);

  return candidates.some(
    (candidate) =>
      candidate === expectedB64 || candidate.toLowerCase() === expectedHex
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();

    if (!webhookSecret) {
      console.error('BRIDGE_WEBHOOK_SECRET is not configured; refusing webhook.');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signatureHeader =
      req.headers.get('bridgeapi-signature') ??
      req.headers.get('bridge-signature') ??
      req.headers.get('x-bridge-signature');

    if (!(await verifyBridgeSignature(bodyText, signatureHeader))) {
      console.warn('Bridge webhook signature verification failed.');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventType = String(payload.event_type || payload.type || payload.name || 'unknown');
    console.log('Bridge Webhook event received:', eventType);

    const itemId = payload.item_id || payload.data?.item_id || payload.resource?.item_id;
    const userUuid = payload.user_uuid || payload.data?.user_uuid;

    if (eventType.includes('deleted') && itemId) {
      console.log(`Bridge connection deleted event received for item ${itemId}`);
      await supabase
        .from('bank_connections')
        .update({ status: 'error' })
        .eq('provider_item_id', String(itemId));
    }

    if (!itemId && !userUuid) {
      console.warn('Bridge Webhook notice: missing item_id or user_uuid in payload', payload);
      return new Response(JSON.stringify({ received: true, note: 'No connection reference' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Locate bank connection in database
    let query = supabase.from('bank_connections').select('company_id, id');
    if (itemId) {
      query = query.eq('provider_item_id', String(itemId));
    }

    const { data: connections, error: connErr } = await query;

    if (connErr) {
      console.error('Error searching bank connection for webhook:', connErr);
    }

    const companyIds = Array.from(new Set((connections || []).map((c) => c.company_id)));

    // 2. Trigger sync-bank-transactions for each affected company
    for (const companyId of companyIds) {
      try {
        console.log(`Triggering instant bank sync for company: ${companyId}`);
        await supabase.functions.invoke('sync-bank-transactions', {
          body: { company_id: companyId },
        });
      } catch (err: any) {
        console.error(`Error triggering bank sync for company ${companyId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        received: true,
        triggered_companies: companyIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Bridge Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
