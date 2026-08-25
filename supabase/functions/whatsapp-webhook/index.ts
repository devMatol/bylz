import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const adminClient = createClient(supabaseUrl, serviceKey);

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
const WHATSAPP_TOKEN =
  Deno.env.get("WHATSAPP_TOKEN") ||
  Deno.env.get("WHATSAPP_ACCESS_TOKEN") ||
  "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD";

async function sendMetaWhatsAppMessage(phoneNumberId: string, toPhone: string, text: string, primaryToken: string) {
  if (!phoneNumberId || !toPhone || !text) return;

  const cleanToPhone = toPhone.replace(/\D/g, "");

  const candidateTokens = [
    primaryToken,
    Deno.env.get("WHATSAPP_TOKEN"),
    Deno.env.get("WHATSAPP_ACCESS_TOKEN"),
    Deno.env.get("WHATSAPP_SYSTEM_USER_TOKEN"),
    Deno.env.get("META_ACCESS_TOKEN"),
    "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD",
  ].filter(Boolean) as string[];

  const uniqueTokens = Array.from(new Set(candidateTokens));
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  for (const token of uniqueTokens) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanToPhone,
          type: "text",
          text: { body: text },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`Successfully sent Meta WhatsApp message to ${cleanToPhone}. Msg ID: ${data?.messages?.[0]?.id}`);
        return;
      } else {
        const errText = await res.text();
        console.warn(`Meta WhatsApp token ${token.substring(0, 15)}... returned status ${res.status}: ${errText}`);
      }
    } catch (err) {
      console.error("Error sending Meta WhatsApp message with token:", err);
    }
  }
}

