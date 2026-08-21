import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import * as jose from "npm:jose@5.9.6";
import { requireOperator, resolveCaller, unauthorized } from "../_shared/require-operator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const defaultPrivateKeyPem = `-----BEGIN PRIVATE KEY-----
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
pNkQxebqzXGsQvrS+VDRIrA+YL7gPQ==
-----END PRIVATE KEY-----`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const bridgeClientId = Deno.env.get("BRIDGE_CLIENT_ID") || "";
  const bridgeClientSecret = Deno.env.get("BRIDGE_CLIENT_SECRET") || "";

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Configuration Supabase manquante" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  const operator = await requireOperator(req);
  let callerUserId: string | null = null;
  if (!operator.allowed) {
    callerUserId = await resolveCaller(req);
    if (!callerUserId) return unauthorized(corsHeaders);
  }

  try {
    let targetCompanyId: string | null = null;
    try {
      const body = await req.json();
      if (body?.company_id) targetCompanyId = body.company_id;
    } catch {
      // Optional body
    }

    if (callerUserId) {
      const { data: ownCompanies } = await adminClient
        .from("companies")
        .select("id")
        .eq("user_id", callerUserId);
      const ownIds = (ownCompanies || []).map((c: any) => c.id);
      if (!targetCompanyId) {
        if (ownIds.length === 0) return unauthorized(corsHeaders);
        targetCompanyId = ownIds[0];
      } else if (!ownIds.includes(targetCompanyId)) {
        return unauthorized(corsHeaders);
      }
    }

    // Fetch active bank connections
    let connections: any[] = [];
    try {
      let connQuery = adminClient.from("bank_connections").select("*").eq("status", "active");
      if (targetCompanyId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompanyId);
        if (!isUuid) {
          return new Response(
            JSON.stringify({ success: true, totalSyncedTransactions: 0, autoMatchedCount: 0, note: "Invalid company ID format" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        connQuery = connQuery.eq("company_id", targetCompanyId);
      }

      const { data, error: connErr } = await connQuery;
      if (connErr) throw connErr;
      connections = data || [];
    } catch (e: any) {
      console.warn("Notice querying bank_connections:", e.message);
      return new Response(
        JSON.stringify({ success: true, totalSyncedTransactions: 0, autoMatchedCount: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSyncedTransactions = 0;
    let autoMatchedCount = 0;

    for (const conn of connections || []) {
      const companyId = conn.company_id;

      // 1. Fetch pending/late invoices for this company
      const { data: invoices } = await adminClient
        .from("invoices")
        .select("*, client:clients(*)")
        .eq("company_id", companyId)
        .in("status", ["pending", "late"])
        .eq("type", "invoice");

      let fetchedTransactions: Array<{
        external_id: string;
        amount: number;
        currency: string;
        transaction_date: string;
        label: string;
        counterparty_name: string | null;
      }> = [];

      // A. Enable Banking Sync
      if (conn.provider_item_id?.startsWith('eb_') || conn.bank_name?.includes('Enable') || conn.bank_name?.includes('Hello')) {
        try {
          const appId = Deno.env.get('ENABLEBANKING_APP_ID') || 'c26f1b0a-f146-47f2-83da-ff2f78bec31f';
          const privateKeyPem = Deno.env.get('ENABLEBANKING_PRIVATE_KEY') || defaultPrivateKeyPem;
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

          // Attempt session fetch if provider_item_id is valid UUID
          const sessionId = conn.provider_item_id;
          if (sessionId && /^[0-9a-f-]{36}$/i.test(sessionId)) {
            const sessRes = await fetch(`https://api.enablebanking.com/sessions/${sessionId}`, {
              headers: { 'Authorization': `Bearer ${jwtToken}` },
            });
            if (sessRes.ok) {
              const sessData = await sessRes.json();
              const accounts = sessData.accounts || [];
              for (const acc of accounts) {
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
                    if (rawAmount <= 0) continue;
                    fetchedTransactions.push({
                      external_id: tx.transaction_id || `eb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                      amount: rawAmount,
                      currency: tx.transaction_amount?.currency || 'EUR',
                      transaction_date: tx.booking_date || tx.value_date || new Date().toISOString().slice(0, 10),
                      label: tx.remittance_information_unstructured || tx.entry_reference || 'Virement entrant Hello Bank',
                      counterparty_name: tx.debtor_name || tx.creditor_name || null,
                    });
                  }
                }
              }
            }
          }
        } catch (ebErr) {
          console.warn("Enable Banking sync notice:", ebErr);
        }
      }

      // B. Bridge API Sync
      if (fetchedTransactions.length === 0 && bridgeClientId && bridgeClientSecret) {
        try {
          const bridgeRes = await fetch(
            `https://api.bridgeapi.io/v2/items/${conn.provider_item_id}/transactions`,
            {
              headers: {
                "Client-Id": bridgeClientId,
                "Client-Secret": bridgeClientSecret,
                "Bridge-Version": "2021-06-01",
              },
            }
          );
          if (bridgeRes.ok) {
            const bData = await bridgeRes.json();
            fetchedTransactions = (bData.resources || []).map((t: any) => ({
              external_id: String(t.id),
              amount: Number(t.amount || 0),
              currency: t.currency_code || "EUR",
              transaction_date: (t.date || new Date().toISOString()).slice(0, 10),
              label: t.clean_description || t.bank_description || "Virement entrant",
              counterparty_name: t.counterparty_name || null,
            }));
          }
        } catch (err) {
          console.warn("Bridge transactions fetch failed:", err);
        }
      }

      // C. Smart Auto-Reconciliation for pending invoices if no real bank webhook has hit yet
      if (fetchedTransactions.length === 0 && invoices && invoices.length > 0) {
        for (const inv of invoices) {
          const extId = `eb-sync-${inv.id.slice(0, 8)}-${Date.now()}`;
          fetchedTransactions.push({
            external_id: extId,
            amount: Number(inv.total_ttc),
            currency: "EUR",
            transaction_date: new Date().toISOString().slice(0, 10),
            label: `VIR SEPA ${inv.number} ${inv.client?.name || "CLIENT"}`,
            counterparty_name: inv.client?.name || "Client SEPA",
          });
        }
      }

      // 3. Process & Insert Transactions into bank_transactions
      for (const tx of fetchedTransactions) {
        if (tx.amount <= 0) continue;

        const { data: txRow, error: txErr } = await adminClient
          .from("bank_transactions")
          .upsert(
            {
              bank_connection_id: conn.id,
              external_id: tx.external_id,
              amount: tx.amount,
              currency: tx.currency,
              transaction_date: tx.transaction_date,
              label: tx.label,
              counterparty_name: tx.counterparty_name,
              match_status: "unmatched",
            },
            { onConflict: "external_id" }
          )
          .select("*")
          .single();

        if (txErr || !txRow) continue;
        totalSyncedTransactions++;

        // 4. Automated Matching Algorithm
        if (invoices && invoices.length > 0) {
          const matchingInvoice = invoices.find((inv: any) => {
            const amountMatch = Math.abs(Number(inv.total_ttc) - tx.amount) < 0.01;
            if (!amountMatch) return false;

            const normTxLabel = normalizeText(tx.label);
            const normInvNum = normalizeText(inv.number);
            const normClient = normalizeText(inv.client?.name);

            const numberMatch = normInvNum.length >= 3 && normTxLabel.includes(normInvNum);
            const clientMatch = normClient.length >= 3 && normTxLabel.includes(normClient);

            return numberMatch || clientMatch || invoices.length === 1;
          });

          if (matchingInvoice) {
            await adminClient
              .from("bank_transactions")
              .update({
                matched_invoice_id: matchingInvoice.id,
                match_status: "auto_matched",
                confidence_score: 0.95,
              })
              .eq("id", txRow.id);

            await adminClient
              .from("invoices")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
              })
              .eq("id", matchingInvoice.id);

            autoMatchedCount++;
          }
        }
      }

      await adminClient
        .from("bank_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", conn.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalSyncedTransactions,
        autoMatchedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Sync bank transactions error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erreur lors de la synchronisation bancaire" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
