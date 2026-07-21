import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

    const { clientData } = await req.json();
    if (!clientData) {
      return corsResponse({ error: 'clientData is required' }, 400);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || !company) {
      return corsResponse({ error: 'Company or Profile not found' }, 404);
    }

    // Check limit if on Starter plan
    if (profile.plan === 'starter') {
      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id);

      if ((count ?? 0) >= 1) {
        return corsResponse(
          { error: 'Limite de 1 client atteinte sur le plan Starter. Passez au plan Solo pour des clients illimités.' },
          402
        );
      }
    }

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        company_id: company.id,
      })
      .select('*')
      .single();

    if (insertError) {
      return corsResponse({ error: insertError.message }, 500);
    }

    return corsResponse({ client: newClient });
  } catch (error: any) {
    console.error(`Create client gated error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
