import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, bridge-version, bridge-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Bridge Webhook event received:', payload.event_type || payload.type || 'unknown');

    const itemId = payload.item_id || payload.data?.item_id || payload.resource?.item_id;
    const userUuid = payload.user_uuid || payload.data?.user_uuid;

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
