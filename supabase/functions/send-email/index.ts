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
 * - Renders an A4 PDF (same layout as generate-pdf) in-memory.
 * - Sends the email via the Resend API (RESEND_API_KEY secret) with the PDF
 *   attached, from "Bylz <no-reply@bylz.fr>".
 * - Returns { success: true } or { error }.
 *
 * If RESEND_API_KEY is not configured, returns a 503 with a clear message so
 * the frontend can surface an inline error without crashing.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

function formatEUR(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
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
  userClient: ReturnType<typeof createClient>,
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
  const accent = hexToRgb(company.accent_color || "#7C6FE0");
  const accentRgb = rgb(accent.r, accent.g, accent.b);
  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.9, 0.9, 0.9);

  let y = height - 50;
  const displayName = company.commercial_name || company.legal_name;
  page.drawText(displayName || "", { x: 50, y, size: 12, font: fontBold, color: black });
  y -= 16;
  if (company.address) {
    page.drawText(company.address.slice(0, 60), { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }
  if (company.siret) {
    page.drawText(`SIRET ${company.siret}`, { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  const title = doc.type === "credit_note"
    ? "AVOIR"
    : documentType === "quote"
    ? "DEVIS"
    : "FACTURE";
  const number = doc.number && doc.number.startsWith("DRAFT-") ? "Brouillon" : doc.number;
  const titleWidth = fontBold.widthOfTextAtSize(title, 20);
  page.drawText(title, { x: width - 50 - titleWidth, y: height - 50, size: 20, font: fontBold, color: accentRgb });
  const numWidth = font.widthOfTextAtSize(number, 11);
  page.drawText(number, { x: width - 50 - numWidth, y: height - 70, size: 11, font: fontBold, color: black });
  const issueLine = `Émise le ${formatDateFR(doc.issue_date)}`;
  const issueWidth = font.widthOfTextAtSize(issueLine, 9);
  page.drawText(issueLine, { x: width - 50 - issueWidth, y: height - 85, size: 9, font, color: gray });
  if (documentType === "invoice" && doc.due_date) {
    const dueLine = `Échéance ${formatDateFR(doc.due_date)}`;
    const dueWidth = font.widthOfTextAtSize(dueLine, 9);
    page.drawText(dueLine, { x: width - 50 - dueWidth, y: height - 98, size: 9, font, color: gray });
  }
  if (documentType === "quote" && doc.validity_date) {
    const vLine = `Valide jusqu'au ${formatDateFR(doc.validity_date)}`;
    const vWidth = font.widthOfTextAtSize(vLine, 9);
    page.drawText(vLine, { x: width - 50 - vWidth, y: height - 98, size: 9, font, color: gray });
  }

  y = height - 150;
  page.drawText("FACTURÉ À", { x: 50, y, size: 8, font: fontBold, color: gray });
  y -= 16;
  page.drawText(client?.name || "—", { x: 50, y, size: 11, font: fontBold, color: black });
  y -= 14;
  if (client?.address) {
    const addrLines = (client.address as string).split("\n").slice(0, 3);
    for (const line of addrLines) {
      page.drawText(line.slice(0, 60), { x: 50, y, size: 9, font, color: gray });
      y -= 12;
    }
  }
  if (client?.siret) {
    page.drawText(`SIRET ${client.siret}`, { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }
  if (client?.email) {
    page.drawText(client.email, { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  y = height - 280;
  const colX = { desc: 50, qty: 360, pu: 420, total: 510 };
  page.drawText("Description", { x: colX.desc, y, size: 9, font: fontBold, color: gray });
  page.drawText("Qté", { x: colX.qty, y, size: 9, font: fontBold, color: gray });
  page.drawText("P.U. HT", { x: colX.pu, y, size: 9, font: fontBold, color: gray });
  page.drawText("Total HT", { x: colX.total, y, size: 9, font: fontBold, color: gray });
  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
  y -= 16;

  for (const l of (lines || []) as LineRow[]) {
    const lineTotal = Number(l.quantity) * Number(l.unit_price);
    page.drawText((l.description || "").slice(0, 45), { x: colX.desc, y, size: 9, font, color: black });
    const qtyStr = String(Number(l.quantity));
    page.drawText(qtyStr, { x: colX.qty + 20 - font.widthOfTextAtSize(qtyStr, 9) / 2, y, size: 9, font, color: black });
    const puStr = formatEUR(Number(l.unit_price));
    page.drawText(puStr, { x: colX.pu + 60 - font.widthOfTextAtSize(puStr, 9), y, size: 9, font, color: black });
    const totStr = formatEUR(lineTotal);
    page.drawText(totStr, { x: colX.total + 35 - font.widthOfTextAtSize(totStr, 9), y, size: 9, font: fontBold, color: black });
    y -= 18;
  }

  y -= 20;
  const isFranchise = company.vat_regime === "franchise";
  const totalHt = Number(doc.total_ht);
  const totalVat = Number(doc.total_vat);
  const totalTtc = Number(doc.total_ttc);

  const drawTotalLine = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(label, { x: 350, y, size: 10, font: f, color: black });
    const w = f.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: width - 50 - w, y, size: 10, font: f, color: black });
    y -= 16;
  };

  drawTotalLine("Total HT", formatEUR(totalHt));
  if (isFranchise) {
    page.drawText("TVA non applicable — Art. 293 B du CGI", { x: 350, y, size: 8, font, color: gray });
    y -= 14;
  } else {
    drawTotalLine("TVA", formatEUR(totalVat));
  }
  page.drawLine({ start: { x: 350, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
  y -= 6;
  const ttcStr = formatEUR(totalTtc);
  page.drawText("Total TTC", { x: 350, y, size: 12, font: fontBold, color: black });
  const ttcW = fontBold.widthOfTextAtSize(ttcStr, 14);
  page.drawText(ttcStr, { x: width - 50 - ttcW, y, size: 14, font: fontBold, color: accentRgb });
  y -= 30;

  if (doc.note) {
    page.drawText("Note", { x: 50, y, size: 8, font: fontBold, color: gray });
    y -= 12;
    const noteLines = (doc.note as string).split("\n").slice(0, 5);
    for (const nl of noteLines) {
      page.drawText(nl.slice(0, 80), { x: 50, y, size: 9, font, color: gray });
      y -= 12;
    }
    y -= 10;
  }

  if (company.invoice_footer) {
    y = 120;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
    y -= 14;
    const footerLines = (company.invoice_footer as string).split("\n").slice(0, 6);
    for (const fl of footerLines) {
      page.drawText(fl.slice(0, 90), { x: 50, y, size: 8, font, color: gray });
      y -= 10;
    }
  }

  if (isFranchise) {
    page.drawText("Auto-entrepreneur — TVA non applicable, art. 293 B du CGI", { x: 50, y: 40, size: 7, font, color: gray });
  }

  const bytes = await pdfDoc.save();
  return { bytes, number, doc, company, client };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Service email non configuré (RESEND_API_KEY manquant)" }),
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
    if (!to || !subject || !body || !document_type || !document_id) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), {
        status: 400,
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

    const displayName = company.commercial_name || company.legal_name || "Bylz";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bylz <no-reply@bylz.fr>",
        to,
        subject,
        text: body,
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
      return new Response(
        JSON.stringify({ error: `Erreur Resend: ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    void displayName;
    void client;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
