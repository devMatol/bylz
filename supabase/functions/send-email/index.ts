/*
 * send-email Edge Function
 * ------------------------
 * POST {
 *   to: string,
 *   subject: string,
 *   body: string,
 *   document_type: 'quote' | 'invoice',
 *   document_id: string
 * }
 *
 * - Validates the caller's JWT and checks company ownership via RLS.
 * - Fetches the document + lines + company + client.
 * - Renders an A4 PDF in-memory with safe text sanitization.
 * - Generates an ultra-modern, high-impact HTML email with brand styling & CTA button.
 * - Sends the email via Resend API (RESEND_API_KEY secret).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *, Authorization, Content-Type, Apikey, X-Client-Info",
};

interface LineRow {
  description: string;
  quantity: number;
  unit_price: number;
  nature: string;
  position: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

function sanitizePdfText(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/€/g, "EUR")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/’/g, "'")
    .replace(/«|»/g, '"')
    .replace(/[^\x00-\x7F]/g, (c) => {
      const map: Record<string, string> = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'î': 'i', 'ï': 'i',
        'ô': 'o', 'ö': 'o',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c',
        'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
        'À': 'A', 'Â': 'A', 'Ä': 'A',
        'Î': 'I', 'Ï': 'I',
        'Ô': 'O', 'Ö': 'O',
        'Ù': 'U', 'Û': 'U', 'Ü': 'U',
        'Ç': 'C',
      };
      return map[c] || "";
    });
}

function safeDrawText(page: any, text: string, options: any) {
  const safeStr = sanitizePdfText(text);
  page.drawText(safeStr, options);
}

function formatEUR(n: number): string {
  return `${Number(n).toFixed(2)} EUR`;
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

async function renderPdf(
  userClient: any,
  documentType: "quote" | "invoice",
  documentId: string
): Promise<{ bytes: Uint8Array; number: string; doc: any; company: any; client: any }> {
  const table = documentType === "quote" ? "quotes" : "invoices";
  const lineTable = documentType === "quote" ? "quote_lines" : "invoice_lines";

  const { data: doc, error: docErr } = await userClient
    .from(table)
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  if (docErr) throw docErr;
  if (!doc) throw new Error("Document introuvable");

  const { data: lines, error: linesErr } = await userClient
    .from(lineTable)
    .select("*")
    .eq(documentType === "quote" ? "quote_id" : "invoice_id", documentId)
    .order("position", { ascending: true });
  if (linesErr) throw linesErr;

  const { data: company, error: companyErr } = await userClient
    .from("companies")
    .select("*")
    .eq("id", doc.company_id)
    .maybeSingle();
  if (companyErr) throw companyErr;

  const { data: client, error: clientErr } = await userClient
    .from("clients")
    .select("*")
    .eq("id", doc.client_id)
    .maybeSingle();
  if (clientErr) throw clientErr;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const accent = hexToRgb(company?.accent_color || "#7C6FE0");
  const accentRgb = rgb(accent.r, accent.g, accent.b);
  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.9, 0.9, 0.9);

  let y = height - 50;
  const displayName = company?.commercial_name || company?.legal_name || "Entreprise";
  safeDrawText(page, displayName, { x: 50, y, size: 12, font: fontBold, color: black });
  y -= 16;
  if (company?.address) {
    safeDrawText(page, company.address.slice(0, 60), { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }
  if (company?.siret) {
    safeDrawText(page, `SIRET ${company.siret}`, { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  const title = doc.type === "credit_note"
    ? "AVOIR"
    : documentType === "quote"
    ? "DEVIS"
    : "FACTURE";
  const number = doc.number && doc.number.startsWith("DRAFT-") ? "Brouillon" : doc.number;
  const titleWidth = fontBold.widthOfTextAtSize(title, 20);
  safeDrawText(page, title, { x: width - 50 - titleWidth, y: height - 50, size: 20, font: fontBold, color: accentRgb });
  const numWidth = font.widthOfTextAtSize(sanitizePdfText(number), 11);
  safeDrawText(page, number, { x: width - 50 - numWidth, y: height - 70, size: 11, font: fontBold, color: black });
  const issueLine = `Emise le ${formatDateFR(doc.issue_date)}`;
  const issueWidth = font.widthOfTextAtSize(sanitizePdfText(issueLine), 9);
  safeDrawText(page, issueLine, { x: width - 50 - issueWidth, y: height - 85, size: 9, font, color: gray });

  y = height - 150;
  safeDrawText(page, "FACTURE A", { x: 50, y, size: 8, font: fontBold, color: gray });
  y -= 16;
  safeDrawText(page, client?.name || "-", { x: 50, y, size: 11, font: fontBold, color: black });
  y -= 14;

  y = height - 280;
  const colX = { desc: 50, qty: 360, pu: 420, total: 510 };
  safeDrawText(page, "Description", { x: colX.desc, y, size: 9, font: fontBold, color: gray });
  safeDrawText(page, "Qte", { x: colX.qty, y, size: 9, font: fontBold, color: gray });
  safeDrawText(page, "P.U. HT", { x: colX.pu, y, size: 9, font: fontBold, color: gray });
  safeDrawText(page, "Total HT", { x: colX.total, y, size: 9, font: fontBold, color: gray });
  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
  y -= 16;

  for (const l of (lines || []) as LineRow[]) {
    const lineTotal = Number(l.quantity) * Number(l.unit_price);
    safeDrawText(page, (l.description || "").slice(0, 45), { x: colX.desc, y, size: 9, font, color: black });
    const qtyStr = String(Number(l.quantity));
    safeDrawText(page, qtyStr, { x: colX.qty + 20 - font.widthOfTextAtSize(qtyStr, 9) / 2, y, size: 9, font, color: black });
    const puStr = formatEUR(Number(l.unit_price));
    safeDrawText(page, puStr, { x: colX.pu + 60 - font.widthOfTextAtSize(sanitizePdfText(puStr), 9), y, size: 9, font, color: black });
    const totStr = formatEUR(lineTotal);
    safeDrawText(page, totStr, { x: colX.total + 35 - font.widthOfTextAtSize(sanitizePdfText(totStr), 9), y, size: 9, font: fontBold, color: black });
    y -= 18;
  }

  const bytes = await pdfDoc.save();
  return { bytes, number, doc, company, client };
}

function buildHtmlEmail(options: {
  documentType: "quote" | "invoice";
  number: string;
  companyName: string;
  clientName: string;
  totalTtc: number;
  publicUrl: string;
  customBody?: string;
}): string {
  const isQuote = options.documentType === "quote";
  const docLabel = isQuote ? "Devis" : "Facture";
  const formattedAmount = `${Number(options.totalTtc).toFixed(2)} €`;
  const actionLabel = isQuote ? "✍️ Consulter & Signer le Devis" : "💳 Consulter & Payer en Ligne";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docLabel} ${options.number}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090D16; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #E2E8F0; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #090D16; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1F2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366F1 0%, #A855F7 50%, #EC4899 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; border-bottom: 1px solid #1F2937; background-color: #0F172A;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">${options.companyName}</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 12px; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 9999px; color: #818CF8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${docLabel} N° ${options.number}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.3;">
                Bonjour ${options.clientName},
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94A3B8; line-height: 1.6;">
                ${options.companyName} vous a transmis le ${docLabel.toLowerCase()} <strong style="color: #F8FAFC;">N° ${options.number}</strong> d'un montant total de <strong style="color: #818CF8; font-size: 17px;">${formattedAmount}</strong>.
              </p>

              <!-- Summary Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 13px; color: #64748B; font-weight: 600;">Montant Total TTC :</td>
                        <td align="right" style="font-size: 20px; font-weight: 900; color: #10B981;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px; font-size: 13px; color: #64748B; font-weight: 600;">Document :</td>
                        <td align="right" style="padding-top: 8px; font-size: 13px; color: #E2E8F0; font-weight: 700;">${docLabel} N° ${options.number}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Hero CTA Button -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${options.publicUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; padding: 16px 24px; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none; text-align: center; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);">
                      ${actionLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5; text-align: center;">
                📄 <em>Le document original au format PDF officiel est également joint à cet e-mail.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0F172A; border-top: 1px solid #1F2937; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                Transmis en toute sécurité via <strong style="color: #94A3B8;">Bylz</strong> — La plateforme de facturation & signature certifiée.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Service email non configuré (RESEND_API_KEY manquant sur Supabase)" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "JWT invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, body, document_type, document_id } = await req.json();
    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: "Paramètres manquants (to, subject, body)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Clé API Resend non configurée (RESEND_API_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch custom logo from system_settings or default
    let customLogoUrl = "https://bylz.fr/logo.png";
    try {
      const { data: logoSetting } = await userClient
        .from("system_settings")
        .select("value")
        .eq("key", "email_logo_url")
        .maybeSingle();
      if (logoSetting?.value && typeof logoSetting.value === "string") {
        customLogoUrl = logoSetting.value;
      }
    } catch {
      // fallback
    }

    // Helper to record email log in DB
    const logEmailDispatch = async (
      status: "sent" | "delivered" | "failed",
      resendId?: string,
      errorMsg?: string
    ) => {
      try {
        await userClient.from("email_logs").insert({
          recipient: Array.isArray(to) ? to.join(", ") : to,
          subject,
          email_type: document_type || "general",
          status,
          resend_id: resendId || null,
          error_message: errorMsg || null,
          metadata: { document_id, document_type },
        });
      } catch (logErr) {
        console.warn("Could not record email_log entry:", logErr);
      }
    };

    // Generic Lifecycle & Support Email Branch (without document PDF rendering)
    if (
      document_type === "support" ||
      document_type === "welcome" ||
      document_type === "urssaf_reminder" ||
      document_type === "vat_threshold" ||
      document_type === "trial_ending" ||
      document_type === "milestone" ||
      !document_id ||
      document_id === "none"
    ) {
      const isUrssaf = document_type === "urssaf_reminder";
      const isVat = document_type === "vat_threshold";
      const badgeText = isUrssaf
        ? "URSSAF & Fiscalité"
        : isVat
        ? "Alerte Seuil TVA"
        : document_type === "trial_ending"
        ? "Abonnement Pro"
        : "Support & Système";

      const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="background-color: #090d16; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 15px; margin: 0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <div style="max-width: 580px; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: left;">
          <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
            <img src="${customLogoUrl}" alt="Bylz" style="height: 36px; max-width: 160px; object-fit: contain;" />
            <span style="background: rgba(225, 29, 72, 0.2); color: #fb7185; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(225, 29, 72, 0.4); text-transform: uppercase;">
              ${badgeText}
            </span>
          </div>
          
          <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">${subject}</h2>
          
          <div style="background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">${body}</div>

          <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            Besoin d'aide supplémentaire ? Rendez-vous sur <a href="https://bylz.fr" style="color: #fb7185; text-decoration: none; font-weight: 700;">bylz.fr</a>.
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Bylz <no-reply@bylz.fr>`,
          to,
          subject,
          text: body,
          html: htmlContent,
          reply_to: "support@bylz.fr",
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        const fullErr = `Erreur Resend (${resendRes.status}): ${errText.slice(0, 200)}`;
        await logEmailDispatch("failed", undefined, fullErr);
        return new Response(
          JSON.stringify({ error: fullErr }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resData = await resendRes.json();
      await logEmailDispatch("sent", resData?.id);

      return new Response(JSON.stringify({ success: true, resend_id: resData?.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bytes, number, doc, company, client } = await renderPdf(
      userClient,
      document_type,
      document_id
    );

    const fileName = `${document_type === "quote" ? "devis" : doc.type === "credit_note" ? "avoir" : "facture"}-${number}.pdf`;
    const b64 = bytesToBase64(bytes);

    const companyName = company?.commercial_name || company?.legal_name || "Bylz";
    const clientName = client?.name || "Client";
    const publicToken = doc.public_token || doc.id;
    const publicUrl = `https://bylz.fr/v/${publicToken}`;

    const htmlContent = buildHtmlEmail({
      documentType: document_type,
      number,
      companyName,
      clientName,
      totalTtc: Number(doc.total_ttc || 0),
      publicUrl,
      customBody: body,
    });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${companyName} via Bylz <no-reply@bylz.fr>`,
        to,
        subject,
        text: `${body}\n\nConsulter en ligne : ${publicUrl}`,
        html: htmlContent,
        attachments: [
          {
            filename: fileName,
            content: b64,
          },
        ],
        reply_to: userData.user.email,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      const fullErr = `Erreur Resend (${resendRes.status}): ${errText.slice(0, 200)}`;
      await logEmailDispatch("failed", undefined, fullErr);
      return new Response(
        JSON.stringify({ error: fullErr }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const docResData = await resendRes.json();
    await logEmailDispatch("sent", docResData?.id);

    return new Response(JSON.stringify({ success: true, resend_id: docResData?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-email Edge Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne Edge Function" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(result);
}
