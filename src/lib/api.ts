import { supabase } from "./supabase";
import { paymentTermsToDate } from "./date";
import { parseISO, isValid, format } from "date-fns";
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
      "id, company_id, client_id, quote_id, number, type, status, pa_status, pa_rejection_reason, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_at, paid_amount, payment_method, stripe_payment_link, facturx_pdf_url, ereporting_status, note, created_at, clients(name)"
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
): Promise<{ invoice: Invoice; lines: InvoiceLine[]; client: Client | null } | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const invoice = data as Invoice;
  const [linesRes, clientRes] = await Promise.all([
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
  ]);
  if (linesRes.error) throw linesRes.error;
  if (clientRes.error) throw clientRes.error;
  return {
    invoice,
    lines: (linesRes.data || []) as InvoiceLine[],
    client: (clientRes.data as Client) || null,
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
      note: `Avoir sur ${invoice.number}`,
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
    .neq("type", "credit_note");
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
    .neq("type", "credit_note");
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

// ---------- Dashboard ----------

export interface DashboardData {
  caEncaisse: number;
  beneficeFiscal: number;
  cotisationsUrssaf: number;
  netEstime: number;
  monthlyCa: { month: string; ca: number }[];
  recentInvoices: (Invoice & { client_name: string })[];
  upcomingEcheances: (Invoice & { client_name: string })[];
}

const URSSAF_RATES: Record<ActivityType, { rate: number; abattement: number }> = {
  freelance_bnc: { rate: 0.22, abattement: 0.71 },
  liberal: { rate: 0.22, abattement: 0.34 },
  artisan_bic: { rate: 0.123, abattement: 0.71 },
  commerce: { rate: 0.123, abattement: 0.71 },
};

export async function fetchDashboardData(
  companyId: string,
  activityType: ActivityType
): Promise<DashboardData> {
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, company_id, client_id, quote_id, number, type, status, pa_status, pa_rejection_reason, issue_date, due_date, payment_terms, total_ht, total_vat, total_ttc, paid_at, paid_amount, payment_method, stripe_payment_link, facturx_pdf_url, ereporting_status, note, created_at, clients(name)"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const invoiceRows = (invoices || []).map((i: any) => ({
    id: i.id,
    company_id: i.company_id,
    client_id: i.client_id,
    quote_id: i.quote_id,
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

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let caEncaisse = 0;
  let caEncaisseYear = 0;
  const monthlyMap = new Map<string, number>();

  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    monthlyMap.set(format(d, "yyyy-MM"), 0);
  }

  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    const pdate = parseISO(p.paid_at);
    if (!isValid(pdate)) continue;
    if (pdate >= monthStart) caEncaisse += amt;
    if (pdate >= yearStart) caEncaisseYear += amt;
    const key = format(pdate, "yyyy-MM");
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) || 0) + amt);
  }

  const { rate, abattement } = URSSAF_RATES[activityType] || URSSAF_RATES.freelance_bnc;
  const beneficeFiscal = caEncaisseYear * (1 - abattement);
  const cotisationsUrssaf = beneficeFiscal * rate;
  const netEstime = caEncaisseYear - cotisationsUrssaf;

  const recentInvoices = invoiceRows
    .filter((i) => i.status !== "draft" && i.type !== "credit_note")
    .slice(0, 5);

  const todayISO = now.toISOString().slice(0, 10);
  const upcomingEcheances = invoiceRows
    .filter(
      (i) =>
        (i.status === "pending" || i.status === "late") &&
        i.type !== "credit_note"
    )
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
    .slice(0, 5);
  void todayISO;

  return {
    caEncaisse,
    beneficeFiscal: Math.max(0, beneficeFiscal),
    cotisationsUrssaf,
    netEstime,
    monthlyCa: Array.from(monthlyMap.entries()).map(([month, ca]) => ({
      month,
      ca,
    })),
    recentInvoices,
    upcomingEcheances,
  };
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
