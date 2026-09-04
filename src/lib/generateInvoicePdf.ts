import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface InvoicePdfConfig {
  companyName: string;
  siret?: string;
  address?: string;
  clientName: string;
  clientAddress?: string;
  clientSiret?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  vatRegime: "franchise" | "vat20" | "vat10";
  accentColor: string;
  footerNotes?: string;
  logoDataUrl?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || "#7C6FE0").replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return {
    r: isNaN(r) ? 0.48 : r,
    g: isNaN(g) ? 0.43 : g,
    b: isNaN(b) ? 0.88 : b,
  };
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

export async function generateInvoicePdfBytes(cfg: InvoicePdfConfig): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const accent = hexToRgb(cfg.accentColor);
  const accentRgb = rgb(accent.r, accent.g, accent.b);
  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.88, 0.88, 0.88);

  let y = height - 50;

  // Draw Logo if provided (Data URL)
  if (cfg.logoDataUrl && cfg.logoDataUrl.startsWith("data:image")) {
    try {
      const isPng = cfg.logoDataUrl.includes("image/png");
      const base64Data = cfg.logoDataUrl.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const dims = img.scaleToFit(90, 45);
      page.drawImage(img, {
        x: 50,
        y: y - dims.height,
        width: dims.width,
        height: dims.height,
      });
      y -= (dims.height + 12);
    } catch (e) {
      console.warn("Logo embed error in client PDF:", e);
    }
  }

  // Header: Company details (Left)
  page.drawText(cfg.companyName || "Mon Entreprise", {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: black,
  });
  y -= 16;

  if (cfg.address) {
    page.drawText(cfg.address.slice(0, 60), { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  if (cfg.siret) {
    page.drawText(`SIRET ${cfg.siret}`, { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  // Header: FACTURE title & Number (Right)
  const title = "FACTURE";
  const titleWidth = fontBold.widthOfTextAtSize(title, 22);
  page.drawText(title, {
    x: width - 50 - titleWidth,
    y: height - 50,
    size: 22,
    font: fontBold,
    color: accentRgb,
  });

  const num = cfg.invoiceNumber || "FAC-2026-001";
  const numWidth = fontBold.widthOfTextAtSize(num, 11);
  page.drawText(num, {
    x: width - 50 - numWidth,
    y: height - 72,
    size: 11,
    font: fontBold,
    color: black,
  });

  const issueLine = `Émise le ${formatDateFR(cfg.issueDate || new Date().toISOString())}`;
  const issueWidth = font.widthOfTextAtSize(issueLine, 9);
  page.drawText(issueLine, {
    x: width - 50 - issueWidth,
    y: height - 88,
    size: 9,
    font,
    color: gray,
  });

  if (cfg.dueDate) {
    const dueLine = `Échéance : ${formatDateFR(cfg.dueDate)}`;
    const dueWidth = font.widthOfTextAtSize(dueLine, 9);
    page.drawText(dueLine, {
      x: width - 50 - dueWidth,
      y: height - 102,
      size: 9,
      font,
      color: gray,
    });
  }

  // Client block
  y = height - 145;
  page.drawText("FACTURÉ À", { x: 50, y, size: 8, font: fontBold, color: gray });
  y -= 15;
  page.drawText(cfg.clientName || "Nom du Client", { x: 50, y, size: 11, font: fontBold, color: black });
  y -= 14;

  if (cfg.clientAddress) {
    page.drawText(cfg.clientAddress.slice(0, 60), { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  if (cfg.clientSiret) {
    page.drawText(`SIRET ${cfg.clientSiret}`, { x: 50, y, size: 9, font, color: gray });
    y -= 12;
  }

  // Lines table
  y = height - 250;
  const colX = { desc: 50, qty: 360, pu: 420, total: 510 };
  page.drawText("Description", { x: colX.desc, y, size: 9, font: fontBold, color: gray });
  page.drawText("Qté", { x: colX.qty, y, size: 9, font: fontBold, color: gray });
  page.drawText("P.U. HT", { x: colX.pu, y, size: 9, font: fontBold, color: gray });
  page.drawText("Total HT", { x: colX.total, y, size: 9, font: fontBold, color: gray });
  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
  y -= 16;

  let totalHt = 0;
  for (const l of cfg.lines) {
    const lineTotal = (Number(l.quantity) || 1) * (Number(l.unitPrice) || 0);
    totalHt += lineTotal;

    page.drawText((l.description || "Prestation").slice(0, 45), {
      x: colX.desc, y, size: 9, font, color: black,
    });
    const qtyStr = String(Number(l.quantity) || 1);
    page.drawText(qtyStr, {
      x: colX.qty + 15 - font.widthOfTextAtSize(qtyStr, 9) / 2, y, size: 9, font, color: black,
    });
    const puStr = formatEUR(Number(l.unitPrice) || 0);
    page.drawText(puStr, {
      x: colX.pu + 60 - font.widthOfTextAtSize(puStr, 9), y, size: 9, font, color: black,
    });
    const totStr = formatEUR(lineTotal);
    page.drawText(totStr, {
      x: colX.total + 35 - font.widthOfTextAtSize(totStr, 9), y, size: 9, font, color: black,
    });
    y -= 18;
  }

  // Totals
  y -= 16;
  const isFranchise = cfg.vatRegime === "franchise";
  const vatRate = cfg.vatRegime === "vat20" ? 0.20 : cfg.vatRegime === "vat10" ? 0.10 : 0;
  const totalVat = isFranchise ? 0 : totalHt * vatRate;
  const totalTtc = totalHt + totalVat;

  const drawTotalLine = (label: string, value: string, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(label, { x: 350, y, size: 10, font: f, color: black });
    const w = f.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: width - 50 - w, y, size: 10, font: f, color: black });
    y -= 16;
  };

  drawTotalLine("Total HT", formatEUR(totalHt));
  if (isFranchise) {
    page.drawText("TVA non applicable — Art. 293 B du CGI", {
      x: 350, y, size: 8, font, color: gray,
    });
    y -= 14;
  } else {
    drawTotalLine(`TVA (${(vatRate * 100).toFixed(0)}%)`, formatEUR(totalVat));
  }

  page.drawLine({ start: { x: 350, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
  y -= 6;
  const ttcStr = formatEUR(totalTtc);
  page.drawText("Total TTC (Net à payer)", { x: 350, y, size: 11, font: fontBold, color: black });
  const ttcW = fontBold.widthOfTextAtSize(ttcStr, 13);
  page.drawText(ttcStr, { x: width - 50 - ttcW, y, size: 13, font: fontBold, color: accentRgb });
  y -= 26;

  // Footer Mentions
  y = 120;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: lightGray });
  y -= 14;

  if (cfg.footerNotes) {
    const lines = cfg.footerNotes.split("\n").slice(0, 5);
    for (const fl of lines) {
      page.drawText(fl.slice(0, 95), { x: 50, y, size: 8, font, color: gray });
      y -= 10;
    }
  }

  // Legal watermarks & Bylz note
  if (isFranchise) {
    page.drawText("Auto-entrepreneur — TVA non applicable, art. 293 B du CGI", {
      x: 50, y: 44, size: 7, font, color: gray,
    });
  }

  page.drawText("Document conforme 2026 généré gratuitement via Bylz (https://bylz.fr)", {
    x: 50, y: 32, size: 7, font, color: gray,
  });

  return await pdfDoc.save();
}

export async function downloadInvoicePdf(cfg: InvoicePdfConfig, filename = "facture.pdf"): Promise<void> {
  const pdfBytes = await generateInvoicePdfBytes(cfg);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
