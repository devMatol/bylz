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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Header Authorization requis' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentification utilisateur échouée' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's company
    const { data: companies } = await supabase
      .from('companies')
      .select('id, legal_name, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const company = companies?.[0];
    if (!company) {
      return new Response(
        JSON.stringify({ error: 'Entreprise introuvable' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretId = Deno.env.get('GOCARDLESS_SECRET_ID') || '';
    const secretKey = Deno.env.get('GOCARDLESS_SECRET_KEY') || '';

    if (!secretId || !secretKey) {
      // Return a helpful sandbox notice if GoCardless API keys are not set yet
      console.warn('GOCARDLESS_SECRET_ID or GOCARDLESS_SECRET_KEY not configured.');
      const origin = req.headers.get('origin') || 'https://bylz.fr';
      return new Response(
        JSON.stringify({
          url: `${origin}/settings?gocardless=sandbox`,
          notice: "Clés GoCardless non configurées. Mode démonstration activé.",
          is_mock: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get Access Token from GoCardless Bank Account Data API
    const tokenRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: secretId,
        secret_key: secretKey,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.text();
      console.error('GoCardless token error:', tokenRes.status, errData);
      return new Response(
        JSON.stringify({ error: `Erreur d'authentification GoCardless : ${errData}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access;

    // 2. Create Requisition for Bank Selection
    const origin = req.headers.get('origin') || 'https://bylz.fr';
    const redirectUrl = `${origin}/settings?gocardless=success`;
    const reference = `bylz_comp_${company.id}_${Date.now()}`;

    const reqRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/requisitions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: 'SANDBOXFINANCE_SBNK', // Default sandbox institution if not chosen
        reference: reference,
        user_language: 'FR',
      }),
    });

    if (!reqRes.ok) {
      const errData = await reqRes.text();
      console.error('GoCardless requisition error:', reqRes.status, errData);
      return new Response(
        JSON.stringify({ error: `Erreur de création de session GoCardless : ${errData}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reqData = await reqRes.json();

    return new Response(
      JSON.stringify({
        url: reqData.link || reqData.redirect,
        requisition_id: reqData.id,
        reference: reference,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Create GoCardless connect session error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur interne de serveur' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
