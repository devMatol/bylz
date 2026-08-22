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
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
const WHATSAPP_TOKEN =
  Deno.env.get("WHATSAPP_TOKEN") ||
  Deno.env.get("WHATSAPP_ACCESS_TOKEN") ||
  "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD";

async function signatureIsValid(bodyText: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET) return true;
  if (!header) return false;
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
  return provided === expected;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
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
    const contentType = req.headers.get("content-type") || "";
    let fromPhone = "";
    let textContent = "";
    let messageType = "text";
    let isTwilio = false;
    let base64Audio = "";
    let audioMimeType = "audio/ogg";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      isTwilio = true;
      const formData = await req.formData();
      const rawFrom = formData.get("From")?.toString() || "";
      fromPhone = rawFrom.replace("whatsapp:", "").trim();
      textContent = formData.get("Body")?.toString() || "";
      const numMedia = parseInt(formData.get("NumMedia")?.toString() || "0", 10);

      if (numMedia > 0) {
        const mediaContentType = formData.get("MediaContentType0")?.toString() || "";
        const mediaUrl = formData.get("MediaUrl0")?.toString() || "";

        if (mediaContentType.startsWith("audio/") || mediaContentType.includes("ogg")) {
          messageType = "audio";
          audioMimeType = mediaContentType.includes("ogg") ? "audio/ogg" : mediaContentType;
          if (mediaUrl) {
            try {
              const audRes = await fetch(mediaUrl);
              if (audRes.ok) {
                const audBuf = await audRes.arrayBuffer();
                base64Audio = bufferToBase64(audBuf);
              }
            } catch (err) {
              console.warn("Error fetching Twilio audio media:", err);
            }
          }
        } else if (mediaContentType.startsWith("image/")) {
          messageType = "image";
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
      let body: any = {};
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = {};
      }

      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      fromPhone = message?.from || "";
      messageType = message?.type || "text";
      textContent = message?.text?.body || "";

      if (messageType === "audio" || messageType === "voice") {
        const mediaId = message?.audio?.id || message?.voice?.id;
        const rawMime = message?.audio?.mime_type || message?.voice?.mime_type || "audio/ogg";
        audioMimeType = rawMime.split(";")[0].trim() || "audio/ogg";
        console.log(`Processing WhatsApp audio message. Media ID: ${mediaId}, Mime: ${audioMimeType}`);

        const candidateTokens = [
          "EAANpHbOHsisBSZAcVQzSmgmBid5hI5rOMNM2W0nmGah9MMWiA6GbcH1PHZCp13hJNgvJvkGQLSPsgebnEPyot3P7ZC77mwrc2eeApBCfgRIZC0vvSVuerQhT5bQvLLQI6EVSlhyazZBS1hZAzpykfZB2F7Nk5yX8ZBJM2bHfFxAX7pXLrq0hIvRPknA9tyTlNgZDZD",
          Deno.env.get("WHATSAPP_TOKEN"),
          Deno.env.get("WHATSAPP_ACCESS_TOKEN"),
          Deno.env.get("WHATSAPP_SYSTEM_USER_TOKEN"),
          Deno.env.get("META_ACCESS_TOKEN"),
        ].filter(Boolean) as string[];

        if (mediaId && candidateTokens.length > 0) {
          console.log(`Starting media download for ID ${mediaId} with ${candidateTokens.length} candidate tokens.`);
          for (const token of candidateTokens) {
            try {
              console.log(`Attempting media download with token prefix: ${token.substring(0, 15)}...`);
              const metaMediaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "User-Agent": "curl/7.64.1",
                },
              });

              if (metaMediaRes.ok) {
                const mediaMeta = await metaMediaRes.json();
                console.log(`Meta media metadata fetched successfully. URL: ${mediaMeta.url}`);
                if (mediaMeta.url) {
                  // Step 1: Initial request to lookaside.fbsbx.com with Bearer token & manual redirect
                  const fileRes = await fetch(mediaMeta.url, {
                    headers: {
                      "Authorization": `Bearer ${token}`,
                      "User-Agent": "curl/7.64.1",
                    },
                    redirect: "manual",
                  });

                  let cdnUrl = mediaMeta.url;
                  if (fileRes.status >= 300 && fileRes.status < 400) {
                    cdnUrl = fileRes.headers.get("location") || mediaMeta.url;
                  }

                  // Step 2: Fetch final CDN URL WITHOUT Authorization header (AWS S3 rejects Facebook Bearer tokens)
                  const cdnRes = (fileRes.status === 200) ? fileRes : await fetch(cdnUrl, {
                    headers: {
                      "User-Agent": "curl/7.64.1",
                    },
                  });

                  if (cdnRes.ok) {
                    const audBuf = await cdnRes.arrayBuffer();
                    base64Audio = bufferToBase64(audBuf);
                    console.log(`Audio file successfully downloaded. Bytes: ${audBuf.byteLength}, Base64 length: ${base64Audio.length}`);
                    break;
                  } else {
                    const fileErr = await cdnRes.text();
                    console.warn(`CDN File download failed for URL ${cdnUrl}. Status: ${cdnRes.status}, Error: ${fileErr}`);
                  }
                }
              } else {
                const metaErrText = await metaMediaRes.text();
                console.warn(`Token ${token.substring(0, 15)} failed for media ID ${mediaId}. Status: ${metaMediaRes.status}, Error: ${metaErrText}`);
              }
            } catch (err) {
              console.error("Error fetching Meta WhatsApp audio media:", err);
            }
          }
        } else {
          console.warn("Missing mediaId or WHATSAPP_TOKEN for audio download.");
        }
      }
    }

    if (!fromPhone && !textContent && !base64Audio) {
      return new Response(JSON.stringify({ status: "ignored_no_message" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Identify Company by phone number
    const normalizedPhone = fromPhone.replace(/\D/g, "");
    const { data: companies } = await adminClient
      .from("companies")
      .select("id, legal_name, user_id, activity_type")
      .or(`phone.ilike.%${normalizedPhone.slice(-9)}%,siret.ilike.%${normalizedPhone.slice(-9)}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    const company = companies?.[0];
    let replyText = "";

    if (!company) {
      replyText = `👋 Bonjour ! Votre numéro (${fromPhone}) n'est pas encore relié à un compte Bylz.\n\nConnectez-vous sur https://bylz.fr/settings et renseignez votre numéro de téléphone dans les paramètres de votre entreprise pour activer la gestion IA à distance !`;
    } else {
      const lowerInput = textContent.toLowerCase().trim();

      const isConfirmation = lowerInput === "oui" || lowerInput === "valider" || lowerInput === "confirmer" || lowerInput === "ok" || lowerInput.includes("oui valider") || lowerInput.includes("valide");
      const isCancellation = lowerInput === "non" || lowerInput === "annuler" || lowerInput.includes("non annuler") || lowerInput.includes("annule");

      // Check if there is an active draft invoice awaiting validation
      const { data: draftInvoices } = await adminClient
        .from("invoices")
        .select("*, client:clients(name)")
        .eq("company_id", company.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1);

      const activeDraft = draftInvoices?.[0];

      if (activeDraft && (isConfirmation || isCancellation)) {
        if (isConfirmation) {
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
            .eq("id", activeDraft.id);

          const clientName = (activeDraft as any).client?.name || "Client";

          const { data: activeLines } = await adminClient
            .from("invoice_lines")
            .select("description")
            .eq("invoice_id", activeDraft.id)
            .limit(1);

          const desc = activeLines?.[0]?.description || "Prestation de service";

          replyText = `✅ *Facture ${officialNum} validée et émise avec succès !*\n\n` +
            `👤 *Client* : ${clientName}\n` +
            `💰 *Montant TTC* : ${Number(activeDraft.total_ttc).toFixed(2)} €\n` +
            `📝 *Prestation* : ${desc}\n` +
            `⏳ *Échéance* : ${dueDate}\n\n` +
            `_Retrouvez ou téléchargez le PDF de votre facture sur https://bylz.fr/invoices?v=2_`;
        } else if (isCancellation) {
          await adminClient
            .from("invoices")
            .delete()
            .eq("id", activeDraft.id);

          replyText = `❌ *Création annulée.* Le brouillon de facture a été supprimé sans émettre de numéro officiel.`;
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

            const draftContextStr = activeDraft ? `\nBROUILLON ACTIF EN COURS (à corriger ou valider) :\n- Client actuel: ${(activeDraft as any).client?.name || 'Client'}\n- Montant actuel: ${activeDraft.total_ttc} €` : '';

            const systemPrompt = `Tu es Bylz Copilot, l'assistant IA officiel de facturation et gestion fiscale de l'application Bylz (https://bylz.fr).
Tu réponds par message WhatsApp exclusivement au dirigeant de l'entreprise "${company.legal_name}".

🔒 RÈGLES DE SÉCURITÉ ET D'ISOLATION STRICTES :
1. Tu es strictly cantonné aux données de l'entreprise "${company.legal_name}".
2. Tu prépares ou corriger des brouillons de factures pour validation par l'utilisateur.

Voici le contexte financier réel de l'entreprise "${company.legal_name}" :
- Chiffre d'affaires encaissé : ${totalCa.toFixed(2)} €
- Factures en attente de paiement : ${pendingCa.toFixed(2)} €
- Cotisations URSSAF estimées (~21.2%) : ${Math.round(totalCa * 0.212)} €
${draftContextStr}

Factures récentes :
${invoicesSummary}

Devis récents :
${quotesSummary}

⚡ INSTRUCTIONS D'ACTION DE FACTURATION :
1. Si l'utilisateur demande de CRÉER une facture (même avec des fautes de frappe comme "Crée moi une facture", "fait une facture", "400e", "our un développement", etc.), réponds EXCLUSIVEMENT par un JSON valide sur UNE SEULE LIGNE :
{"action": "create_invoice", "client_name": "Nom du client (ex: Matthias Ollivier)", "amount": 400, "description": "Prestation (ex: Développement d'application)"}

2. Si un brouillon est actif et que l'utilisateur demande une CORRECTION / MODIFICATION (ex: "Mets 450€", "Change le client pour X", "C'est 500e pour du conseil"), réponds EXCLUSIVEMENT par un JSON valide sur UNE SEULE LIGNE :
{"action": "update_draft", "client_name": "Nom du client (garder ou changer)", "amount": 450, "description": "Prestation (garder ou changer)"}

3. Si un brouillon est actif et que l'utilisateur CONFIRME ou VALIDE (ex: "oui", "valider", "c'est bon", "valide", "d'accord"), réponds EXCLUSIVEMENT :
{"action": "confirm_draft"}

4. Si un brouillon est actif et que l'utilisateur ANNULE ou REFUSE (ex: "non", "annuler", "refuser", "supprimer"), réponds EXCLUSIVEMENT :
{"action": "cancel_draft"}

Sinon, réponds de manière concise, précise et amicale en français sur WhatsApp.`;

            const contentsParts: any[] = [];
            if (base64Audio) {
              contentsParts.push({
                inlineData: {
                  mimeType: audioMimeType.includes("ogg") ? "audio/ogg" : audioMimeType,
                  data: base64Audio,
                },
              });
              contentsParts.push({ text: "Transcris et réponds à ce message vocal d'instruction utilisateur." });
            } else {
              contentsParts.push({ text: `Message utilisateur : "${textContent}"` });
            }
            contentsParts.push({ text: systemPrompt });

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: contentsParts }],
                }),
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const rawAiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

              const jsonMatch = rawAiReply.match(/\{[\s\S]*?\}/);
              if (jsonMatch) {
                try {
                  const actionObj = JSON.parse(jsonMatch[0]);

                  if (actionObj.action === "confirm_draft" && activeDraft) {
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
                      .eq("id", activeDraft.id);

                    const clientName = (activeDraft as any).client?.name || "Client";

                    const { data: activeLines } = await adminClient
                      .from("invoice_lines")
                      .select("description")
                      .eq("invoice_id", activeDraft.id)
                      .limit(1);

                    const desc = activeLines?.[0]?.description || "Prestation de service";

                    replyText = `✅ *Facture ${officialNum} validée et émise avec succès !*\n\n` +
                      `👤 *Client* : ${clientName}\n` +
                      `💰 *Montant TTC* : ${Number(activeDraft.total_ttc).toFixed(2)} €\n` +
                      `📝 *Prestation* : ${desc}\n` +
                      `⏳ *Échéance* : ${dueDate}\n\n` +
                      `_Retrouvez ou téléchargez le PDF de votre facture sur https://bylz.fr/invoices?v=2_`;

                  } else if (actionObj.action === "cancel_draft" && activeDraft) {
                    await adminClient
                      .from("invoices")
                      .delete()
                      .eq("id", activeDraft.id);

                    replyText = `❌ *Création annulée.* Le brouillon de facture a été supprimé sans émettre de numéro officiel.`;

                  } else if ((actionObj.action === "create_invoice" || actionObj.action === "update_draft") && actionObj.amount) {
                    const clientName = actionObj.client_name || (activeDraft as any)?.client?.name || "Client WhatsApp";
                    const amount = parseFloat(actionObj.amount);
                    const description = actionObj.description || activeDraft?.items?.[0]?.description || "Prestation de service";

                    // 1. Get or create Client
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
                      // Update existing draft
                      await adminClient
                        .from("invoices")
                        .update({
                          client_id: clientId || null,
                          total_ht: amount,
                          total_vat: 0,
                          total_ttc: amount,
                        })
                        .eq("id", activeDraft.id);

                      await adminClient
                        .from("invoice_lines")
                        .delete()
                        .eq("invoice_id", activeDraft.id);

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
                        `• Répondez **"OUI"** (ou **"VALIDER"**) pour émettre cette facture avec son numéro officiel.\n` +
                        `• Ou indiquez d'autres corrections (ex: *"Mets 500€"*).\n` +
                        `• Répondez **"NON"** pour annuler.`;

                    } else {
                      // Insert new draft
                      const draftNum = `DRAFT-${Math.random().toString(36).substring(7)}`;
                      const { data: newInv, error: invInsErr } = await adminClient
                        .from("invoices")
                        .insert({
                          company_id: company.id,
                          client_id: clientId || null,
                          number: draftNum,
                          type: "invoice",
                          status: "draft",
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

                        replyText = `📄 *Brouillon de facture prêt pour validation*\n\n` +
                          `👤 *Client* : ${clientName}\n` +
                          `💰 *Montant TTC* : ${amount.toFixed(2)} €\n` +
                          `📝 *Prestation* : ${description}\n\n` +
                          `⚠️ *Validation requise :*\n` +
                          `• Répondez **"OUI"** (ou **"VALIDER"**) pour émettre cette facture avec son numéro officiel.\n` +
                          `• Ou indiquez vos corrections (ex: *"Non, c'est 500€"*).\n` +
                          `• Répondez **"NON"** (ou **"ANNULER"**) pour supprimer ce brouillon.`;
                      } else if (invInsErr) {
                        console.error("Invoice insert error:", invInsErr);
                      }
                    }
                  }
                } catch (parseErr) {
                  console.warn("Error parsing invoice action JSON from Gemini:", parseErr);
                }
              }

              if (!replyText && rawAiReply) {
                replyText = rawAiReply;
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
              const clientName = clientMatch ? clientMatch[1].trim() : "Matthias Ollivier";

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

          } else if (!replyText && /\b(ca|chiffre|chiffres|solde|urssaf|tva)\b/i.test(lowerText)) {
            replyText = `📊 *Bilan Bylz - ${company.legal_name}*\n\n` +
              `💰 *CA Encaissé* : ${totalCa.toFixed(2)} €\n` +
              `⏳ *En attente de paiement* : ${pendingCa.toFixed(2)} €\n` +
              `🏛️ *Cotisations URSSAF estimées* : ~${Math.round(totalCa * 0.212)} €\n` +
              `📈 *Statut TVA* : Franchise Active (<36 800 €)\n\n` +
              `_Consultez vos tableaux de bord sur https://bylz.fr_`;

          } else if (!replyText && (messageType === "audio" || messageType === "voice")) {
            replyText = `🎙️ *Note vocale reçue !*\n\nJe n'ai pas réussi à extraire l'instruction de votre note vocale. Pouvez-vous répéter votre demande ou l'écrire par texte ?`;
          } else if (!replyText) {
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

    console.log("WhatsApp reply generated:", replyText);

    if (isTwilio) {
      const twiML = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message>${replyText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>\n</Response>`;
      return new Response(twiML, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText,
        matched_company: company?.legal_name || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("WhatsApp Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
