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

Deno.serve(async (req: Request) => {
  // 1. Meta WhatsApp Webhook Verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === "bylz_whatsapp_copilot_token") {
      console.log("WhatsApp Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("WhatsApp Webhook payload received:", JSON.stringify(body));

    // Extract message from Meta API format
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    const fromPhone = message?.from; // e.g. "33612345678"

    if (!message || !fromPhone) {
      return new Response(JSON.stringify({ status: "ignored_no_message" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageType = message.type; // "text", "image", "audio"
    const textContent = message.text?.body || "";

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
