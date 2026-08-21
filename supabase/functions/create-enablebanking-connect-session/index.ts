import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import * as jose from 'npm:jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, serviceKey);

// Hardcoded or environment RSA Private Key for Enable Banking
const defaultPrivateKeyPem = `-----BEGIN PRIVATE KEY-----
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
A1jJViqMVlk0305lxXyH0FrV37yoda0=
-----END PRIVATE KEY-----`;

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

    const appId = Deno.env.get('ENABLEBANKING_APP_ID') || 'c6c20e35-cb95-4577-8ee2-813202a771c4';
    const privateKeyPem = Deno.env.get('ENABLEBANKING_PRIVATE_KEY') || defaultPrivateKeyPem;

    if (!appId) {
      const origin = req.headers.get('origin') || 'https://bylz.fr';
      return new Response(
        JSON.stringify({
          url: `${origin}/settings?enablebanking=needs_app_id`,
          error: "Veuillez renseigner votre Application ID Enable Banking.",
          is_mock: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT signed with RS256 for Enable Banking API
    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
    const now = Math.floor(Date.now() / 1000);

    const jwtToken = await new jose.SignJWT({
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      app_id: appId,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    // Call Enable Banking API /auth endpoint to initiate session
    const origin = req.headers.get('origin') || 'https://bylz.fr';
    const redirectUrl = `${origin}/settings?enablebanking=success`;

    const authRes = await fetch('https://api.enablebanking.com/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        access: {
          valid_until: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        },
        aspsp: {
          name: 'BoursoBank',
          country: 'FR',
        },
        redirect_url: redirectUrl,
        psu_type: 'business',
        state: `bylz_comp_${company.id}_${Date.now()}`,
      }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      console.error('Enable Banking auth error:', authRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Erreur Enable Banking API : ${errText}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authRes.json();

    return new Response(
      JSON.stringify({
        url: authData.url,
        session_id: authData.session_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Create Enable Banking connect session error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur serveur interne' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
