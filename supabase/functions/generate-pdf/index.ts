/*
 * generate-pdf Edge Function
 * ---------------------------
 * POST { document_type: 'quote'|'invoice', document_id }
 *
 * - Validates the caller's JWT and checks company ownership.
 * - Fetches the document + lines + company + client.
 * - Renders an A4 PDF matching the on-screen preview (logo, company info,
 *   "FACTURE"/"DEVIS" + number in accent_color, client block, lines table,
 *   totals block with franchise mention, footer + legal line).
 * - Stores the PDF in the private "documents" storage bucket at
 *   {company_id}/{type}-{number}.pdf and returns a signed URL (1h).
 *
 * Uses pdf-lib (npm) which is Deno-compatible.
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
  const parts = Number(n || 0).toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${intPart},${parts[1]} €`;
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

function sanitizePdfText(str: string | null | undefined, font?: any): string {
  if (!str) return "";
  let clean = String(str)
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    .replace(/[«»]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/•/g, "-");

  if (font) {
    let result = "";
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      try {
        font.encodeText(char);
        result += char;
      } catch {
        const decomposed = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        try {
          font.encodeText(decomposed);
          result += decomposed;
        } catch {
          result += " ";
        }
      }
    }
    return result;
  }
  return clean;
}

function safeDrawText(page: any, text: string, options: any, font: any) {
  const f = font || options.font;
  const safeStr = sanitizePdfText(text, f);
  page.drawText(safeStr, { ...options, font: f });
}

function safeWidthOfText(font: any, text: string, size: number): number {
  const safeStr = sanitizePdfText(text, font);
  return font.widthOfTextAtSize(safeStr, size);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use serviceKey to allow public document PDF generation for unauthenticated recipients
    const userClient = createClient(supabaseUrl, serviceKey);

    const { document_type, document_id, public_token } = await req.json();
    if (!document_type || !document_id) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the caller: a signed-in owner may download their own document, an
    // anonymous recipient must present the document's share token. A document id
    // on its own is never sufficient.
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    let authUserId: string | null = null;
    if (jwt && jwt !== anonKey) {
      try {
        const authClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${jwt}` } },
        });
        const { data: userData } = await authClient.auth.getUser();
        authUserId = userData?.user?.id ?? null;
      } catch {
        // fallback
      }
      if (!authUserId) {
        try {
          const { data: userData } = await createClient(supabaseUrl, anonKey).auth.getUser(jwt);
          authUserId = userData?.user?.id ?? null;
        } catch {
          // fallback
        }
      }
    }

    const table = document_type === "quote" ? "quotes" : "invoices";
    const lineTable = document_type === "quote" ? "quote_lines" : "invoice_lines";

    // fetch document
    const { data: doc, error: docErr } = await userClient
      .from(table)
      .select("*")
      .eq("id", document_id)
      .maybeSingle();
    if (docErr) throw docErr;
    if (!doc) {
      return new Response(JSON.stringify({ error: "Document introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let authorized = false;

    if (authUserId) {
      const { data: ownerCompany } = await userClient
        .from("companies")
        .select("id")
        .eq("id", doc.company_id)
        .eq("user_id", authUserId)
        .maybeSingle();
      if (ownerCompany) {
        authorized = true;
      } else {
        const { data: prof } = await userClient
          .from("profiles")
          .select("is_admin")
          .eq("id", authUserId)
          .maybeSingle();
        if (prof?.is_admin) {
          authorized = true;
        }
      }
    }

    if (!authorized && typeof public_token === "string" && public_token.length >= 10) {
      authorized = doc.public_token === public_token || doc.id === public_token;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Accès non autorisé au document" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lines, error: linesErr } = await userClient
      .from(lineTable)
      .select("*")
      .eq(document_type === "quote" ? "quote_id" : "invoice_id", document_id)
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

    // Render PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const accent = hexToRgb(company.accent_color || "#7C6FE0");
    const accentRgb = rgb(accent.r, accent.g, accent.b);
    const black = rgb(0.1, 0.1, 0.1);
    const gray = rgb(0.5, 0.5, 0.5);
    const lightGray = rgb(0.9, 0.9, 0.9);

    let y = height - 50;

    // Header: company info left (with logo if present), title right
    if (company.logo_url) {
      try {
        const imgRes = await fetch(company.logo_url);
        if (imgRes.ok) {
          const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
          const isPng = company.logo_url.toLowerCase().includes(".png") || (imgBytes[0] === 0x89 && imgBytes[1] === 0x50);
          const img = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
          const dims = img.scaleToFit(80, 40);
          page.drawImage(img, {
            x: 50,
            y: y - dims.height,
            width: dims.width,
            height: dims.height,
          });
          y -= (dims.height + 10);
        }
      } catch (err) {
        console.warn("Could not embed logo in PDF:", err);
      }
    }

    const displayName = company?.commercial_name || company?.legal_name || "Entreprise";
    safeDrawText(page, displayName, { x: 50, y, size: 12, color: black }, fontBold);
    y -= 16;
    if (company?.address) {
      safeDrawText(page, company.address.slice(0, 60), { x: 50, y, size: 9, color: gray }, font);
      y -= 12;
    }
    if (company?.siret) {
      safeDrawText(page, `SIRET ${company.siret}`, { x: 50, y, size: 9, color: gray }, font);
      y -= 12;
    }

    const title = doc.type === "credit_note"
      ? "AVOIR"
      : document_type === "quote"
      ? "DEVIS"
      : "FACTURE";
    const number = doc.number && doc.number.startsWith("DRAFT-") ? "Brouillon" : (doc.number || "Document");
    const titleWidth = safeWidthOfText(fontBold, title, 20);
    safeDrawText(page, title, {
      x: width - 50 - titleWidth,
      y: height - 50,
      size: 20,
      color: accentRgb,
    }, fontBold);

    const numWidth = safeWidthOfText(fontBold, number, 11);
    safeDrawText(page, number, {
      x: width - 50 - numWidth,
      y: height - 70,
      size: 11,
      color: black,
    }, fontBold);

    const issueLine = `Validée le ${formatDateFR(doc.issue_date)}`;
    const issueWidth = safeWidthOfText(font, issueLine, 9);
    safeDrawText(page, issueLine, {
      x: width - 50 - issueWidth,
      y: height - 85,
      size: 9,
      color: gray,
    }, font);

    if (document_type === "invoice" && doc.due_date) {
      const dueLine = `Échéance ${formatDateFR(doc.due_date)}`;
      const dueWidth = safeWidthOfText(font, dueLine, 9);
      safeDrawText(page, dueLine, {
        x: width - 50 - dueWidth,
        y: height - 98,
        size: 9,
        color: gray,
      }, font);
    }
    if (document_type === "quote" && doc.validity_date) {
      const vLine = `Valide jusqu'au ${formatDateFR(doc.validity_date)}`;
      const vWidth = safeWidthOfText(font, vLine, 9);
      safeDrawText(page, vLine, {
        x: width - 50 - vWidth,
        y: height - 98,
        size: 9,
        color: gray,
      }, font);
    }

    // Client block
    y = height - 150;
    safeDrawText(page, "FACTURÉ À", { x: 50, y, size: 8, color: gray }, fontBold);
    y -= 16;
    safeDrawText(page, client?.name || "—", { x: 50, y, size: 11, color: black }, fontBold);
    y -= 14;
    if (client?.address) {
      const addrLines = (client.address as string).split("\n").slice(0, 3);
      for (const line of addrLines) {
        safeDrawText(page, line.slice(0, 60), { x: 50, y, size: 9, color: gray }, font);
        y -= 12;
      }
    }
    if (client?.siret) {
      safeDrawText(page, `SIRET ${client.siret}`, { x: 50, y, size: 9, color: gray }, font);
      y -= 12;
    }
    if (client?.email) {
      safeDrawText(page, client.email, { x: 50, y, size: 9, color: gray }, font);
      y -= 12;
    }

    // Lines table
    y = height - 280;
    const colX = { desc: 50, qty: 360, pu: 420, total: 510 };
    safeDrawText(page, "Description", { x: colX.desc, y, size: 9, color: gray }, fontBold);
    safeDrawText(page, "Qté", { x: colX.qty, y, size: 9, color: gray }, fontBold);
    safeDrawText(page, "P.U. HT", { x: colX.pu, y, size: 9, color: gray }, fontBold);
    safeDrawText(page, "Total HT", { x: colX.total, y, size: 9, color: gray }, fontBold);
    y -= 6;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
    y -= 16;

    for (const l of (lines || []) as LineRow[]) {
      const lineTotal = Number(l.quantity) * Number(l.unit_price);
      safeDrawText(page, (l.description || "").slice(0, 45), {
        x: colX.desc, y, size: 9, color: black,
      }, font);
      const qtyStr = String(Number(l.quantity));
      safeDrawText(page, qtyStr, {
        x: colX.qty + 20 - safeWidthOfText(font, qtyStr, 9) / 2, y, size: 9, color: black,
      }, font);
      const puStr = formatEUR(Number(l.unit_price));
      safeDrawText(page, puStr, {
        x: colX.pu + 60 - safeWidthOfText(font, puStr, 9), y, size: 9, color: black,
      }, font);
      const totStr = formatEUR(lineTotal);
      safeDrawText(page, totStr, {
        x: colX.total + 35 - safeWidthOfText(fontBold, totStr, 9), y, size: 9, color: black,
      }, fontBold);
      y -= 18;
    }

    // Totals
    y -= 20;
    const isFranchise = company?.vat_regime === "franchise";
    const totalHt = Number(doc.total_ht || 0);
    const totalVat = Number(doc.total_vat || 0);
    const totalTtc = Number(doc.total_ttc || 0);

    const drawTotalLine = (label: string, value: string, bold = false) => {
      const f = bold ? fontBold : font;
      safeDrawText(page, label, { x: 350, y, size: 10, color: black }, f);
      const w = safeWidthOfText(f, value, 10);
      safeDrawText(page, value, { x: width - 50 - w, y, size: 10, color: black }, f);
      y -= 16;
    };

    drawTotalLine("Total HT", formatEUR(totalHt));
    if (isFranchise) {
      safeDrawText(page, "TVA non applicable — Art. 293 B du CGI", {
        x: 350, y, size: 8, color: gray,
      }, font);
      y -= 14;
    } else {
      drawTotalLine("TVA", formatEUR(totalVat));
    }
    y -= 4;
    page.drawLine({ start: { x: 350, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
    y -= 18;
    const ttcStr = formatEUR(totalTtc);
    safeDrawText(page, "Total TTC", { x: 350, y, size: 12, color: black }, fontBold);
    const ttcW = safeWidthOfText(fontBold, ttcStr, 14);
    safeDrawText(page, ttcStr, { x: width - 50 - ttcW, y, size: 14, color: accentRgb }, fontBold);
    y -= 26;

    // Note
    if (doc.note) {
      safeDrawText(page, "Note", { x: 50, y, size: 8, color: gray }, fontBold);
      y -= 12;
      const noteLines = (doc.note as string).split("\n").slice(0, 5);
      for (const nl of noteLines) {
        safeDrawText(page, nl.slice(0, 80), { x: 50, y, size: 9, color: gray }, font);
        y -= 12;
      }
      y -= 10;
    }

    // Footer
    if (company?.invoice_footer) {
      y = 120;
      page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
      y -= 14;
      const footerLines = (company.invoice_footer as string).split("\n").slice(0, 6);
      for (const fl of footerLines) {
        safeDrawText(page, fl.slice(0, 90), { x: 50, y, size: 8, color: gray }, font);
        y -= 10;
      }
    }

    if (isFranchise) {
      safeDrawText(page, "Auto-entrepreneur — TVA non applicable, art. 293 B du CGI", {
        x: 50, y: 40, size: 7, color: gray }, font);
    }

    const pdfBytes = await pdfDoc.save();

    // Upload via service role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${serviceKey}` } },
    });
    const safeDocNumber = String(number).replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${doc.company_id}/${document_type}-${safeDocNumber}.pdf`;
    const { error: upErr } = await adminClient.storage
      .from("documents")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { data: urlData, error: urlErr } = await adminClient.storage
      .from("documents")
      .createSignedUrl(fileName, 3600);
    if (urlErr) throw urlErr;

    return new Response(JSON.stringify({ url: urlData.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-pdf error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erreur interne", stack: err?.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
