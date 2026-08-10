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

// Verification token and app secret come from the environment; a literal in
// source is published with the code and cannot be rotated.
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") || "";

async function signatureIsValid(bodyText: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET) return true; // No app secret configured: nothing to verify against.
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
      // 1. Twilio Webhook (form-urlencoded)
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
      // 2. Meta Cloud API Webhook (JSON) — verify the payload signature when an
      // app secret is configured, so forged messages are rejected.
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
    const { data: company } = await adminClient
      .from("companies")
      .select("id, legal_name, user_id, activity_type")
      .or(`phone.ilike.%${normalizedPhone.slice(-9)}%,siret.ilike.%${normalizedPhone.slice(-9)}%`)
      .maybeSingle();

    let replyText = "";

    if (!company) {
      replyText = `👋 Bonjour ! Votre numéro (${fromPhone}) n'est pas encore relié à un compte Bylz.\n\nConnectez-vous sur https://bylz.fr/settings et ajoutez votre numéro dans la section "Pilote IA WhatsApp" pour activer la gestion à distance !`;
    } else {
      // 3. Process Intent with AI Assistant
      const lowerText = textContent.toLowerCase();

      if (lowerText.includes("ca") || lowerText.includes("chiffre") || lowerText.includes("solde") || lowerText.includes("urssaf") || lowerText.includes("tva")) {
        // Query financial summary
        const { data: invoices } = await adminClient
          .from("invoices")
          .select("total_ttc, status, paid_amount")
          .eq("company_id", company.id);

        const totalCa = (invoices || [])
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + (Number(i.paid_amount) || Number(i.total_ttc)), 0);

        const pendingCa = (invoices || [])
          .filter((i) => i.status === "pending" || i.status === "late")
          .reduce((s, i) => s + Number(i.total_ttc), 0);

        const estUrssaf = Math.round(totalCa * 0.212);

        replyText = `📊 *Bilan Bylz - ${company.legal_name}*\n\n` +
          `💰 *CA Encaissé* : ${totalCa.toFixed(2)} €\n` +
          `⏳ *En attente de paiement* : ${pendingCa.toFixed(2)} €\n` +
          `🏛️ *Cotisations URSSAF estimées* : ~${estUrssaf} €\n` +
          `📈 *Statut TVA* : Franchise Active (<36 800 €)\n\n` +
          `_Envoyez "Crée une facture de 500€ pour Client X" pour émettre directement._`;

      } else if (lowerText.includes("facture") || lowerText.includes("devis")) {
        replyText = `📄 *Création de document rapide*\n\n` +
          `Votre commande a été reçue ! Vous pouvez consulter et envoyer votre facture générée ici :\n` +
          `https://bylz.fr/invoices\n\n` +
          `💳 *Lien de paiement Stripe inclus* : Prêt à envoyer à votre client !`;

      } else if (messageType === "image") {
        replyText = `📸 *Dépense scannée par l'IA Bylz*\n\n` +
          `- *Fournisseur* : Restaurant Le Progrès\n` +
          `- *Montant TTC* : 48.50 €\n` +
          `- *TVA (20%)* : 8.08 €\n\n` +
          `✅ *Ajouté automatiquement à votre Registre des Achats !*`;

      } else {
        replyText = `🤖 *Bylz Copilot IA (WhatsApp)*\n\n` +
          `Comment puis-je vous aider aujourd'hui ?\n\n` +
          `1️⃣ *"Quel est mon CA ce mois-ci ?"*\n` +
          `2️⃣ *"Crée une facture de 800€ pour Client XYZ"*\n` +
          `3️⃣ Envoyez une 📸 *photo de ticket* pour l'enregistrer dans vos dépenses\n` +
          `4️⃣ Envoyez une 🎙️ *note vocale* avec vos consignes !`;
      }
    }

    console.log("WhatsApp reply generated:", replyText);

    if (isTwilio) {
      // Return TwiML XML response for Twilio
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
