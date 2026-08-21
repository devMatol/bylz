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

const defaultPrivateKeyPem = `-----BEGIN PRIVATE KEY-----
MIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQCoXlzKq6yDnDtl
B3rLYtltpvTqySC1iM3r1uViDzYxcr73Mnp1YFcmtFpy4niyRmr/MZih4+bcAVlJ
ARKvq2sSIdfNr5Tu1SGIR3TO90rS9YxDLRQ32AuuzN1PLI9BpHu+711yLGbNdEmS
Zt4JFP+tfbieY3dwERt7KrOykPJaOYKtek2uAeHLYbIgVyHlgphtO0THNp/AYZNh
ysjp4vgrax+v80SyjaWRqgf0YNHVHmA6UUauJZkt8/KEydnz97aRyW+xHEwNGqRD
uoMhrq6ZkjfdJq9Vx2GKGBzqCmw+3M5+VEv4faYcpLHUY8Ez37GWM5B2X2GBEMBX
Xg+e09H6Ug/3k8fpyMkHZNpYnCXwakMu39NmILSKArkZM6VvHPOxQD6ZzSuT8Rs/
YB0YnSUDuVRSUyzmk4k98c5jHPSpe4z/HYhR15OuOLHXd7pdKGA2eY4EW9nH+nB4
EBoPF9fpsVJOEF/hwUwRMGHA7jaJjQMQ7CqOjnGwrFci85SZ8Wj00KsqvK2LWrpc
hGyaUFuPJt/f2NEWm7GdBw4rOVYJLvxflANqRDd9Tbc01+MRDXUJZ4UoefTTq8+R
giwBSbLKN0qUP5q2/zZlQyRJzF+QL7PmbJAP7GpdBOCmZkt9RTleJyAtkrPS6L9U
ukCodp/aWez1Hv2KnC3SCG5XqLfubwIDAQABAoICAAVzTeU/CQbeHW7/KW8kiZwH
VgpfQqldxe6Ki+2JY6OBRBlUD3JZSg5LXiFSZqHZdUhe7KY2UkMbqPVi8J3rNucB
XXZm5rOTsWAzWN6uxO5u6WQnw23KeqZXFozAevj0XJ4MnMIG/X+igEyL3p2LUSVY
aMTrZ2RqdAZnJJfYzHwZdWW7YWRgcP91KJ+y8mVMS+Cw6kP2A510RBOUzaEfVPVU
pHBnt9x9M5slHbxcngOqnS335O0wgfS3+2WgnryENs7MfJHOiV3yV4IVVgyBT102
OBoTidn3BpfCgWfIY3vJ7FR3fa793PffEzqoPydUvdMzKlpDh0y+Fdvo2ZrS30Qe
bdrZsp1S2S4wDWn8rb4eaemyoPPHs709H4YaYF5jxAfOJeZWn9pSWW+Tejey5dHq
P29uZOh0FiwD1L3c9mDHyj258nXyXDfYC+b4A11F8XzUBpor57ecI9bINUys/tr4
q5Fg5ZL7ecknlerhsN7KxaM1lgnCurWIKdAv8m2La1lTB6nyHCqOalxPPKKeF0vK
QwyvQnFJ/D594Eukn2Ktd2ygbX7vNVI4X2JWpQnP+Gbkq7net85wEQdRpiazD6mr
fNCzacL4mvnGztvQ0kF/ELAHcFIeySawqFJ94Vgl3dn4d/NgxemxuH9npQShjUfi
9EVHtf6tlEfJyB8SWwjhAoIBAQDamYzrjoZp8X833UibHAcQSl4IsIaFvFpZmgoY
vAMprpcw0bbXeiwhRedn75vIXfdidZRYBNLFF/fkYkC0DuQYOTbZt0KaNvRYgxS2
2+HprWl6kA803eiM0mOKxCmPrj0zKEvWsBT18OfaOvDrn9mtwGPlVKpsReUV54Ns
fnisxeag/F0eOGkNvo7HRE12ez6zUMkAmlmMoVP8hXjBAJ6pHqLjEXvzbkuW4NUI
GlClTXfuJ9820pE0wkdSTMgsgbyNmTrgUr3UeTnPvaX40g1t0dlQE3Mx00OqPrlX
lmeYiyaN+NvBH80SSuNGJeAAxjRynVg4J3RH7uftYR/ryUB5AoIBAQDFLLx+959d
vD5d8lT11gJgpR0W9Q0qPqz+6rPrm3xzsEBiPOj05G1PsDbZr/yoBzmYKW7YOsyM
BwWCUtu1UTHp5O9dZvCSZghwDCCyDdCnIV84xBgxBqg745tQC3yERxEUEtyaE/DQ
W7O/3CF+XlFd2r6MyQuXsmZ/iOu124VOLrJ2CFqVmF5ZXl4T0NkjcHwGZves5/id
xjE98zWk4gJ1oYbdeDBNUqKIqBYzqenEeoJa73fkn8z6dGmxZbXe4lgtG1MtYHZf
yOwPYsinnySxXqlDzvyQr7KfiAuTMRlqotBSsazZAtGDR3//KxR3A4v44emYD8yW
HwA4Zdg4WPwnAoIBAGbYEP2Ny10ymgi9WfhnokcexcjOzCtFJzi6iP+EDPTiSA1W
zO/pcbOhwLIcf60v0ECJUuZqNoM1uJHBS/Gqg9OFr3GUj4ggTKsL2IYDQvD+ff6E
ojLcKBmArgZOLcOEVRSpY6y4oNPoqBv62Pfx96aQOi9duuQ/qfy5NBKqGbonTU72
DBU4suwdd+z2DH+ukhwo6LgY5gKMsAfA/8PFt9+XI0kzI56uiG+OjYtHXiO3I7Jv
HcwcGua4dHea2h5eV0hDC/kX1GmPMwyyi9BZeqntLZFH5U1OuKny4p37i/evl875
guIERSXTB8Qr84xJs8ksj6GzpjhlhMYgiLUUtPkCggEBAMO04K+BZswqIRksg8my
jo+Qs2vq9RM+PIWVPdoYbZGCmpUnce5IoHsdI4Q0WqoI6dCvJ1c2HXrLKVuulGbG
3a0TT8a8ewJEhhF46Cby8WxCAnqcoIpg2jD/fFQZ4pCE3V24TwAb1MVqj+JaQ2Bj
i42FpealUn1SVMw3ggXyisEMNpRTPF4Ja3R25xfyDuRPLLtKDoGviaRIaO3dbhxn
PBu3pN5EAmVtJOhRNiA3gVFEbAiIcc8aEeFyFMpAcyF0NiMnYQrEGRp/mla3LQS7
QDdRBt7IHwYZbklMRnjlnh2q1u2Nb0vCsWQFXvVNtDVg7tismygUXnOO97AC3ncn
U7cCggEANbjpgQFB3/c0fh1Malvt8szpplGZeXC4+RAQsOsHIu0u3kprAvEfw73d
oQmATCF10kEpWyIogdCBlwM4gtlxGn5yO5KS5Ffmr3hXOn2gevtDdJMQtwSVZheu
C6A6APZwRx9Sad0W0ZSj1MR9eQFBohJ4zoWxW2vZho04HlgNHH7lqm4UasYiBoyP
pEphTBxZfR2SMMLF7a69WHTCDaUGTZti+4mjhn71bXdKMNF2OLIjMfUovJikcesp
ziTmnmeT8UA7tkrRmABdT72F2XLFGCZ/cajvbYnhagqVKFeNupiN/gtKwECKDDqw
pNkQxebqzXGsQvrS+VDRIrA+YL7gPQ==
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

    const { code } = await req.json();
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Code d\'autorisation manquant' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's company
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

    const appId = Deno.env.get('ENABLEBANKING_APP_ID') || 'c26f1b0a-f146-47f2-83da-ff2f78bec31f';
    const privateKeyPem = Deno.env.get('ENABLEBANKING_PRIVATE_KEY') || defaultPrivateKeyPem;

    // Generate JWT for Enable Banking API
    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
    const now = Math.floor(Date.now() / 1000);

    const jwtToken = await new jose.SignJWT({
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      app_id: appId,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: appId })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    // Call POST /sessions to exchange code for session & accounts
    const sessionRes = await fetch('https://api.enablebanking.com/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error('Enable Banking session exchange error:', sessionRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Erreur d'échange de session Enable Banking : ${errText}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.session_id;
    const accounts = sessionData.accounts || [];

    const bankName = sessionData.aspsp?.name || accounts?.[0]?.aspsp?.name || 'Banque Pro';

    // Insert bank connection into bank_connections table
    const { data: connection, error: connErr } = await supabase
      .from('bank_connections')
      .insert({
        company_id: company.id,
        provider_item_id: sessionId,
        bank_name: bankName,
        status: 'active',
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (connErr) {
      console.error('Error inserting bank_connection:', connErr);
    }

    // Try fetching transactions for connected accounts
    let fetchedTxCount = 0;
    for (const acc of accounts) {
      try {
        const accUid = acc.account_id?.iban || acc.account_id?.bban || acc.account_id?.id;
        if (!accUid) continue;

        const txRes = await fetch(`https://api.enablebanking.com/accounts/${encodeURIComponent(accUid)}/transactions`, {
          headers: { 'Authorization': `Bearer ${jwtToken}` },
        });

        if (txRes.ok) {
          const txData = await txRes.json();
          const rawTxs = txData.transactions?.booked || txData.transactions || [];

          for (const tx of rawTxs) {
            const rawAmount = parseFloat(tx.transaction_amount?.amount || tx.amount || '0');
            if (rawAmount <= 0) continue; // Only credit/incoming payments for reconciliation

            const txDate = tx.booking_date || tx.value_date || new Date().toISOString().split('T')[0];
            const label = tx.remittance_information_unstructured || tx.entry_reference || tx.creditor_name || 'Virement entrant';

            const { error: txErr } = await supabase
              .from('bank_transactions')
              .insert({
                bank_connection_id: connection?.id || sessionId,
                external_id: tx.transaction_id || `eb_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount: rawAmount,
                currency: tx.transaction_amount?.currency || 'EUR',
                transaction_date: txDate,
                label: label,
                counterparty_name: tx.debtor_name || tx.creditor_name || null,
                match_status: 'unmatched',
              });

            if (!txErr) fetchedTxCount++;
          }
        }
      } catch (txErr) {
        console.warn('Error fetching account transactions:', txErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        bank_name: bankName,
        accounts_count: accounts.length,
        transactions_fetched: fetchedTxCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Enable Banking callback error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur serveur interne' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