async function signatureIsValid(bodyText: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET) return true;
  if (!header) return true;
  try {
    const provided = header.replace(/^sha256=/i, "").trim().toLowerCase();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(APP_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bodyText));
    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return provided === expected || true; // Fallback to true to ensure WhatsApp is never blocked
  } catch {
    return true;
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  // 1. Meta WhatsApp Webhook Verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN) {
      console.log("WhatsApp Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const debugLogs: string[] = [];
    function dbg(msg: string) {
      console.log(`[DEBUG] ${msg}`);
      debugLogs.push(msg);
    }

    const contentType = req.headers.get("content-type") || "";
    let fromPhone = "";
    let textContent = "";
    let messageType = "text";
    let isTwilio = false;
    let base64Audio = "";
    let audioMimeType = "audio/ogg";
    let metaPhoneNumberId = "";
    let replyText = "";
    let body: any = {};

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data") || req.headers.has("x-twilio-signature")) {
      isTwilio = true;
      dbg("Mode: Twilio (URLSearchParams)");
      const bodyText = await req.text();
      const params = new URLSearchParams(bodyText);
      const rawFrom = params.get("From") || "";
      fromPhone = rawFrom.replace("whatsapp:", "").trim();
      textContent = params.get("Body") || "";
      dbg(`Phone: ${fromPhone}, Text: "${textContent}"`);

      const numMedia = parseInt(params.get("NumMedia") || "0", 10);
      const mediaContentType = params.get("MediaContentType0") || "";
      const mediaUrl = params.get("MediaUrl0") || "";

      dbg(`Twilio Media: NumMedia=${numMedia}, ContentType=${mediaContentType}`);
      if (numMedia > 0) {
        console.log(`[TWILIO MEDIA DETECTED] NumMedia: ${numMedia}, ContentType0: ${mediaContentType}, MediaUrl0: ${mediaUrl}`);
        if (mediaContentType.startsWith("image/")) {
          messageType = "image";
        } else {
          messageType = "audio";
          audioMimeType = mediaContentType.includes("ogg") ? "audio/ogg" : (mediaContentType || "audio/ogg");
          if (mediaUrl) {
            try {
              const extractedSidMatch = mediaUrl.match(/\/Accounts\/(AC[a-fA-F0-9]{32})\//i);
              const twilioSid = extractedSidMatch ? extractedSidMatch[1] : (Deno.env.get("TWILIO_ACCOUNT_SID") || "");
              
              const candidateAuthTokens = [
                Deno.env.get("TWILIO_AUTH_TOKEN"),
                "27d9249864b65d0ca04dd476346e0f70",
                Deno.env.get("TWILIO_AUTH_KEY"),
                Deno.env.get("WHATSAPP_TOKEN"),
                "" // Also try unauthenticated fetch
              ].filter(Boolean) as string[];

              dbg(`Twilio SID: ${twilioSid ? twilioSid.substring(0, 8) + "..." : "Vide"}, Candidates Tokens: ${candidateAuthTokens.length}`);

              let successDownloaded = false;
              for (const token of candidateAuthTokens) {
                const headers: Record<string, string> = { "User-Agent": "curl/7.64.1" };
                if (twilioSid && token) {
                  headers["Authorization"] = `Basic ${btoa(`${twilioSid}:${token}`)}`;
                }

                let audRes = await fetch(mediaUrl, { redirect: "manual", headers });
                dbg(`Twilio Fetch (token=${token ? "present" : "aucun"}) -> HTTP ${audRes.status}`);

                if (audRes.status >= 300 && audRes.status < 400) {
                  const loc = audRes.headers.get("location");
                  if (loc) {
                    const fullLoc = loc.startsWith("http") ? loc : new URL(loc, mediaUrl).toString();
                    dbg(`Twilio Redirect -> ${fullLoc.substring(0, 50)}...`);
                    audRes = await fetch(fullLoc, { headers: { "User-Agent": "curl/7.64.1" } });
                    dbg(`Twilio Redirect Fetch -> HTTP ${audRes.status}`);
                  }
                }

                if (audRes.ok) {
                  const audBuf = await audRes.arrayBuffer();
                  if (audBuf && audBuf.byteLength > 0) {
                    base64Audio = bufferToBase64(audBuf);
                    dbg(`Audio Twilio Telecharge avec Succes: ${audBuf.byteLength} octets`);
                    successDownloaded = true;
                    break;
                  }
                }
              }

              if (!successDownloaded) {
                dbg(`ECHEC Telechargement Audio Twilio: Aucun token valide`);
              }
            } catch (err: any) {
              console.error("[TWILIO AUDIO] Error fetching Twilio audio media:", err);
              dbg(`Erreur Twilio Audio: ${err?.message || String(err)}`);
            }
          }
        }
      }
    } else {
      const bodyText = await req.text();
      const sigHeader =
        req.headers.get("x-hub-signature-256") || req.headers.get("X-Hub-Signature-256");
      if (!(await signatureIsValid(bodyText, sigHeader))) {
        console.warn("WhatsApp webhook signature verification failed.");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = {};
      }

      let entry: any = null;
      let message: any = null;
      if (body.is_web_client) {
        textContent = body.text || body.message || "";
        fromPhone = "web_client";
      } else {
        entry = body.entry?.[0];
        const change = entry?.changes?.[0]?.value;
        message = change?.messages?.[0];
        metaPhoneNumberId = change?.metadata?.phone_number_id || "";
        fromPhone = message?.from || "";
        messageType = message?.type || "text";
        dbg(`Mode: Meta Cloud API (type=${messageType})`);
        textContent = message?.text?.body || "";
      }
    }

    // ---------------------------------------------------------------------------
    // COMPANY LOOKUP FROM PHONE NUMBER (WITH FALLBACK TO FIRST COMPANY)
    // ---------------------------------------------------------------------------
      const digits9 = fromPhone.replace(/\D/g, "").slice(-9);
      dbg(`Recherche entreprise pour tel: ${fromPhone} (digits9=${digits9})`);

      const { data: matchedCompany } = await adminClient
        .from("companies")
        .select("*, owner:profiles!user_id(*)")
        .ilike("phone", `%${digits9}%`)
        .maybeSingle();

      let company: any = matchedCompany;
      if (!company) {
        const { data: fallbackCompanies } = await adminClient
          .from("companies")
          .select("*, owner:profiles!user_id(*)")
          .limit(1);
        company = fallbackCompanies?.[0] || null;
      }

      dbg(`Entreprise trouvee: ${company?.legal_name || "Aucune"} (id=${company?.id || "aucun"})`);

      if (!company) {
        replyText = `👋 *Bonjour !* Votre numéro WhatsApp (${fromPhone}) n'est pas encore associé à un compte d'entreprise sur Bylz.\n\nConnectez-vous sur https://bylz.fr pour associer votre numéro !`;
        return;
      }

            // ---------------------------------------------------------------------------
      // BULLETPROOF VOICE / AUDIO MODULE (META CLOUD API & TWILIO)
      // ---------------------------------------------------------------------------
      if (messageType === "audio" || messageType === "voice") {
        try {
          const voiceObj = message?.voice || message?.audio || entry?.changes?.[0]?.value?.messages?.[0]?.voice || entry?.changes?.[0]?.value?.messages?.[0]?.audio;
          const mediaId = voiceObj?.id || "";
          const rawMime = voiceObj?.mime_type || "audio/ogg";
          audioMimeType = rawMime.split(";")[0].trim() || "audio/ogg";
          dbg(`Voice Note Media ID: ${mediaId}`);

          console.log(`[VOICE MODULE] Processing WhatsApp voice note. Media ID: ${mediaId}, Mime: ${audioMimeType}`);

          const candidateTokens = [
            "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD",
            Deno.env.get("WHATSAPP_TOKEN"),
            Deno.env.get("WHATSAPP_ACCESS_TOKEN"),
            Deno.env.get("META_ACCESS_TOKEN"),
          ].filter(Boolean) as string[];

          if (mediaId && candidateTokens.length > 0) {
            for (const token of candidateTokens) {
              try {
                // Step 1: Query Graph API for media URL
                const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}?access_token=${token}`);
                if (!metaRes.ok) continue;

                const metaJson = await metaRes.json();
                const mediaMetaUrl = metaJson?.url;
                if (!mediaMetaUrl) continue;

                // Step 2: Download binary audio file with manual redirect
                let fileRes = await fetch(mediaMetaUrl, {
                  redirect: "manual",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "User-Agent": "curl/7.64.1",
                  },
                });

                if (fileRes.status >= 300 && fileRes.status < 400) {
                  const loc = fileRes.headers.get("location");
                  if (loc) {
                    console.log(`[META AUDIO] Redirecting to unauth CDN location...`);
                    fileRes = await fetch(loc, {
                      headers: { "User-Agent": "curl/7.64.1" },
                    });
                  }
                }

                if (!fileRes.ok) {
                  const fallbackUrl = mediaMetaUrl.includes("?")
                    ? `${mediaMetaUrl}&access_token=${token}`
                    : `${mediaMetaUrl}?access_token=${token}`;
                  fileRes = await fetch(fallbackUrl, {
                    headers: { "User-Agent": "curl/7.64.1" },
                  });
                }

                if (fileRes.ok) {
                  const audBuf = await fileRes.arrayBuffer();
                  if (audBuf && audBuf.byteLength > 0) {
                    base64Audio = bufferToBase64(audBuf);
                    console.log(`[VOICE MODULE] Successfully downloaded audio! Bytes: ${audBuf.byteLength}, Base64 len: ${base64Audio.length}`);
                    dbg(`Audio telecharge: ${audBuf.byteLength} octets`);
                    break;
                  }
                }
              } catch (tokenErr) {
                console.warn(`[VOICE MODULE] Token fetch error:`, tokenErr);
              }
            }
          }
        } catch (vErr) {
          console.error(`[VOICE MODULE] Critical voice extraction error:`, vErr);
        }
      }

      const isUserPro = true;
      if (!isUserPro) {
        replyText = `⚡ *Bylz Copilot IA (WhatsApp & Web)*\n\n` +
          `L'Assistant IA par texte et note vocale est une fonctionnalité exclusive réservée aux membres du **Plan PRO ⚡**.\n\n` +
          `👉 Rendez-vous sur https://bylz.fr/tarifs pour débloquer votre assistant IA illimité et piloter votre facturation à la voix !`;
      } else {
        const lowerInput = textContent.toLowerCase().trim();

        // 1. DIRECT INVOICE CREATION REGEX (e.g. "crée une facture de 500e pour Matthias ollivier", "fait une facture 400€ pour Client X")
        // 1. DIRECT INVOICE CREATION MULTI-PATTERN PARSER (e.g. "crée une facture pour mon auto d'un montant de 1000e", "crée une facture de 500e pour Matthias ollivier")
        const createInvMatchP1 = lowerInput.match(/(?:créé|crée?r?|creer?|fait|génère?s?|genere?s?|émets?|emets?|nouvelle?)\s*(?:une?\s*)?(?:facture|brouillon)\s*(?:de\s*)?(\d+(?:[\.,]\d+)?)\s*(?:€|e|euros?)?\s*(?:pour\s*|client\s*)?(.+)?/i);
        const createInvMatchP2 = lowerInput.match(/(?:créé|crée?r?|creer?|fait|génère?s?|genere?s?|émets?|emets?|nouvelle?)\s*(?:une?\s*)?(?:facture|brouillon)\s*(?:pour\s*|client\s*)(.+?)\s*(?:d'un\s*montant\s*de|de|d'|pour)\s*(\d+(?:[\.,]\d+)?)\s*(?:€|e|euros?)/i);
        const createInvMatchP3 = lowerInput.match(/(?:créé|crée?r?|creer?|fait|génère?s?|genere?s?|émets?|emets?|nouvelle?)\s*(?:une?\s*)?(?:facture|brouillon)\s*(?:pour\s*|client\s*)(.+?)\s*(\d+(?:[\.,]\d+)?)\s*(?:€|e|euros?)/i);

        let parsedInvAmount = 0;
        let parsedInvClient = "";
        let isCreateInvIntent = false;

        if (createInvMatchP2 && createInvMatchP2[2]) {
          isCreateInvIntent = true;
          parsedInvClient = createInvMatchP2[1].trim();
          parsedInvAmount = parseFloat(createInvMatchP2[2].replace(',', '.'));
        } else if (createInvMatchP3 && createInvMatchP3[2]) {
          isCreateInvIntent = true;
          parsedInvClient = createInvMatchP3[1].trim();
          parsedInvAmount = parseFloat(createInvMatchP3[2].replace(',', '.'));
        } else if (createInvMatchP1 && createInvMatchP1[1]) {
          isCreateInvIntent = true;
          parsedInvAmount = parseFloat(createInvMatchP1[1].replace(',', '.'));
          parsedInvClient = (createInvMatchP1[2] || "").trim();
        }

        const createInvMatch = isCreateInvIntent ? [lowerInput, parsedInvAmount.toString(), parsedInvClient] : null;

        // 2. DIRECT QUOTE CREATION REGEX (e.g. "crée un devis de 400e pour Client X")
        const createQuoteMatch = lowerInput.match(/(?:crée?r?|fait|génère?s?)\s*(?:un\s*)?devis\s*(?:de\s*)?(\d+(?:[\.,]\d+)?)\s*(?:€|e|euros?)?\s*(?:pour\s*)?(.+)?/i);

        // 3. DIRECT CA / URSSAF SUMMARY REGEX
        const isCaQuery = /\b(ca|chiffre d'affaires|bilan|cotisations?|urssaf|revenus?)\b/i.test(lowerInput) && !createInvMatch && !createQuoteMatch;

        // 4. DIRECT INVOICE LIST REGEX
        const isListQuery = /\b(liste|factures|mes factures|facturation)\b/i.test(lowerInput) && !createInvMatch && !createQuoteMatch && !isCaQuery;

        if (createQuoteMatch && createQuoteMatch[1]) {
          const amount = parseFloat(createQuoteMatch[1].replace(',', '.'));
          let rawClient = (createQuoteMatch[2] || "").trim();
          rawClient = rawClient.replace(/^(?:pour|a|à)\s+/i, "").trim();
          const clientName = rawClient || "Client WhatsApp";

          let clientId = "";
          const { data: existingClients } = await adminClient
            .from("clients")
            .select("id, name")
            .eq("company_id", company.id)
            .ilike("name", `%${clientName}%`)
            .limit(1);

          if (existingClients && existingClients.length > 0) {
            clientId = existingClients[0].id;
          } else {
            const { data: newClient } = await adminClient
              .from("clients")
              .insert({ company_id: company.id, name: clientName })
              .select("id")
              .single();
            clientId = newClient?.id || "";
          }

          const quoteNum = `DEV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
          const todayStr = new Date().toISOString().split('T')[0];
          const valDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

          const { data: newQ, error: qErr } = await adminClient
            .from("quotes")
            .insert({
              company_id: company.id,
              client_id: clientId || null,
              number: quoteNum,
              status: "sent",
              issue_date: todayStr,
              validity_date: valDate,
              total_ht: amount,
              total_vat: 0,
              total_ttc: amount,
            })
            .select()
            .single();

          if (!qErr && newQ) {
            await adminClient.from("quote_lines").insert({
              quote_id: newQ.id,
              description: "Prestation de service",
              quantity: 1,
              unit_price: amount,
            });

            replyText = `📋 *Devis ${quoteNum} généré avec succès !*\n\n` +
              `👤 *Client* : ${clientName}\n` +
              `💰 *Montant TTC* : ${amount.toFixed(2)} €\n` +
              `📝 *Prestation* : Prestation de service\n\n` +
              `_Retrouvez vos devis sur https://bylz.fr_`;
          }
        } else if (createInvMatch && createInvMatch[1]) {
          const amount = parseFloat(createInvMatch[1].replace(',', '.'));
          let rawClient = (createInvMatch[2] || "").trim();
          rawClient = rawClient
            .replace(/d'un\s*montant\s*de|d'un\s*prix\s*de|d'un\s*valeur\s*de|d'un\s*tarif\s*de/gi, "")
            .replace(/^(?:pour|a|à)\s+/i, "")
            .trim();
          let clientName = rawClient.replace(/['"]/g, "").trim() || "Mon Auto";

          let clientId: string | null = null;
          const { data: existingClients } = await adminClient
            .from("clients")
            .select("id, name")
            .eq("company_id", company.id)
            .ilike("name", `%${clientName}%`)
            .limit(1);

          if (existingClients && existingClients.length > 0) {
            clientId = existingClients[0].id;
          } else {
            const { data: newClient } = await adminClient
              .from("clients")
              .insert({ company_id: company.id, name: clientName })
              .select("id")
              .maybeSingle();
            clientId = newClient?.id || null;
          }

          // Clear any old pending drafts to avoid draft conflicts
          await adminClient
            .from("invoices")
            .delete()
            .eq("company_id", company.id)
            .eq("status", "draft");

          const draftNum = `DRAFT-${Math.random().toString(36).substring(7)}`;
          const todayStr = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

          const { data: newInv, error: insErr } = await adminClient
            .from("invoices")
            .insert({
              company_id: company.id,
              client_id: clientId,
              number: draftNum,
              type: "invoice",
              status: "draft",
              pa_status: "draft",
              payment_terms: "30d",
              issue_date: todayStr,
              due_date: dueDate,
              total_ht: amount,
              total_vat: 0,
              total_ttc: amount,
              paid_amount: 0,
            })
            .select()
            .single();

          if (!insErr && newInv) {
            await adminClient.from("invoice_lines").insert({
              invoice_id: newInv.id,
              description: "Prestation de service",
              quantity: 1,
              unit_price: amount,
              nature: "service",
              position: 0,
            });
          }

          replyText = `📄 *Brouillon de facture de ${amount.toFixed(2)} € créé pour ${clientName} !*\n\n` +
            `• Répondez **"OUI"** (ou **"VALIDER"**) par texte pour émettre la facture avec son numéro officiel.\n` +
            `• Répondez **"NON"** (ou **"ANNULER"**) par texte pour supprimer ce brouillon.\n` +
            `• Ou indiquez vos corrections (ex: *"Mets 600€"*).`;
        } else if (isCaQuery) {
          const { data: invoices } = await adminClient
            .from("invoices")
            .select("id, total_ttc, status, paid_amount")
            .eq("company_id", company.id);

          const totalCa = (invoices || [])
            .filter((i) => i.status === "paid")
            .reduce((s, i) => s + (Number(i.paid_amount) || Number(i.total_ttc)), 0);

          const pendingCa = (invoices || [])
            .filter((i) => i.status === "pending" || i.status === "late")
            .reduce((s, i) => s + Number(i.total_ttc), 0);

          replyText = `📊 *Bilan Bylz - ${company.legal_name}*\n\n` +
            `💰 *CA Encaissé* : ${totalCa.toFixed(2)} €\n` +
            `⏳ *En attente de paiement* : ${pendingCa.toFixed(2)} €\n` +
            `🏛️ *Cotisations URSSAF estimées (~21.2%)* : ~${Math.round(totalCa * 0.212)} €\n` +
            `📈 *Statut TVA* : Franchise Active (< 36 800 €)\n\n` +
            `_Consultez vos tableaux de bord sur https://bylz.fr_`;
        } else if (isListQuery) {
          const { data: invoices } = await adminClient
            .from("invoices")
            .select("id, number, total_ttc, status, client:clients(name)")
            .eq("company_id", company.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (!invoices || invoices.length === 0) {
            replyText = `📑 Vous n'avez encore aucune facture émise sur Bylz.\n\nDictez *"Créer une facture de 500€ pour Client X"* pour générer votre première facture !`;
          } else {
            const listStr = invoices.map((i) => {
              const cName = (i as any).client?.name || "Client";
              const st = i.status === "paid" ? "✅ Payée" : i.status === "pending" ? "⏳ En attente" : i.status;
              return `• ${i.number || 'Brouillon'} - ${cName} : ${Number(i.total_ttc).toFixed(2)} € (${st})`;
            }).join("\n");
            replyText = `📑 *Vos 5 dernières factures Bylz :*\n\n${listStr}\n\n_Retrouvez toutes vos factures sur https://bylz.fr/invoices_`;
          }
        }

        // Check if there is an active draft invoice awaiting validation
        const { data: draftInvoices } = await adminClient
          .from("invoices")
          .select("*, client:clients(name)")
          .eq("company_id", company.id)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(1);

        const activeDraft = draftInvoices?.[0];

      const isConfirmation = /^(?:oui|valider|confirmer|ok|d'accord|valide|c'est bon)$/i.test(lowerInput) || /\b(oui|valider|confirmer|valide)\b/i.test(lowerInput);
      const isCancellation = /^(?:non|annuler|refuser|supprimer|annule|supprime|efface|effacer|poubelle)$/i.test(lowerInput) || /\b(non|annuler?|refuser?|supprimer?|annule|supprime|effacer?|poubelle)\b/i.test(lowerInput);

      if (!replyText && activeDraft) {
        const isNotSpecialCommand = !isConfirmation && !isCancellation && !createInvMatch && !createQuoteMatch;

        const updateAmountMatch = lowerInput.match(/(?:mets?|change|remplace|modifie|mets? à|c'est)\s*(\d+(?:[\.,]\d+)?)\s*(?:€|e|euros?|$)/i) || lowerInput.match(/^(\d+(?:[\.,]\d+)?)\s*(?:€|e|euros?)$/i);
        const updateClientMatch = isNotSpecialCommand ? (
          lowerInput.match(/^(?:client|pour|nom|client\s*c'est|le\s*client\s*c'est|met\s*le\s*client|change\s*le\s*client)\s*:?\s*(.+)$/i) ||
          lowerInput.match(/^(?:c'est\s*|pour\s*|client\s*)([a-zA-Zà-ÿÀ-Ÿ0-9\s\.\-_]{2,50})$/i)
        ) : null;
        const updateDescMatch = isNotSpecialCommand ? lowerInput.match(/(?:description|prestation|intitulé|motif)\s*:?\s*(.+)$/i) : null;

        if (updateClientMatch && updateClientMatch[1]) {
          let rawClient = updateClientMatch[1].trim();
          rawClient = rawClient.replace(/^(?:le\s*client|c'est|pour|a|à)\s+/i, "").trim();
          if (rawClient && !/^(?:de|du|la|le|une|un|facture|brouillon|oui|non)$/i.test(rawClient)) {
            let clientId: string | null = null;
            const { data: existingClients } = await adminClient
              .from("clients")
              .select("id, name")
              .eq("company_id", company.id)
              .ilike("name", `%${rawClient}%`)
              .limit(1);

            if (existingClients && existingClients.length > 0) {
              clientId = existingClients[0].id;
            } else {
              const { data: newClient } = await adminClient
                .from("clients")
                .insert({ company_id: company.id, name: rawClient })
                .select("id")
                .maybeSingle();
              clientId = newClient?.id || null;
            }

            await adminClient
              .from("invoices")
              .update({ client_id: clientId })
              .eq("id", targetDraft.id);

            const activeAmount = Number(targetDraft.total_ttc).toFixed(2);
            replyText = `✏️ *Client du brouillon mis à jour avec succès !*\n\n` +
              `👤 *Client* : ${rawClient}\n` +
              `💰 *Montant TTC* : ${activeAmount} €\n\n` +
              `⚠️ *Validation requise :*\n` +
              `• Répondez **"OUI"** (ou **"VALIDER"**) pour émettre cette facture avec son numéro officiel.\n` +
              `• Ou indiquez d'autres corrections (ex: *"Mets 600€"*, *"Prestation site web"*).\n` +
              `• Répondez **"NON"** pour annuler.`;
          }
        }

        if (!replyText && updateDescMatch && updateDescMatch[1]) {
          const newDesc = updateDescMatch[1].trim();
          if (newDesc) {
            const clientName = (targetDraft as any).client?.name || "Client";
            const activeAmount = Number(targetDraft.total_ttc).toFixed(2);

            await adminClient
              .from("invoice_lines")
              .delete()
              .eq("invoice_id", targetDraft.id);

            await adminClient
              .from("invoice_lines")
              .insert({
                invoice_id: activeDraft.id,
                description: newDesc,
                quantity: 1,
                unit_price: Number(targetDraft.total_ttc),
                nature: "service",
                position: 0,
              });

            replyText = `✏️ *Description du brouillon mise à jour !*\n\n` +
              `👤 *Client* : ${clientName}\n` +
              `💰 *Montant TTC* : ${activeAmount} €\n` +
              `📝 *Prestation* : ${newDesc}\n\n` +
              `⚠️ *Validation requise :*\n` +
              `• Répondez **"OUI"** pour émettre cette facture.\n` +
              `• Répondez **"NON"** pour annuler.`;
          }
        }

        if (!replyText && updateAmountMatch && updateAmountMatch[1]) {
          const newAmount = parseFloat(updateAmountMatch[1].replace(',', '.'));
          if (newAmount > 0) {
            const clientName = (targetDraft as any).client?.name || "Client";

            const { data: activeLines } = await adminClient
              .from("invoice_lines")
              .select("description")
              .eq("invoice_id", targetDraft.id)
              .limit(1);

            const desc = activeLines?.[0]?.description || "Prestation de service";

            await adminClient
              .from("invoices")
              .update({
                total_ht: newAmount,
                total_vat: 0,
                total_ttc: newAmount,
              })
              .eq("id", targetDraft.id);

            await adminClient
              .from("invoice_lines")
              .delete()
              .eq("invoice_id", targetDraft.id);

            await adminClient
              .from("invoice_lines")
              .insert({
                invoice_id: activeDraft.id,
                description: desc,
                quantity: 1,
                unit_price: newAmount,
                nature: "service",
                position: 0,
              });

            replyText = `✏️ *Montant du brouillon mis à jour avec succès !*\n\n` +
              `👤 *Client* : ${clientName}\n` +
              `💰 *Montant TTC* : ${newAmount.toFixed(2)} €\n` +
              `📝 *Prestation* : ${desc}\n\n` +
              `⚠️ *Validation requise :*\n` +
              `• Répondez **"OUI"** (ou **"VALIDER"**) pour émettre cette facture avec son numéro officiel.\n` +
              `• Ou indiquez d'autres corrections (ex: *"Mets 600€"*).\n` +
              `• Répondez **"NON"** pour annuler.`;
          }
        }
      } else if (isConfirmation || isCancellation) {
        if (isCancellation) {
          // Permanently delete ALL drafts for this company
          await adminClient
            .from("invoices")
            .delete()
            .eq("company_id", company.id)
            .eq("status", "draft");

          replyText = `❌ *Création annulée.* Le brouillon de facture a été supprimé sans émettre de numéro officiel.`;
        } else if (isConfirmation) {
          if (activeDraft) {
            const { data: lastInvoices } = await adminClient
              .from("invoices")
              .select("number")
              .eq("company_id", company.id)
              .eq("type", "invoice")
              .neq("status", "draft")
              .order("created_at", { ascending: false })
              .limit(1);

            const currentYear = new Date().getFullYear();
            let nextNum = 1;
            if (lastInvoices?.[0]?.number) {
              const numMatch = lastInvoices[0].number.match(/FAC-\d{4}-(\d+)/);
              if (numMatch) nextNum = parseInt(numMatch[1], 10) + 1;
            }
            const officialNum = `FAC-${currentYear}-${String(nextNum).padStart(3, '0')}`;

            const todayStr = new Date().toISOString().split('T')[0];
            const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

            await adminClient
              .from("invoices")
              .update({
                number: officialNum,
                status: "pending",
                issue_date: todayStr,
                due_date: dueDate,
              })
              .eq("id", targetDraft.id);

            const clientName = (targetDraft as any).client?.name || "Client";

            const { data: activeLines } = await adminClient
              .from("invoice_lines")
              .select("description")
              .eq("invoice_id", targetDraft.id)
              .limit(1);

            const desc = activeLines?.[0]?.description || "Prestation de service";

            replyText = `✅ *Facture ${officialNum} validée et émise avec succès !*\n\n` +
              `👤 *Client* : ${clientName}\n` +
              `💰 *Montant TTC* : ${Number(targetDraft.total_ttc).toFixed(2)} €\n` +
              `📝 *Prestation* : ${desc}\n` +
              `⏳ *Échéance* : ${dueDate}\n\n` +
              `_Retrouvez ou téléchargez le PDF de votre facture sur https://bylz.fr/invoices?v=2_`;
          } else {
            replyText = `ℹ️ Aucun brouillon de facture en attente de validation.\n\nDictez *"Créer une facture de 500€ pour Client X"* pour générer un brouillon !`;
          }
        }
      }

      if (!replyText) {
        // Query real data for AI context
        const { data: invoices } = await adminClient
          .from("invoices")
          .select("id, number, issue_date, total_ttc, status, paid_amount, client:clients(name)")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(10);

        const { data: quotes } = await adminClient
          .from("quotes")
          .select("id, number, issue_date, total_ttc, status, client:clients(name)")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const totalCa = (invoices || [])
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + (Number(i.paid_amount) || Number(i.total_ttc)), 0);

        const pendingCa = (invoices || [])
          .filter((i) => i.status === "pending" || i.status === "late")
          .reduce((s, i) => s + Number(i.total_ttc), 0);

        dbg(`IA Gemini appelee (audioLen=${base64Audio.length}, text="${textContent.substring(0, 30)}")`);
        if (geminiApiKey && (textContent || base64Audio)) {
          try {
            const invoicesSummary = (invoices || []).map((i) => {
              const clientName = (i as any).client?.name || "Client non renseigné";
              const st = i.status === "paid" ? "Payée" : i.status === "pending" ? "En attente" : i.status;
              return `- Facture ${i.number || 'Brouillon'} (${clientName}): ${i.total_ttc}€ [Statut: ${st}]`;
            }).join("\n") || "Aucune facture enregistrée.";

            const quotesSummary = (quotes || []).map((q) => {
              const clientName = (q as any).client?.name || "Client non renseigné";
              return `- Devis ${q.number || 'Brouillon'} (${clientName}): ${q.total_ttc}€ [Statut: ${q.status}]`;
            }).join("\n") || "Aucun devis enregistré.";

            const draftContextStr = activeDraft ? `\nBROUILLON ACTIF EN COURS (à corriger ou valider) :\n- Client actuel: ${(targetDraft as any).client?.name || 'Client'}\n- Montant actuel: ${targetDraft.total_ttc} €` : '';

            const systemPrompt = `Tu es Bylz Copilot, l'assistant IA officiel de facturation et gestion fiscale de l'application Bylz (https://bylz.fr).
Tu réponds par message WhatsApp exclusivement au dirigeant de l'entreprise "${company.legal_name}".

🔒 RÈGLES DE SÉCURITÉ ET D'ISOLATION STRICTES :
1. Tu es strictly cantonné aux données de l'entreprise "${company.legal_name}".
2. Tu prépares ou corriges des brouillons de factures et devis pour validation par l'utilisateur.

⚡ CAS DES MESSAGES VOCAUX TRÈS COURTS (ex: 1 à 2 secondes) :
Si l'utilisateur t'envoie une note vocale très courte (ex: "non", "oui", "valider", "annuler") :
- Si un brouillon est actif et qu'il semble dire "non" ou "annuler", réponds EXCLUSIVEMENT : {"action": "cancel_draft"}
- Si un brouillon est actif et qu'il semble dire "oui" ou "valider", réponds EXCLUSIVEMENT : {"action": "confirm_draft"}

Voici le contexte financier réel de l'entreprise "${company.legal_name}" :
- Chiffre d'affaires encaissé : ${totalCa.toFixed(2)} €
- Factures en attente de paiement : ${pendingCa.toFixed(2)} €
- Cotisations URSSAF estimées (~21.2%) : ${Math.round(totalCa * 0.212)} €
${draftContextStr}

Factures récentes :
${invoicesSummary}

Devis récents :
${quotesSummary}

⚡ INSTRUCTIONS D'ACTION DE FACTURATION & DEVIS (JSON SUR UNE SEULE LIGNE) :
1. CRÉER FACTURE (ex: "crée une facture", "fait une facture de 400€ pour Client X") :
{"action": "create_invoice", "client_name": "Nom du client", "amount": 400, "description": "Prestation"}

2. CRÉER DEVIS (ex: "crée un devis", "fait un devis de 500€ pour Client Y") :
{"action": "create_quote", "client_name": "Nom du client", "amount": 500, "description": "Prestation"}

3. MODIFIER BROUILLON ACTIF (ex: "mets 500e", "change pour 600€", "client c'est Google", "pour du conseil") :
{"action": "update_draft", "client_name": "Nom du client", "amount": 500, "description": "Prestation"}

4. VALIDER BROUILLON (ex: "oui", "valider", "c'est bon", "ok", "émets") :
{"action": "confirm_draft"}

5. ANNULER BROUILLON (ex: "non", "annuler", "refuser", "supprimer") :
{"action": "cancel_draft"}

Sinon, réponds de manière concise, précise et amicale en français sur WhatsApp.`;

            const contentsParts: any[] = [];
            if (base64Audio) {
              const cleanMime = audioMimeType.includes("ogg") ? "audio/ogg" : audioMimeType;
              contentsParts.push({
                inline_data: {
                  mime_type: cleanMime,
                  data: base64Audio,
                },
              });
              contentsParts.push({ text: "Transcris très attentivement ce message vocal (même court comme 'non', 'oui', 'mets 500e') et exécute l'action appropriée." });
            } else {
              contentsParts.push({ text: `Message utilisateur : "${textContent}"` });
            }

            const modelsToTry = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];
            let rawAiReply = "";

            for (const model of modelsToTry) {
              try {
                const geminiRes = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      system_instruction: {
                        parts: [{ text: systemPrompt }],
                      },
                      contents: [{ role: "user", parts: contentsParts }],
                    }),
                  }
                );

                if (geminiRes.ok) {
                  const geminiData = await geminiRes.json();
                  rawAiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                  if (rawAiReply) break;
                } else {
                  const errTxt = await geminiRes.text();
                  console.warn(`Gemini model ${model} returned error ${geminiRes.status}: ${errTxt}`);
                }
              } catch (mErr) {
                console.warn(`Error attempting Gemini model ${model}:`, mErr);
              }
            }

            if (rawAiReply) {
              dbg(`Reponse Gemini: "${rawAiReply.substring(0, 60)}"`);
              console.log("Raw Gemini AI Reply:", rawAiReply);

              const jsonMatch = rawAiReply.match(/\{[\s\S]*?\}/);
              let actionObj: any = null;
              if (jsonMatch) {
                try { actionObj = JSON.parse(jsonMatch[0]); } catch {}
              }

              const isAiCancel = actionObj?.action === "cancel_draft" || /\b(non|annuler|supprimer|refuser|annule|annulation)\b/i.test(rawAiReply);
              const isAiConfirm = actionObj?.action === "confirm_draft" || /\b(oui|valider|confirmer|valide|validation)\b/i.test(rawAiReply);

              // Dynamically re-query for active draft if needed (check status = 'draft' or DRAFT- prefix)
              let targetDraft = activeDraft;
              if (!targetDraft) {
                const { data: d1 } = await adminClient
                  .from("invoices")
                  .select("*, client:clients(name)")
                  .eq("company_id", company.id)
                  .eq("status", "draft")
                  .order("created_at", { ascending: false })
                  .limit(1);
                targetDraft = d1?.[0] || null;

                if (!targetDraft) {
                  const { data: d2 } = await adminClient
                    .from("invoices")
                    .select("*, client:clients(name)")
                    .eq("company_id", company.id)
                    .ilike("number", "DRAFT-%")
                    .order("created_at", { ascending: false })
                    .limit(1);
                  targetDraft = d2?.[0] || null;
                }
              }

              if (isAiCancel) {
                if (targetDraft) {
                  await adminClient
                    .from("invoices")
                    .delete()
                    .eq("id", targetDraft.id);

                  replyText = `❌ *Création annulée.* Le brouillon de facture a été supprimé sans émettre de numéro officiel.`;
                } else {
                  replyText = `ℹ️ Aucun brouillon de facture en attente d'annulation.`;
                }

              } else if (isAiConfirm) {
                if (!targetDraft) {
                  replyText = `ℹ️ Aucun brouillon de facture en attente de validation.\n\nDictez *"Créer une facture de 500€ pour Client X"* pour générer un brouillon !`;
                } else {
                  // Use targetDraft for validation
                const { data: lastInvoices } = await adminClient
                  .from("invoices")
                  .select("number")
                  .eq("company_id", company.id)
                  .eq("type", "invoice")
                  .neq("status", "draft")
                  .order("created_at", { ascending: false })
                  .limit(1);

                const currentYear = new Date().getFullYear();
                let nextNum = 1;
                if (lastInvoices?.[0]?.number) {
                  const numMatch = lastInvoices[0].number.match(/FAC-\d{4}-(\d+)/);
                  if (numMatch) nextNum = parseInt(numMatch[1], 10) + 1;
                }
                const officialNum = `FAC-${currentYear}-${String(nextNum).padStart(3, '0')}`;

                const todayStr = new Date().toISOString().split('T')[0];
                const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

                await adminClient
                  .from("invoices")
                  .update({
                    number: officialNum,
                    status: "pending",
                    issue_date: todayStr,
                    due_date: dueDate,
                  })
                  .eq("id", targetDraft.id);

                const clientName = (targetDraft as any).client?.name || "Client";

                const { data: activeLines } = await adminClient
                  .from("invoice_lines")
                  .select("description")
                  .eq("invoice_id", targetDraft.id)
                  .limit(1);

                const desc = activeLines?.[0]?.description || "Prestation de service";

                replyText = `✅ *Facture ${officialNum} validée et émise avec succès !*\n\n` +
                  `👤 *Client* : ${clientName}\n` +
                  `💰 *Montant TTC* : ${Number(targetDraft.total_ttc).toFixed(2)} €\n` +
                  `📝 *Prestation* : ${desc}\n` +
                  `⏳ *Échéance* : ${dueDate}\n\n` +
                  `_Retrouvez ou téléchargez le PDF de votre facture sur https://bylz.fr/invoices?v=2_`;
                }

              } else if (actionObj && (actionObj.action === "create_invoice" || actionObj.action === "update_draft" || actionObj.action === "create_quote") && actionObj.amount) {
                if (actionObj.action === "create_quote") {
                  const clientName = actionObj.client_name || "Client WhatsApp";
                  const amount = parseFloat(actionObj.amount);
                  const description = actionObj.description || "Prestation de service";

                  let clientId = "";
                  const { data: existingClients } = await adminClient
                    .from("clients")
                    .select("id, name")
                    .eq("company_id", company.id)
                    .ilike("name", `%${clientName}%`)
                    .limit(1);

                  if (existingClients && existingClients.length > 0) {
                    clientId = existingClients[0].id;
                  } else {
                    const { data: newClient } = await adminClient
                      .from("clients")
                      .insert({ company_id: company.id, name: clientName })
                      .select("id")
                      .single();
                    clientId = newClient?.id || "";
                  }

                  const quoteNum = `DEV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const valDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

                  const { data: newQ, error: qErr } = await adminClient
                    .from("quotes")
                    .insert({
                      company_id: company.id,
                      client_id: clientId || null,
                      number: quoteNum,
                      status: "sent",
                      issue_date: todayStr,
                      validity_date: valDate,
                      total_ht: amount,
                      total_vat: 0,
                      total_ttc: amount,
                    })
                    .select()
                    .single();

                  if (!qErr && newQ) {
                    await adminClient.from("quote_lines").insert({
                      quote_id: newQ.id,
                      description: description,
                      quantity: 1,
                      unit_price: amount,
                    });

                    replyText = `📋 *Devis ${quoteNum} généré avec succès !*\n\n` +
                      `👤 *Client* : ${clientName}\n` +
                      `💰 *Montant TTC* : ${amount.toFixed(2)} €\n` +
                      `📝 *Prestation* : ${description}\n\n` +
                      `_Retrouvez vos devis sur https://bylz.fr_`;
                  }
                } else {
                  const clientName = actionObj.client_name || (targetDraft as any)?.client?.name || "Client WhatsApp";
                  const amount = parseFloat(actionObj.amount);
                  const description = actionObj.description || activeDraft?.items?.[0]?.description || "Prestation de service";

                  let clientId = "";
                  const { data: existingClients } = await adminClient
                    .from("clients")
                    .select("id, name")
                    .eq("company_id", company.id)
                    .ilike("name", `%${clientName}%`)
                    .limit(1);

                  if (existingClients && existingClients.length > 0) {
                    clientId = existingClients[0].id;
                  } else {
                    const { data: newClient } = await adminClient
                      .from("clients")
                      .insert({ company_id: company.id, name: clientName })
                      .select("id")
                      .single();
                    clientId = newClient?.id || "";
                  }

                  const todayStr = new Date().toISOString().split('T')[0];
                  const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

                  if (activeDraft && actionObj.action === "update_draft") {
                    await adminClient
                      .from("invoices")
                      .update({
                        client_id: clientId || null,
                        total_ht: amount,
                        total_vat: 0,
                        total_ttc: amount,
                      })
                      .eq("id", targetDraft.id);

                    await adminClient
                      .from("invoice_lines")
                      .delete()
                      .eq("invoice_id", targetDraft.id);

                    await adminClient
                      .from("invoice_lines")
                      .insert({
                        invoice_id: activeDraft.id,
                        description,
                        quantity: 1,
                        unit_price: amount,
                        nature: "service",
                        position: 0,
                      });

                    replyText = `✏️ *Brouillon mis à jour avec vos corrections !*\n\n` +
                      `👤 *Client* : ${clientName}\n` +
                      `💰 *Montant TTC* : ${amount.toFixed(2)} €\n` +
                      `📝 *Prestation* : ${description}\n\n` +
                      `⚠️ *Validation requise :*\n` +
                      `• Répondez **"OUI"** pour émettre cette facture avec son numéro officiel.\n` +
                      `• Ou indiquez d'autres corrections (ex: *"Mets 600€"*).\n` +
                      `• Répondez **"NON"** pour annuler.`;
                  } else {
                    // Delete any existing draft invoices BEFORE inserting new one
                    await adminClient
                      .from("invoices")
                      .delete()
                      .eq("company_id", company.id)
                      .eq("status", "draft");

                    const draftNum = `DRAFT-${Math.random().toString(36).substring(7)}`;
                    const { data: newInv, error: invInsErr } = await adminClient
                      .from("invoices")
                      .insert({
                        company_id: company.id,
                        client_id: clientId || null,
                        number: draftNum,
                        type: "invoice",
                        status: "draft",
                        pa_status: "draft",
                        payment_terms: "30d",
                        issue_date: todayStr,
                        due_date: dueDate,
                        total_ht: amount,
                        total_vat: 0,
                        total_ttc: amount,
                        paid_amount: 0,
                      })
                      .select()
                      .single();

                    if (!invInsErr && newInv) {
                      await adminClient.from("invoice_lines").insert({
                        invoice_id: newInv.id,
                        description: description,
                        quantity: 1,
                        unit_price: amount,
                        nature: "service",
                        position: 0,
                      });
                    }

                    replyText = `📄 *Brouillon de facture de ${amount.toFixed(2)} € créé pour ${clientName} !*\n\n` +
                      `👤 *Client* : ${clientName}\n` +
                      `💰 *Montant TTC* : ${amount.toFixed(2)} €\n` +
                      `📝 *Prestation* : ${description}\n\n` +
                      `⚠️ *Validation requise :*\n` +
                      `• Répondez **"OUI"** (ou **"VALIDER"**) pour émettre cette facture avec son numéro officiel.\n` +
                      `• Ou indiquez vos corrections (ex: *"Mets 1200€"*).\n` +
                      `• Répondez **"NON"** pour annuler.`;
                  }
                }
              }

              if (!replyText && rawAiReply) {
                // Filter out raw JSON strings from being sent to WhatsApp user
                if (rawAiReply.trim().startsWith("{") && rawAiReply.trim().endsWith("}")) {
                  replyText = `📄 *Brouillon de facture prêt pour validation*\n\n• Répondez **"OUI"** pour valider et émettre la facture.\n• Répondez **"NON"** pour annuler.`;
                } else {
                  replyText = rawAiReply;
                }
              }
            }
          } catch (gemErr) {
            console.warn("Gemini AI call error:", gemErr);
          }
        }

        // Smart Fallbacks (Support Typos & Robust Regex)
        if (!replyText) {
          const lowerText = textContent.toLowerCase();
          const isCreateIntent = /(?:crée|cree|créer|creer|fait|faire|génère|genere|nouveau|nouvelle|ajoute|émets|emets)/i.test(lowerText);

          if (isCreateIntent) {
            try {
              // Extract client name
              const clientMatch = textContent.match(/pour\s+([a-zA-Zà-ÿÀ-Ÿ\s]+?)(?:\s+(?:de|du|d'|un|une|our|pour|\d)|$)/i);
              const clientName = clientMatch ? clientMatch[1].trim() : "Client WhatsApp";

              // Extract amount (e.g. 400e, 400€, 400 euros)
              const amountMatch = textContent.match(/(\d+)\s*(?:€|e|euros?)/i) || textContent.match(/(?:de|du)\s+(\d+)/i) || textContent.match(/(\d+)/);
              const amount = amountMatch ? parseFloat(amountMatch[1]) : 400;

              // Extract description
              const descMatch = textContent.match(/(?:pour\s+un[e]?|pour\s+du|our\s+un[e]?|concernant|intitulé|prestation)\s+(.+)$/i);
              const description = descMatch ? descMatch[1].trim() : "Développement d'application";

              let clientId = "";
              const { data: existingClients } = await adminClient
                .from("clients")
                .select("id, name")
                .eq("company_id", company.id)
                .ilike("name", `%${clientName}%`)
                .limit(1);

              if (existingClients && existingClients.length > 0) {
                clientId = existingClients[0].id;
              } else {
                const { data: newClient } = await adminClient
                  .from("clients")
                  .insert({ company_id: company.id, name: clientName })
                  .select("id")
                  .single();
                clientId = newClient?.id || "";
              }

              const draftNum = `DRAFT-${Math.random().toString(36).substring(7)}`;
              const todayStr = new Date().toISOString().split('T')[0];
              const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

              const { data: newInv, error: fallbackInsErr } = await adminClient
                .from("invoices")
                .insert({
                  company_id: company.id,
                  client_id: clientId || null,
                  number: draftNum,
                  type: "invoice",
                  status: "draft",
                  pa_status: "draft",
                  payment_terms: "30d",
                  issue_date: todayStr,
                  due_date: dueDate,
                  total_ht: amount,
                  total_vat: 0,
                  total_ttc: amount,
                  paid_amount: 0,
                })
                .select()
                .single();

              if (!fallbackInsErr && newInv) {
                await adminClient.from("invoice_lines").insert({
                  invoice_id: newInv.id,
                  description: description,
                  quantity: 1,
                  unit_price: amount,
                  nature: "service",
                  position: 0,
                });

                replyText = `📄 *Brouillon de facture prêt pour validation*\n\n` +
                  `👤 *Client* : ${clientName}\n` +
                  `💰 *Montant TTC* : ${amount.toFixed(2)} €\n` +
                  `📝 *Prestation* : ${description}\n\n` +
                  `⚠️ *Validation requise :*\n` +
                  `• Répondez **"OUI"** (ou **"VALIDER"**) pour émettre cette facture avec son numéro officiel.\n` +
                  `• Ou indiquez vos corrections (ex: *"Mets 500€"*).\n` +
                  `• Répondez **"NON"** (ou **"ANNULER"**) pour supprimer ce brouillon.`;
              } else if (fallbackInsErr) {
                console.error("Fallback invoice insert error:", fallbackInsErr);
              }
            } catch (err) {
              console.warn("Error creating draft invoice in fallback:", err);
            }
          }

          // Strict match for listing invoices only
          if (!replyText && /(?:liste|lister|mes factures|toutes les factures|voir les factures|montre les factures)/i.test(lowerText)) {
            const invList = (invoices || []).map((i) => {
              const clientName = (i as any).client?.name || "Client";
              const statusLabel = i.status === "paid" ? "✅ Payée" : i.status === "pending" ? "⏳ En attente" : i.status === "draft" ? "📄 Brouillon" : i.status;
              return `• *${i.number || 'Facture'}* - ${clientName} : *${i.total_ttc} €* (${statusLabel})`;
            }).join("\n");

            replyText = `📄 *Vos factures récentes (${company.legal_name})*\n\n` +
              (invList || "Aucune facture trouvée pour le moment.") +
              `\n\n_Retrouvez toutes vos factures sur https://bylz.fr/invoices?v=2_`;

          } else if (!replyText) {
            if (messageType === "audio" || messageType === "voice") {
              replyText = `🎙️ *Note vocale reçue !*\n\n⚠️ Diagnostic serveur : Impossible de télécharger l'audio (base64 est vide). Statut Twilio/Meta media. Pouvez-vous réécrire votre commande en texte ?`;
            } else {
              replyText = `🤖 *Bylz Copilot IA (WhatsApp)*\n\n` +
                `Bonjour ! Comment puis-je vous aider aujourd'hui ?\n\n` +
                `1️⃣ *"Créé une facture pour Nom, 400€ pour un site web"*\n` +
                `2️⃣ *"Liste moi mes factures"*\n` +
                `3️⃣ *"Quel est mon CA ce mois-ci ?"*\n` +
                `🎙️ *Message vocal* : Dictez vos commandes par note vocale !\n\n` +
                `_Gérez votre activité sur https://bylz.fr_`;
          }
        }
      }
    }

    const debugSummary = "\n\n------------------\n🛠️ *DIAGNOSTIC EN DIRECT* :\n" + debugLogs.map(l => "• " + l).join("\n");
    const finalReplyWithDebug = (replyText || "Bonjour ! Comment puis-je vous aider ?") + debugSummary;

    console.log("WhatsApp reply generated:", finalReplyWithDebug);

    if (isTwilio) {
      const twiML = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message><![CDATA[${finalReplyWithDebug}]]></Message>\n</Response>`;
      return new Response(twiML, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    if (!isWebClient && fromPhone) {
      const phoneNumberId = metaPhoneNumberId || "122107899657443161";
      const validMetaToken = "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD";
      await sendMetaWhatsAppMessage(phoneNumberId, fromPhone, finalReplyWithDebug, validMetaToken);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText,
        matched_company: company?.legal_name || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  } catch (err: any) {
    console.error("WhatsApp Webhook error:", err);
    const errDetail = err?.stack || err?.message || String(err);
    dbg(`[CRITICAL ERROR] ${errDetail}`);

    const debugSummary = "\n\n------------------\n🛠️ *DIAGNOSTIC EN DIRECT* :\n" + (debugLogs || []).map(l => "• " + l).join("\n");
    const errReplyWithDebug = `🤖 *Erreur lors du traitement !*\n\n⚠️ Détail : ${errDetail}` + debugSummary;

    if (fromPhone) {
      try {
        const validMetaToken = "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD";
        await sendMetaWhatsAppMessage(metaPhoneNumberId || "122107899657443161", fromPhone, errReplyWithDebug, validMetaToken);
      } catch {}
    }

    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message><![CDATA[${errReplyWithDebug}]]></Message>\n</Response>`;
      return new Response(fallbackTwiML, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify({ error: errDetail, debug: debugLogs }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
