import { supabase } from "./supabase";
import { paymentTermsToDate } from "./date";
import { parseISO, isValid, format } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  Client,
  CatalogItem,
  Quote,
  QuoteLine,
  Invoice,
  InvoiceLine,
  Payment,
  PaymentTerms,
  QuoteStatus,
  InvoiceStatus,
  ItemNature,
  ClientType,
  PaymentMethod,
  ActivityType,
  UrssafFreq,
  InvoiceReminder,
  UrssafDeclaration,
} from "../types/database";

export interface ClientWithStats extends Client {
  total_ca: number;
  invoice_count: number;
}

export interface LineInput {
  id?: string;
  catalog_item_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  nature: ItemNature;
  position: number;
}

// ---------- Clients ----------

export async function fetchClients(
  companyId: string,
  search = ""
): Promise<ClientWithStats[]> {
  let query = supabase
    .from("clients")
    .select(
      "id, company_id, name, type, siren, siret, vat_number, email, address, archived_at, created_at"
    )
    .eq("company_id", companyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,siren.ilike.%${search}%`
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  const clients = (data || []) as Client[];

  if (clients.length === 0) return [];
  const ids = clients.map((c) => c.id);

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("client_id, total_ttc, paid_amount, status, issue_date, paid_at")
    .in("client_id", ids);
  if (invErr) throw invErr;

  const stats = new Map<string, { total_ca: number; invoice_count: number }>();
  for (const i of inv || []) {
    const s = stats.get(i.client_id) || { total_ca: 0, invoice_count: 0 };
    if (i.status === "paid") s.total_ca += Number(i.paid_amount) || Number(i.total_ttc);
    s.invoice_count += 1;
    stats.set(i.client_id, s);
  }
  return clients.map((c) => ({
    ...c,
    total_ca: stats.get(c.id)?.total_ca || 0,
    invoice_count: stats.get(c.id)?.invoice_count || 0,
  }));
}

export async function fetchClient(
  companyId: string,
  id: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Client | null;
}

export async function createClient(
  companyId: string,
  input: {
    name: string;
    type: ClientType;
    siren?: string | null;
    siret?: string | null;
    vat_number?: string | null;
    email?: string | null;
    address?: string | null;
  }
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...input, company_id: companyId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  companyId: string,
  id: string,
  patch: Partial<{
    name: string;
    type: ClientType;
    siren: string | null;
    siret: string | null;
    vat_number: string | null;
    email: string | null;
    address: string | null;
    archived_at: string | null;
  }>
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function archiveClient(
  companyId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
}

// ---------- Catalog ----------

export async function fetchCatalog(
  companyId: string,
  search = ""
): Promise<CatalogItem[]> {
  let query = supabase
    .from("catalog_items")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("description", `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CatalogItem[];
}

export async function createCatalogItem(
  companyId: string,
  input: { description: string; unit_price: number; nature: ItemNature }
): Promise<CatalogItem> {
  const { data, error } = await supabase
    .from("catalog_items")
    .insert({ ...input, company_id: companyId })
    .select("*")
    .single();
  if (error) throw error;
  return data as CatalogItem;
}

export async function updateCatalogItem(
  companyId: string,
  id: string,
  patch: { description: string; unit_price: number; nature: ItemNature }
): Promise<CatalogItem> {
  const { data, error } = await supabase
    .from("catalog_items")
    .update(patch)
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CatalogItem;
}

export async function catalogItemIsReferenced(
  companyId: string,
  id: string
): Promise<boolean> {
  const [q, i] = await Promise.all([
    supabase
      .from("quote_lines")
      .select("id", { count: "exact", head: true })
      .eq("catalog_item_id", id)
      .limit(1),
    supabase
      .from("invoice_lines")
      .select("id", { count: "exact", head: true })
      .eq("catalog_item_id", id)
      .limit(1),
  ]);
  // RLS scopes to own company's documents; safe to use counts
  return ((q.count || 0) + (i.count || 0)) > 0;
}

export async function deleteCatalogItem(
  companyId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("catalog_items")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
}

// ---------- Numbering ----------

export async function nextNumber(
  companyId: string,
  prefix: "DEV" | "FAC",
  year: number
): Promise<string> {
  const like = `${prefix}-${year}-%`;
  const table = prefix === "DEV" ? "quotes" : "invoices";
  const { data, error } = await supabase
    .from(table)
    .select("number")
    .eq("company_id", companyId)
    .like("number", like)
    .order("number", { ascending: false })
    .limit(1);
  if (error) throw error;
  let next = 1;
  if (data && data.length > 0) {
    const m = /-(\d+)$/.exec(data[0].number);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `${prefix}-${year}-${String(next).padStart(3, "0")}`;
}

// ---------- Totals ----------

export function computeTotals(
  lines: LineInput[],
  vatRegime: "franchise" | "vat"
): { total_ht: number; total_vat: number; total_ttc: number } {
  const total_ht = lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0
  );
  const total_vat = vatRegime === "franchise" ? 0 : 0; // simplified: no per-line VAT rate in schema
  return {
    total_ht: round2(total_ht),
    total_vat: round2(total_vat),
    total_ttc: round2(total_ht + total_vat),
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ---------- Quotes ----------

export async function fetchQuotes(
  companyId: string,
  status?: QuoteStatus | "all",
  search = ""
): Promise<(Quote & { client_name: string })[]> {
  let query = supabase
    .from("quotes")
    .select(
      "id, company_id, client_id, number, status, issue_date, validity_date, payment_terms, note, total_ht, total_vat, total_ttc, created_at, clients(name)"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `number.ilike.%${search}%,clients.name.ilike.%${search}%`
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((q: any) => ({
    id: q.id,
    company_id: q.company_id,
    client_id: q.client_id,
    number: q.number,
    status: q.status,
    issue_date: q.issue_date,
    validity_date: q.validity_date,
    payment_terms: q.payment_terms,
    note: q.note,
    total_ht: Number(q.total_ht),
    total_vat: Number(q.total_vat),
    total_ttc: Number(q.total_ttc),
    created_at: q.created_at,
    client_name: q.clients?.name || "—",
  }));
}

export async function fetchQuote(
  companyId: string,
  id: string
): Promise<{ quote: Quote; lines: QuoteLine[]; client: Client | null } | null> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const quote = data as Quote;
  const [linesRes, clientRes] = await Promise.all([
    supabase
      .from("quote_lines")
      .select("*")
      .eq("quote_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("clients")
      .select("*")
      .eq("id", quote.client_id)
      .maybeSingle(),
  ]);
  if (linesRes.error) throw linesRes.error;
  if (clientRes.error) throw clientRes.error;
  return {
    quote,
    lines: (linesRes.data || []) as QuoteLine[],
    client: (clientRes.data as Client) || null,
  };
}

export async function saveQuote(
  companyId: string,
  input: {
    id?: string;
    client_id: string;
    issue_date: string;
    validity_date: string | null;
    payment_terms: PaymentTerms;
    note: string | null;
    lines: LineInput[];
    status?: QuoteStatus;
  }
): Promise<Quote> {
  const isNew = !input.id;
  const parsed = parseISO(input.issue_date);
  const year = isValid(parsed) ? parsed.getFullYear() : new Date().getFullYear();
  const number = isNew ? await nextNumber(companyId, "DEV", year) : undefined;
  const totals = computeTotals(input.lines, "franchise"); // franchise default; vat handled at company level elsewhere

  const payload: any = {
    company_id: companyId,
    client_id: input.client_id,
    issue_date: input.issue_date,
    validity_date: input.validity_date,
    payment_terms: input.payment_terms,
    note: input.note,
    total_ht: totals.total_ht,
    total_vat: totals.total_vat,
    total_ttc: totals.total_ttc,
  };
  if (number) payload.number = number;
  if (input.status) payload.status = input.status;

  let quoteId: string;
  if (isNew) {
    const { data, error } = await supabase
      .from("quotes")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    quoteId = (data as Quote).id;
  } else {
    const { data, error } = await supabase
      .from("quotes")
      .update(payload)
      .eq("company_id", companyId)
      .eq("id", input.id!)
      .select("*")
      .single();
    if (error) throw error;
    quoteId = (data as Quote).id;
    // replace lines
    const { error: delErr } = await supabase
      .from("quote_lines")
      .delete()
      .eq("quote_id", quoteId);
    if (delErr) throw delErr;
  }

  if (input.lines.length > 0) {
    const rows = input.lines.map((l) => ({
      quote_id: quoteId,
      catalog_item_id: l.catalog_item_id || null,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      nature: l.nature,
      position: l.position,
    }));
    const { error: lineErr } = await supabase
      .from("quote_lines")
      .insert(rows);
    if (lineErr) throw lineErr;
  }

  const { data: fresh, error: fErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  if (fErr) throw fErr;
  return fresh as Quote;
}

export async function updateQuoteStatus(
  companyId: string,
  id: string,
  status: QuoteStatus
): Promise<void> {
  const { error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateQuote(
  companyId: string,
  id: string
): Promise<Quote> {
  const existing = await fetchQuote(companyId, id);
  if (!existing) throw new Error("Devis introuvable");
  const { quote, lines } = existing;
  const year = new Date().getFullYear();
  const number = await nextNumber(companyId, "DEV", year);
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      company_id: companyId,
      client_id: quote.client_id,
      number,
      status: "draft",
      issue_date: new Date().toISOString().slice(0, 10),
      validity_date: null,
      payment_terms: quote.payment_terms,
      note: quote.note,
      total_ht: quote.total_ht,
      total_vat: quote.total_vat,
      total_ttc: quote.total_ttc,
    })
    .select("*")
    .single();
  if (error) throw error;
  const newQuote = data as Quote;
  if (lines.length > 0) {
    const rows = lines.map((l) => ({
      quote_id: newQuote.id,
      catalog_item_id: l.catalog_item_id,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      nature: l.nature,
      position: l.position,
    }));
    const { error: lErr } = await supabase.from("quote_lines").insert(rows);
    if (lErr) throw lErr;
  }
  return newQuote;
}

export async function quoteHasInvoice(
  companyId: string,
  quoteId: string
): Promise<{ id: string; number: string } | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number")
    .eq("company_id", companyId)
    .eq("quote_id", quoteId)
    .neq("type", "credit_note")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as { id: string; number: string }) : null;
}

// ---------- Invoices ----------

export async function fetchInvoices(
  companyId: string,
  status?: InvoiceStatus | "all",
  search = ""
): Promise<(Invoice & { client_name: string })[]> {
  let query = supabase
    .from("invoices")
    .select(
      "id, company_id, client_id, quote_id, credited_invoice_id, number, type, status, pa_status, pa_rejection_reason, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_at, paid_amount, payment_method, stripe_payment_link, facturx_pdf_url, ereporting_status, note, created_at, clients(name)"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `number.ilike.%${search}%,clients.name.ilike.%${search}%`
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((i: any) => ({
    id: i.id,
    company_id: i.company_id,
    client_id: i.client_id,
    quote_id: i.quote_id,
    credited_invoice_id: i.credited_invoice_id,
    number: i.number,
    type: i.type,
    status: i.status,
    pa_status: i.pa_status,
    pa_rejection_reason: i.pa_rejection_reason,
    issue_date: i.issue_date,
    due_date: i.due_date,
    payment_terms: i.payment_terms,
    total_ht: Number(i.total_ht),
    total_vat: Number(i.total_vat),
    total_ttc: Number(i.total_ttc),
    paid_at: i.paid_at,
    paid_amount: i.paid_amount != null ? Number(i.paid_amount) : null,
    payment_method: i.payment_method,
    stripe_payment_link: i.stripe_payment_link,
    facturx_pdf_url: i.facturx_pdf_url,
    ereporting_status: i.ereporting_status,
    note: i.note,
    created_at: i.created_at,
    client_name: i.clients?.name || "—",
  }));
}

export async function fetchInvoice(
  companyId: string,
  id: string
): Promise<{
  invoice: Invoice;
  lines: InvoiceLine[];
  client: Client | null;
  linkedCreditNotes: { id: string; number: string }[];
  sourceInvoice: { id: string; number: string } | null;
} | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const invoice = data as Invoice;
  const [linesRes, clientRes, linkedRes, sourceRes] = await Promise.all([
    supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("clients")
      .select("*")
      .eq("id", invoice.client_id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, number")
      .eq("company_id", companyId)
      .eq("credited_invoice_id", id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    invoice.credited_invoice_id
      ? supabase
          .from("invoices")
          .select("id, number")
          .eq("company_id", companyId)
          .eq("id", invoice.credited_invoice_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (linesRes.error) throw linesRes.error;
  if (clientRes.error) throw clientRes.error;
  if (linkedRes.error) throw linkedRes.error;
  if (sourceRes.error) throw sourceRes.error;
  return {
    invoice,
    lines: (linesRes.data || []) as InvoiceLine[],
    client: (clientRes.data as Client) || null,
    linkedCreditNotes: (linkedRes.data || []) as { id: string; number: string }[],
    sourceInvoice: (sourceRes.data as { id: string; number: string }) || null,
  };
}

export async function saveInvoice(
  companyId: string,
  input: {
    id?: string;
    client_id: string;
    issue_date: string;
    due_date: string;
    payment_terms: PaymentTerms;
    quote_id?: string | null;
    type?: "invoice" | "credit_note";
    note?: string | null;
    lines: LineInput[];
  }
): Promise<Invoice> {
  const isNew = !input.id;
  const totals = computeTotals(input.lines, "franchise");

  const payload: any = {
    company_id: companyId,
    client_id: input.client_id,
    issue_date: input.issue_date,
    due_date: input.due_date,
    payment_terms: input.payment_terms,
    total_ht: totals.total_ht,
    total_vat: totals.total_vat,
    total_ttc: totals.total_ttc,
  };
  if (input.quote_id !== undefined) payload.quote_id = input.quote_id;
  if (input.type) payload.type = input.type;
  if (input.note !== undefined) payload.note = input.note;

  let invoiceId: string;
  if (isNew) {
    // drafts get a unique placeholder number (real number assigned on emission)
    payload.number = `DRAFT-${crypto.randomUUID()}`;
    payload.status = "draft";
    const { data, error } = await supabase
      .from("invoices")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    invoiceId = (data as Invoice).id;
  } else {
    const { data, error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("company_id", companyId)
      .eq("id", input.id!)
      .eq("status", "draft")
      .select("*")
      .single();
    if (error) throw error;
    invoiceId = (data as Invoice).id;
    const { error: delErr } = await supabase
      .from("invoice_lines")
      .delete()
      .eq("invoice_id", invoiceId);
    if (delErr) throw delErr;
  }

  if (input.lines.length > 0) {
    const rows = input.lines.map((l) => ({
      invoice_id: invoiceId,
      catalog_item_id: l.catalog_item_id || null,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      nature: l.nature,
      position: l.position,
    }));
    const { error: lineErr } = await supabase
      .from("invoice_lines")
      .insert(rows);
    if (lineErr) throw lineErr;
  }

  const { data: fresh, error: fErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (fErr) throw fErr;
  return fresh as Invoice;
}

export async function emitInvoice(
  companyId: string,
  id: string
): Promise<Invoice> {
  const { data: inv, error: gErr } = await supabase
    .from("invoices")
    .select("issue_date, status")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!inv) throw new Error("Facture introuvable");
  if (inv.status !== "draft") throw new Error("Cette facture n'est plus modifiable");
  const parsed = parseISO(inv.issue_date);
  const year = isValid(parsed) ? parsed.getFullYear() : new Date().getFullYear();
  const number = await nextNumber(companyId, "FAC", year);
  const { data, error } = await supabase
    .from("invoices")
    .update({ number, status: "pending" })
    .eq("company_id", companyId)
    .eq("id", id)
    .eq("status", "draft")
    .select("*")
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function markInvoicePaid(
  companyId: string,
  id: string,
  input: { paid_at: string; amount: number; method: PaymentMethod }
): Promise<void> {
  const { data: inv, error: gErr } = await supabase
    .from("invoices")
    .select("total_ttc, status")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!inv) throw new Error("Facture introuvable");

  const { error: payErr } = await supabase.from("payments").insert({
    invoice_id: id,
    amount: input.amount,
    method: input.method,
    paid_at: input.paid_at,
    source: "manual",
  });
  if (payErr) throw payErr;

  const fullyPaid = input.amount >= Number(inv.total_ttc);
  const { error } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: input.paid_at,
      paid_amount: input.amount,
      payment_method: input.method,
    })
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
  void fullyPaid;
}

export async function createCreditNote(
  companyId: string,
  sourceInvoiceId: string
): Promise<Invoice> {
  const existing = await fetchInvoice(companyId, sourceInvoiceId);
  if (!existing) throw new Error("Facture introuvable");
  const { invoice, lines, client } = existing;
  void client;
  const draftNumber = `DRAFT-${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      client_id: invoice.client_id,
      number: draftNumber,
      type: "credit_note",
      status: "draft",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      payment_terms: invoice.payment_terms,
      total_ht: -Math.abs(Number(invoice.total_ht)),
      total_vat: -Math.abs(Number(invoice.total_vat)),
      total_ttc: -Math.abs(Number(invoice.total_ttc)),
      note: `Avoir sur facture ${invoice.number}`,
      credited_invoice_id: sourceInvoiceId,
    })
    .select("*")
    .single();
  if (error) throw error;
  const cn = data as Invoice;
  if (lines.length > 0) {
    const rows = lines.map((l) => ({
      invoice_id: cn.id,
      catalog_item_id: l.catalog_item_id,
      description: l.description,
      quantity: l.quantity,
      unit_price: -Math.abs(Number(l.unit_price)),
      nature: l.nature,
      position: l.position,
    }));
    const { error: lErr } = await supabase.from("invoice_lines").insert(rows);
    if (lErr) throw lErr;
  }
  return cn;
}

export async function convertQuoteToInvoice(
  companyId: string,
  quoteId: string
): Promise<Invoice> {
  const existing = await fetchQuote(companyId, quoteId);
  if (!existing) throw new Error("Devis introuvable");
  const { quote, lines } = existing;
  const draftNumber = `DRAFT-${crypto.randomUUID()}`;
  const dueDate = paymentTermsToDate(quote.issue_date, quote.payment_terms);
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      client_id: quote.client_id,
      quote_id: quoteId,
      number: draftNumber,
      type: "invoice",
      status: "draft",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate,
      payment_terms: quote.payment_terms,
      total_ht: Number(quote.total_ht),
      total_vat: Number(quote.total_vat),
      total_ttc: Number(quote.total_ttc),
      note: quote.note,
    })
    .select("*")
    .single();
  if (error) throw error;
  const inv = data as Invoice;
  if (lines.length > 0) {
    const rows = lines.map((l) => ({
      invoice_id: inv.id,
      catalog_item_id: l.catalog_item_id,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      nature: l.nature,
      position: l.position,
    }));
    const { error: lErr } = await supabase.from("invoice_lines").insert(rows);
    if (lErr) throw lErr;
  }
  return inv;
}

export async function deleteInvoice(
  companyId: string,
  id: string
): Promise<void> {
  const { data: inv, error: gErr } = await supabase
    .from("invoices")
    .select("id, status, quote_id, credited_invoice_id, type")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!inv) throw new Error("Facture introuvable");
  if (inv.status !== "draft") {
    throw new Error("Seuls les brouillons peuvent être supprimés");
  }
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw error;
}

export async function deleteQuote(
  companyId: string,
  id: string
): Promise<void> {
  const { data: q, error: gErr } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!q) throw new Error("Devis introuvable");
  if (q.status !== "draft") {
    throw new Error("Seuls les brouillons peuvent être supprimés");
  }
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw error;
}

export async function fetchInvoiceStats(
  companyId: string
): Promise<{
  totalFacture: number;
  enAttente: number;
  enRetard: number;
  encaisseMois: number;
}> {
  const year = new Date().getFullYear();
  const monthStart = new Date();
  monthStart.setDate(1);
  const { data, error } = await supabase
    .from("invoices")
    .select("total_ttc, paid_amount, status, issue_date, due_date, paid_at, type")
    .eq("company_id", companyId)
    .in("status", ["pending", "late", "paid", "rejected"]);
  if (error) throw error;
  let totalFacture = 0,
    enAttente = 0,
    enRetard = 0,
    encaisseMois = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const i of data || []) {
    const ttc = Number(i.total_ttc);
    if (new Date(i.issue_date).getFullYear() === year) totalFacture += ttc;
    if (i.status === "pending") enAttente += ttc;
    if (i.status === "late") {
      enAttente += ttc;
      enRetard += ttc;
    }
    if (i.status === "paid" && i.paid_at) {
      if (i.paid_at.slice(0, 10) >= monthStart.toISOString().slice(0, 10)) {
        encaisseMois += Number(i.paid_amount) || ttc;
      }
    }
    void today;
  }
  return { totalFacture, enAttente, enRetard, encaisseMois };
}

export async function fetchClientStats(
  companyId: string,
  clientId: string
): Promise<{
  caEncaisse: number;
  enAttente: number;
  delaiMoyen: number | null;
}> {
  const { data, error } = await supabase
    .from("invoices")
    .select("total_ttc, paid_amount, status, issue_date, paid_at, type")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .in("status", ["pending", "late", "paid", "rejected"]);
  if (error) throw error;
  let caEncaisse = 0,
    enAttente = 0;
  const delays: number[] = [];
  for (const i of data || []) {
    if (i.status === "paid") {
      caEncaisse += Number(i.paid_amount) || Number(i.total_ttc);
      if (i.paid_at) {
        const d1 = new Date(i.issue_date).getTime();
        const d2 = new Date(i.paid_at).getTime();
        delays.push(Math.round((d2 - d1) / 86400000));
      }
    } else if (i.status === "pending" || i.status === "late") {
      enAttente += Number(i.total_ttc);
    }
  }
  const delaiMoyen =
    delays.length > 0
      ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
      : null;
  return { caEncaisse, enAttente, delaiMoyen };
}

export async function fetchClientDocuments(
  companyId: string,
  clientId: string
): Promise<{
  invoices: (Invoice & { client_name: string })[];
  quotes: (Quote & { client_name: string })[];
}> {
  const [inv, q] = await Promise.all([
    fetchInvoices(companyId, "all"),
    fetchQuotes(companyId, "all"),
  ]);
  return {
    invoices: inv.filter((i) => i.client_id === clientId),
    quotes: q.filter((q) => q.client_id === clientId),
  };
}

export async function fetchPayments(
  companyId: string,
  invoiceId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Payment[];
}

// ---------- Fiscal constants ----------

export const VAT_THRESHOLDS = {
  service: 36800,
  goods: 91900,
};
export const MICRO_THRESHOLDS = {
  service: 77700,
  goods: 188700,
};

const URSSAF_RATES: Record<ActivityType, { rate: number; abattement: number }> = {
  freelance_bnc: { rate: 0.212, abattement: 0.34 },
  liberal: { rate: 0.212, abattement: 0.34 },
  artisan_bic: { rate: 0.212, abattement: 0.50 },
  commerce: { rate: 0.123, abattement: 0.71 },
};

export function abattementFor(activityType: ActivityType): number {
  return URSSAF_RATES[activityType]?.abattement ?? 0.34;
}

export function urssafRateFor(activityType: ActivityType): number {
  return URSSAF_RATES[activityType]?.rate ?? 0.212;
}

// ---------- Dashboard ----------

export type DashboardPeriod = "month" | "quarter" | "year";

export interface DashboardData {
  caEncaisse: number;
  caPrevious: number;
  caDeltaPct: number | null;
  beneficeFiscal: number;
  cotisationsUrssaf: number;
  netEstime: number;
  netSubtitle: string;
  abattementPct: number;
  monthlyCa: { month: string; ca: number }[];
  recentInvoices: (Invoice & { client_name: string })[];
  upcomingEcheances: (Invoice & { client_name: string })[];
  bestMonth: { month: string; ca: number } | null;
  monthlyAverage: number;
  yearlyCa: number;
  caByNature: { service: number; goods: number };
  nextUrssafDueDate: string | null;
  hasData: boolean;
}

function periodRange(period: DashboardPeriod, now: Date): { start: Date; prevStart: Date; prevEnd: Date } {
  const year = now.getFullYear();
  const month = now.getMonth();
  if (period === "month") {
    const start = new Date(year, month, 1);
    const prevEnd = new Date(year, month, 0);
    const prevStart = new Date(year, month - 1, 1);
    return { start, prevStart, prevEnd };
  }
  if (period === "quarter") {
    const q = Math.floor(month / 3);
    const start = new Date(year, q * 3, 1);
    const prevEnd = new Date(year, q * 3, 0);
    const prevStart = new Date(year, (q - 1) * 3, 1);
    return { start, prevStart, prevEnd };
  }
  const start = new Date(year, 0, 1);
  const prevEnd = new Date(year, 0, 0);
  const prevStart = new Date(year - 1, 0, 1);
  return { start, prevStart, prevEnd };
}

export async function fetchDashboardData(
  companyId: string,
  activityType: ActivityType,
  period: DashboardPeriod = "month",
  tmi: number | null = null
): Promise<DashboardData> {
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, company_id, client_id, quote_id, credited_invoice_id, number, type, status, pa_status, pa_rejection_reason, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_at, paid_amount, payment_method, stripe_payment_link, facturx_pdf_url, ereporting_status, note, created_at, clients(name)"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const invoiceRows = (invoices || []).map((i: any) => ({
    id: i.id,
    company_id: i.company_id,
    client_id: i.client_id,
    quote_id: i.quote_id,
    credited_invoice_id: i.credited_invoice_id,
    number: i.number,
    type: i.type,
    status: i.status,
    pa_status: i.pa_status,
    pa_rejection_reason: i.pa_rejection_reason,
    issue_date: i.issue_date,
    due_date: i.due_date,
    payment_terms: i.payment_terms,
    total_ht: Number(i.total_ht),
    total_vat: Number(i.total_vat),
    total_ttc: Number(i.total_ttc),
    paid_at: i.paid_at,
    paid_amount: i.paid_amount != null ? Number(i.paid_amount) : null,
    payment_method: i.payment_method,
    stripe_payment_link: i.stripe_payment_link,
    facturx_pdf_url: i.facturx_pdf_url,
    ereporting_status: i.ereporting_status,
    note: i.note,
    created_at: i.created_at,
    client_name: i.clients?.name || "—",
  })) as (Invoice & { client_name: string })[];

  const invoiceIds = invoiceRows.map((i) => i.id);

  let payments: Payment[] = [];
  if (invoiceIds.length > 0) {
    const { data: pmt, error: pErr } = await supabase
      .from("payments")
      .select("id, invoice_id, amount, method, paid_at, source")
      .in("invoice_id", invoiceIds);
    if (pErr) throw pErr;
    payments = (pmt || []) as Payment[];
  }

  // fetch invoice lines for per-nature CA split
  let lineNatures: Record<string, ItemNature> = {};
  if (invoiceIds.length > 0) {
    const { data: lines, error: lErr } = await supabase
      .from("invoice_lines")
      .select("invoice_id, nature")
      .in("invoice_id", invoiceIds);
    if (lErr) throw lErr;
    for (const l of (lines || []) as { invoice_id: string; nature: ItemNature }[]) {
      lineNatures[l.invoice_id] = l.nature;
    }
  }

  const now = new Date();
  const { start, prevStart, prevEnd } = periodRange(period, now);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  let caEncaisse = 0;
  let caPrevious = 0;
  let caEncaisseYear = 0;
  const monthlyMap = new Map<string, number>();
  const caByNature = { service: 0, goods: 0 };

  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    monthlyMap.set(format(d, "yyyy-MM"), 0);
  }

  for (const p of payments || []) {
    const amt = Number(p.amount) || 0;
    if (!Number.isFinite(amt)) continue;
    const pdate = parseISO(p.paid_at);
    if (!isValid(pdate)) continue;
    if (pdate >= start) caEncaisse += amt;
    if (pdate >= prevStart && pdate <= prevEnd) caPrevious += amt;
    if (pdate >= yearStart) {
      caEncaisseYear += amt;
      const nature = lineNatures[p.invoice_id] || "service";
      if (nature === "goods") caByNature.goods += amt;
      else caByNature.service += amt;
    }
    const key = format(pdate, "yyyy-MM");
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) || 0) + amt);
  }

  const abattement = abattementFor(activityType);
  const urssafRate = urssafRateFor(activityType);

  // Per-nature fiscal computation for mixed activity
  const isMixed = caByNature.service > 0 && caByNature.goods > 0;
  let beneficeFiscal: number;
  let cotisationsUrssaf: number;
  if (isMixed) {
    const abattementService = abattementFor("liberal");
    const abattementGoods = abattementFor("commerce");
    const rateService = urssafRateFor("liberal");
    const rateGoods = urssafRateFor("commerce");
    const beneficeService = caByNature.service * (1 - abattementService);
    const beneficeGoods = caByNature.goods * (1 - abattementGoods);
    beneficeFiscal = beneficeService + beneficeGoods;
    cotisationsUrssaf = beneficeService * rateService + beneficeGoods * rateGoods;
  } else {
    beneficeFiscal = caEncaisseYear * (1 - abattement);
    cotisationsUrssaf = beneficeFiscal * urssafRate;
  }
  beneficeFiscal = Math.max(0, beneficeFiscal);

  const impot = tmi != null ? beneficeFiscal * tmi : 0;
  const netEstime = beneficeFiscal - cotisationsUrssaf - impot;
  const netSubtitle = tmi != null
    ? "Après cotisations et impôt estimé"
    : "Renseignez votre TMI pour affiner";

  const caDeltaPct = caPrevious > 0
    ? Math.round(((caEncaisse - caPrevious) / caPrevious) * 100)
    : null;

  const recentInvoices = invoiceRows
    .filter((i) => i.status !== "draft")
    .slice(0, 5);

  const upcomingEcheances = invoiceRows
    .filter(
      (i) =>
        (i.status === "pending" || i.status === "late") &&
        i.type !== "credit_note"
    )
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
    .slice(0, 5);

  const monthlyArr = Array.from(monthlyMap.entries())
    .map(([month, ca]) => ({ month, ca: Number.isFinite(ca) ? ca : 0 }))
    .filter((m) => m.month && Number.isFinite(m.ca));
  const bestMonth = monthlyArr.reduce<{ month: string; ca: number } | null>(
    (best, m) => (!best || m.ca > best.ca ? m : best),
    null
  );
  const monthlyAverage = monthlyArr.length
    ? monthlyArr.reduce((s, m) => s + m.ca, 0) / monthlyArr.length
    : 0;

  const hasData = (payments?.length || 0) > 0 || (invoiceRows?.length || 0) > 0;

  return {
    caEncaisse,
    caPrevious,
    caDeltaPct,
    beneficeFiscal,
    cotisationsUrssaf,
    netEstime,
    netSubtitle,
    abattementPct: Math.round(abattement * 100),
    monthlyCa: monthlyArr,
    recentInvoices,
    upcomingEcheances,
    bestMonth: bestMonth && bestMonth.ca > 0 ? bestMonth : null,
    monthlyAverage,
    yearlyCa: caEncaisseYear,
    caByNature,
    nextUrssafDueDate: null,
    hasData,
  };
}

// ---------- Reminders ----------

export async function fetchInvoiceReminders(
  companyId: string,
  invoiceId: string
): Promise<InvoiceReminder[]> {
  void companyId;
  const { data, error } = await supabase
    .from("invoice_reminders")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data || []) as InvoiceReminder[];
}

export async function sendInvoiceReminder(
  companyId: string,
  invoiceId: string,
  invoice: { number: string; due_date: string; total_ttc: number },
  client: { email: string | null; name: string } | null,
  emailContent: { subject: string; body: string }
): Promise<void> {
  if (!client?.email) {
    throw new Error("Client sans email — relance impossible");
  }
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
    "send-email",
    {
      body: {
        to: client.email,
        subject: emailContent.subject,
        body: emailContent.body,
        document_type: "invoice",
        document_id: invoiceId,
      },
    }
  );
  if (error) throw error;
  if (!data || !data.success) throw new Error(data?.error || "Échec de l'envoi email");

  const today = new Date();
  const due = parseISO(invoice.due_date);
  const daysLate = isValid(due) && today > due
    ? Math.floor((today.getTime() - due.getTime()) / 86400000)
    : 0;

  const { error: insErr } = await supabase.from("invoice_reminders").insert({
    invoice_id: invoiceId,
    sent_at: today.toISOString(),
    days_late: daysLate,
  });
  if (insErr) throw insErr;
  void companyId;
}

// ---------- Document email (send on emit) ----------

export async function sendDocumentByEmail(
  documentType: "quote" | "invoice",
  documentId: string,
  to: string,
  emailContent: { subject: string; body: string }
): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
    "send-email",
    {
      body: {
        to,
        subject: emailContent.subject,
        body: emailContent.body,
        document_type: documentType,
        document_id: documentId,
      },
    }
  );
  if (error) throw error;
  if (!data || !data.success) throw new Error(data?.error || "Échec de l'envoi email");
}

// ---------- URSSAF declarations ----------

export interface UrssafPeriod {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  label: string;
  revenue: number;
  estimatedAmount: number;
  declared: boolean;
  declaredAt: string | null;
  id: string | null;
}

export function computeUrssafPeriods(
  companyCreatedAt: string,
  frequency: UrssafFreq,
  payments: Payment[],
  declarations: UrssafDeclaration[]
): UrssafPeriod[] {
  const created = parseISO(companyCreatedAt);
  const now = new Date();
  const periods: UrssafPeriod[] = [];

  const start = new Date(created.getFullYear(), created.getMonth(), 1);
  const endNow = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const stepMonths = frequency === "monthly" ? 1 : 3;
  const declWindowDays = frequency === "monthly" ? 15 : 45;

  for (let d = new Date(start); d < endNow; d.setMonth(d.getMonth() + stepMonths)) {
    const pStart = new Date(d);
    const pEnd = new Date(d.getFullYear(), d.getMonth() + stepMonths, 0);
    const due = new Date(pEnd);
    due.setDate(due.getDate() + declWindowDays);

    const rev = payments
      .filter((p) => {
        const pd = parseISO(p.paid_at);
        return isValid(pd) && pd >= pStart && pd <= new Date(pEnd.getTime() + 86400000);
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const matching = declarations.find((decl) => decl.period_start === format(pStart, "yyyy-MM-dd"));
    const est = rev * 0.212;

    periods.push({
      periodStart: format(pStart, "yyyy-MM-dd"),
      periodEnd: format(pEnd, "yyyy-MM-dd"),
      dueDate: format(due, "yyyy-MM-dd"),
      label: format(pStart, "MMMM yyyy", { locale: fr }),
      revenue: rev,
      estimatedAmount: est,
      declared: !!matching?.declared_at,
      declaredAt: matching?.declared_at || null,
      id: matching?.id || null,
    });
  }
  return periods.reverse();
}

export async function fetchUrssafDeclarations(
  companyId: string
): Promise<UrssafDeclaration[]> {
  const { data, error } = await supabase
    .from("urssaf_declarations")
    .select("*")
    .eq("company_id", companyId)
    .order("period_start", { ascending: false });
  if (error) throw error;
  return (data || []) as UrssafDeclaration[];
}

export async function markUrssafDeclared(
  companyId: string,
  period: UrssafPeriod,
  activityType: ActivityType
): Promise<void> {
  const rate = urssafRateFor(activityType);
  const est = period.revenue * rate;
  const payload = {
    company_id: companyId,
    period_start: period.periodStart,
    period_end: period.periodEnd,
    revenue: period.revenue,
    estimated_amount: est,
    due_date: period.dueDate,
    declared_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("urssaf_declarations")
    .upsert(payload, { onConflict: "company_id,period_start" });
  if (error) throw error;
}

// ---------- Notification counts ----------

export async function fetchLateInvoicesCount(companyId: string): Promise<number> {
  const { count, error } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "late");
  if (error) return 0;
  return count || 0;
}

export async function downloadPdf(
  documentType: "quote" | "invoice",
  documentId: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{
    url?: string;
    error?: string;
  }>("generate-pdf", {
    body: { document_type: documentType, document_id: documentId },
  });
  if (error) throw error;
  if (!data || !data.url) throw new Error(data?.error || "URL PDF manquante");
  return data.url;
}

export async function migrateGuestDraft(companyId: string): Promise<string | null> {
  const LOCAL_STORAGE_KEY = "bylz-guest-draft";
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) return null;

  try {
    const draft = JSON.parse(stored);
    if (!draft || !draft.clientName) return null;

    // Create client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({
        company_id: companyId,
        name: draft.clientName,
        type: draft.clientType || "b2b",
        email: draft.clientEmail || null,
      })
      .select("*")
      .single();

    if (clientErr) throw clientErr;

    // Save invoice draft
    const savedInvoice = await saveInvoice(companyId, {
      client_id: client.id,
      issue_date: draft.issueDate,
      due_date: draft.dueDate,
      payment_terms: draft.paymentTerms || "30d",
      note: draft.note || null,
      lines: (draft.lines || []).map((l: any, idx: number) => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        nature: l.nature,
        position: idx,
      })),
    });

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return savedInvoice.id;
  } catch (err) {
    console.error("Failed to migrate guest draft:", err);
    return null;
  }
}
