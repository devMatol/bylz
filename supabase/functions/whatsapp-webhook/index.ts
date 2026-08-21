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

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio Webhook (form-urlencoded)
      isTwilio = true;
      const formData = await req.formData();
      const rawFrom = formData.get("From")?.toString() || ""; // e.g. "whatsapp:+33612345678"
      fromPhone = rawFrom.replace("whatsapp:", "").trim();
      textContent = formData.get("Body")?.toString() || "";
      const numMedia = parseInt(formData.get("NumMedia")?.toString() || "0", 10);
      if (numMedia > 0) {
        const mediaContentType = formData.get("MediaContentType0")?.toString() || "";
        if (mediaContentType.startsWith("image/")) {
          messageType = "image";
        } else if (mediaContentType.startsWith("audio/")) {
          messageType = "audio";
        }
      }
    } else {
      // Meta Cloud API Webhook (JSON)
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
    }

    if (!fromPhone && !textContent) {
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
      // 3. Query real data for AI context
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

      // 4. Try Gemini AI generation
      if (geminiApiKey && textContent) {
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

          const systemPrompt = `Tu es Bylz Copilot, l'assistant IA de l'application de facturation et gestion fiscale Bylz (https://bylz.fr).
Tu réponds par message WhatsApp exclusivement au dirigeant de l'entreprise "${company.legal_name}".

🔒 RÈGLES DE SÉCURITÉ ET D'ISOLATION STRICTES :
1. Tu es strictement cantonné aux données de l'entreprise "${company.legal_name}". Tu ne dois jamais traiter ou divulguer d'informations externes.
2. Tu es un assistant sécurisé et non-destructif. Tu ne peux pas supprimer, modifier ou altérer les données comptables/financières en base de données.
3. Pour toute action de modification complexe ou de suppression, invite l'utilisateur à se connecter sur son espace sécurisé : https://bylz.fr.

Voici le contexte financier réel et certifié de l'entreprise "${company.legal_name}" :
- Chiffre d'affaires encaissé : ${totalCa.toFixed(2)} €
- Factures en attente de paiement : ${pendingCa.toFixed(2)} €
- Estimation des cotisations URSSAF (~21.2%) : ${Math.round(totalCa * 0.212)} €

Factures récentes :
${invoicesSummary}

Devis récents :
${quotesSummary}

Règles de réponse :
1. Réponds de manière concise, précise et amicale en français sur WhatsApp.
2. Utilise le formatage WhatsApp (ex: *texte en gras*) et des émojis pertinents.
3. Si l'utilisateur demande la liste de ses factures (ex: "liste moi mes factures"), énumère clairement les factures ci-dessus avec leurs numéros, clients, montants et statuts !
4. Si l'utilisateur demande son CA ou son URSSAF, donne les chiffres exacts indiqués ci-dessus.
5. Ne dépasse jamais 1500 caractères.`;

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      { text: systemPrompt },
                      { text: `Message utilisateur : "${textContent}"` }
                    ]
                  }
                ]
              })
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiReply && aiReply.trim()) {
              replyText = aiReply.trim();
            }
          } else {
            console.warn("Gemini API HTTP Error:", geminiRes.status, await geminiRes.text());
          }
        } catch (gemErr) {
          console.warn("Gemini AI call error:", gemErr);
        }
      }

      // 5. Smart Fallback if Gemini AI didn't return text
      if (!replyText) {
        const lowerText = textContent.toLowerCase();

        if (lowerText.includes("liste") || lowerText.includes("mes factures") || lowerText.includes("vos factures") || (lowerText.includes("facture") && !lowerText.includes("crée"))) {
          const invList = (invoices || []).map((i) => {
            const clientName = (i as any).client?.name || "Client";
            const statusLabel = i.status === "paid" ? "✅ Payée" : i.status === "pending" ? "⏳ En attente" : i.status;
            return `• *${i.number || 'Facture'}* - ${clientName} : *${i.total_ttc} €* (${statusLabel})`;
          }).join("\n");

          replyText = `📄 *Vos factures récentes (${company.legal_name})*\n\n` +
            (invList || "Aucune facture trouvée pour le moment.") +
            `\n\n_Retrouvez toutes vos factures sur https://bylz.fr/invoices?v=2_`;

        } else if (lowerText.includes("ca") || lowerText.includes("chiffre") || lowerText.includes("solde") || lowerText.includes("urssaf") || lowerText.includes("tva")) {
          replyText = `📊 *Bilan Bylz - ${company.legal_name}*\n\n` +
            `💰 *CA Encaissé* : ${totalCa.toFixed(2)} €\n` +
            `⏳ *En attente de paiement* : ${pendingCa.toFixed(2)} €\n` +
            `🏛️ *Cotisations URSSAF estimées* : ~${Math.round(totalCa * 0.212)} €\n` +
            `📈 *Statut TVA* : Franchise Active (<36 800 €)\n\n` +
            `_Consultez vos tableaux de bord sur https://bylz.fr_`;

        } else if (messageType === "image") {
          replyText = `📸 *Justificatif reçu*\n\n` +
            `Votre reçu/ticket a été transmis. Retrouvez vos justificatifs enregistrés sur https://bylz.fr/invoices !`;

        } else {
          replyText = `🤖 *Bylz Copilot IA (WhatsApp)*\n\n` +
            `Bonjour ! Comment puis-je vous aider aujourd'hui ?\n\n` +
            `1️⃣ *"Liste moi mes factures"*\n` +
            `2️⃣ *"Quel est mon CA ce mois-ci ?"*\n` +
            `3️⃣ *"Quel est le montant de mon URSSAF ?"*\n\n` +
            `_Gérez votre activité sur https://bylz.fr_`;
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
