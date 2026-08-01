import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

interface ReminderRuleRow {
  id: string;
  company_id: string;
  enabled: boolean;
  delay_days: number;
  tone: "friendly" | "firm" | "formal";
  custom_subject: string | null;
  custom_body: string | null;
}

function formatAmountFR(num: number): string {
  return `${Number(num).toFixed(2).replace(".", ",")} €`;
}

function formatDateFR(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildReminderText(
  tone: "friendly" | "firm" | "formal",
  vars: {
    client_name: string;
    invoice_number: string;
    amount_ttc: number;
    due_date: string;
    payment_link?: string | null;
    is_b2b?: boolean;
    custom_subject?: string | null;
    custom_body?: string | null;
  }
): { subject: string; body: string } {
  const formattedAmount = formatAmountFR(vars.amount_ttc);
  const formattedDueDate = formatDateFR(vars.due_date);

  let defaultSubject = "";
  let defaultBody = "";

  if (tone === "friendly") {
    defaultSubject = `Rappel amical : Facture ${vars.invoice_number}`;
    defaultBody = `Bonjour ${vars.client_name},\n\nSauf erreur ou omission de notre part, nous n'avons pas encore reçu le règlement de la facture ${vars.invoice_number} d'un montant de ${formattedAmount}, qui était arrivée à échéance le ${formattedDueDate}.\n\nPourriez-vous vérifier s'il s'agit d'un simple oubli ?${vars.payment_link ? `\n\nVous pouvez procéder au règlement directement en ligne ici : ${vars.payment_link}` : ""}\n\nEn vous remerciant par avance.\n\nCordialement,`;
  } else if (tone === "firm") {
    defaultSubject = `Relance importante : Facture ${vars.invoice_number} en retard de paiement`;
    defaultBody = `Bonjour ${vars.client_name},\n\nNous vous informons que la facture ${vars.invoice_number} d'un montant de ${formattedAmount}, due au ${formattedDueDate}, demeure impayée à ce jour.\n\nNous vous demandons de bien vouloir régulariser cette situation dans les meilleurs délais.${vars.payment_link ? `\n\nAccès au règlement immédiat : ${vars.payment_link}` : ""}\n\nSi votre virement est déjà en cours, merci de ne pas tenir compte de ce message.\n\nCordialement,`;
  } else {
    defaultSubject = `MISE EN DEMEURE - Facture ${vars.invoice_number} impayée`;
    const b2bLegalMention = vars.is_b2b
      ? `\n\nConformément aux dispositions de l'article L441-10 du Code de commerce, tout retard de paiement entraîne l'exigibilité de plein droit d'une indemnité forfaitaire pour frais de recouvrement de 40,00 € ainsi que l'application de pénalités de retard.`
      : "";
    defaultBody = `Madame, Monsieur ${vars.client_name},\n\nMalgré nos précédentes relances, la facture ${vars.invoice_number} d'un montant de ${formattedAmount} (échéance du ${formattedDueDate}) reste à ce jour totalement impayée.\n\nNous vous prions de bien vouloir procéder à son règlement immédiat.${b2bLegalMention}${vars.payment_link ? `\n\nRèglement sécurisé en ligne : ${vars.payment_link}` : ""}\n\nÀ défaut de réception sous 48h, nous serons contraints de transmettre ce dossier à notre service recouvrement.\n\nCompte tenu de l'urgence, merci d'accorder votre meilleure attention à ce message.\n\nCordialement,`;
  }

  let subject = vars.custom_subject || defaultSubject;
  let body = vars.custom_body || defaultBody;

  const replaceMap: Record<string, string> = {
    "{{client_name}}": vars.client_name,
    "{{invoice_number}}": vars.invoice_number,
    "{{amount_ttc}}": formattedAmount,
    "{{due_date}}": formattedDueDate,
    "{{payment_link}}": vars.payment_link || "",
  };

  for (const [key, val] of Object.entries(replaceMap)) {
    subject = subject.replaceAll(key, val);
    body = body.replaceAll(key, val);
  }

  return { subject, body };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Configuration Supabase manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(todayStr).getTime();

    // 1. Query pending / late invoices
    let invoices: any[] = [];
    try {
      const { data, error: invErr } = await adminClient
        .from("invoices")
        .select("*, company:companies(*), client:clients(*)")
        .in("status", ["pending", "late"])
        .eq("type", "invoice");
      
      if (invErr) throw invErr;
      invoices = (data || []).filter((inv: any) => !inv.auto_reminders_disabled);
    } catch (e: any) {
      console.warn("Notice querying invoices in process-scheduled-reminders:", e.message);
      return new Response(
        JSON.stringify({ success: true, processedCount: 0, sentCount: 0, message: "No active invoices" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let skippedNoEmailCount = 0;
    let sentCount = 0;
    const errors: string[] = [];

    for (const inv of invoices || []) {
      const company = inv.company;
      const client = inv.client;

      // Skip if company master toggle is disabled
      if (company && company.auto_reminders_enabled === false) {
        continue;
      }

      // Compute days late
      const dueTime = new Date(inv.due_date).getTime();
      if (isNaN(dueTime) || todayTime <= dueTime) {
        continue; // Not late yet
      }
      const daysLate = Math.floor((todayTime - dueTime) / 86400000);

      // Fetch company reminder rules
      let { data: rules } = await adminClient
        .from("reminder_rules")
        .select("*")
        .eq("company_id", inv.company_id)
        .order("delay_days", { ascending: true });

      // Seed default rules if none exist
      if (!rules || rules.length === 0) {
        const defaultRules = [
          { company_id: inv.company_id, enabled: true, delay_days: 7, tone: "friendly" },
          { company_id: inv.company_id, enabled: true, delay_days: 14, tone: "firm" },
          { company_id: inv.company_id, enabled: true, delay_days: 30, tone: "formal" },
        ];
        const { data: seeded } = await adminClient
          .from("reminder_rules")
          .insert(defaultRules)
          .select("*");
        rules = seeded as ReminderRuleRow[];
      }

      // Find matching rule for exact or past delay
      const matchingRule = (rules as ReminderRuleRow[])
        .filter((r) => r.enabled && r.delay_days <= daysLate)
        .sort((a, b) => b.delay_days - a.delay_days)[0];

      if (!matchingRule) continue;

      // Idempotency: Check if this rule or today's reminder was already logged
      const { data: existingReminders } = await adminClient
        .from("invoice_reminders")
        .select("*")
        .eq("invoice_id", inv.id);

      const alreadySentRule = (existingReminders || []).some(
        (r: any) => r.rule_id === matchingRule.id || r.days_late === matchingRule.delay_days
      );
      const alreadySentToday = (existingReminders || []).some(
        (r: any) => r.sent_at && r.sent_at.slice(0, 10) === todayStr
      );

      if (alreadySentRule || alreadySentToday) {
        continue;
      }

      processedCount++;

      // Check client email
      if (!client || !client.email || !client.email.trim()) {
        await adminClient.from("invoice_reminders").insert({
          invoice_id: inv.id,
          sent_at: new Date().toISOString(),
          days_late: daysLate,
          source: "skipped_no_email",
          rule_id: matchingRule.id,
          tone: matchingRule.tone,
        });
        skippedNoEmailCount++;
        continue;
      }

      // Generate Email Content
      const emailContent = buildReminderText(matchingRule.tone, {
        client_name: client.name || "Client",
        invoice_number: inv.number,
        amount_ttc: Number(inv.total_ttc || 0),
        due_date: inv.due_date,
        payment_link: inv.stripe_payment_link,
        is_b2b: client.type === "b2b",
        custom_subject: matchingRule.custom_subject,
        custom_body: matchingRule.custom_body,
      });

      // Send Email via Resend if key exists
      let emailSuccess = false;
      if (resendKey) {
        const companyName = company?.commercial_name || company?.legal_name || "Bylz";
        const publicToken = inv.public_token || inv.id;
        const publicUrl = `https://bylz.fr/v/${publicToken}`;

        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${companyName} via Bylz <no-reply@bylz.fr>`,
              to: client.email,
              subject: emailContent.subject,
              text: `${emailContent.body}\n\nConsulter en ligne : ${publicUrl}`,
              reply_to: company?.email || "support@bylz.fr",
            }),
          });
          if (resendRes.ok) emailSuccess = true;
        } catch (e: any) {
          errors.push(`Email send failed for invoice ${inv.number}: ${e.message}`);
        }
      } else {
        emailSuccess = true; // Simulated in test/dev
      }

      // Log success in invoice_reminders
      await adminClient.from("invoice_reminders").insert({
        invoice_id: inv.id,
        sent_at: new Date().toISOString(),
        days_late: daysLate,
        source: "automatic",
        rule_id: matchingRule.id,
        tone: matchingRule.tone,
        recipient_email: client.email,
      });

      // Create Notification
      if (company?.user_id) {
        await adminClient.from("notifications").insert({
          user_id: company.user_id,
          type: "reminder_sent",
          title: "Relance automatique envoyée",
          message: `Relance (${matchingRule.tone === "friendly" ? "Amicale" : matchingRule.tone === "firm" ? "Ferme" : "Formelle"}) envoyée à ${client.name} pour la facture ${inv.number}.`,
          read: false,
        });
      }

      sentCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        sentCount,
        skippedNoEmailCount,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in process-scheduled-reminders edge function:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
