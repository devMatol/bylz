import test from "node:test";
import assert from "node:assert/strict";

test("B5 - Statut avoir : un avoir n'est jamais En retard", () => {
  // Simule la normalisation de statut des factures / avoirs
  function normalizeInvoiceStatus(type: "invoice" | "credit_note", status: string, totalTtc: number, paidAmount?: number | null) {
    if (type === "credit_note") {
      if (status === "late") {
        return (paidAmount != null && paidAmount >= totalTtc) ? "paid" : "pending";
      }
    }
    return status;
  }

  assert.equal(normalizeInvoiceStatus("credit_note", "late", 100, 0), "pending");
  assert.equal(normalizeInvoiceStatus("credit_note", "late", 100, 100), "paid");
  assert.equal(normalizeInvoiceStatus("invoice", "late", 100, 0), "late");
});

test("B5 - Échéances : séparation stricte entre futur (upcoming) et passé (late)", () => {
  const today = "2026-11-04";
  const rows = [
    { id: "1", due_date: "2026-10-15", status: "late", type: "invoice" },
    { id: "2", due_date: "2026-10-30", status: "late", type: "invoice" },
    { id: "3", due_date: "2026-12-04", status: "pending", type: "invoice" },
    { id: "4", due_date: "2026-12-15", status: "pending", type: "invoice" },
    { id: "5", due_date: "2026-11-02", status: "late", type: "credit_note" }, // avoir ne doit pas être dans late
  ];

  const upcoming = rows
    .filter((i) => i.type !== "credit_note" && (i.status === "pending" || i.status === "partially_paid") && i.due_date >= today)
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1));

  const late = rows
    .filter((i) => i.type !== "credit_note" && (i.status === "pending" || i.status === "late" || i.status === "partially_paid") && i.due_date < today)
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1));

  // La facture du 4 décembre doit impérativement être la première des prochaines échéances
  assert.equal(upcoming.length, 2);
  assert.equal(upcoming[0].id, "3");
  assert.equal(upcoming[0].due_date, "2026-12-04");

  // Les retards contiennent 2 factures échues, l'avoir est exclu
  assert.equal(late.length, 2);
  assert.equal(late.find((i) => i.type === "credit_note"), undefined);
});

test("B6 - Pourcentage seuil avec virgule française et graduation axe graphique", () => {
  // Calcul proportionnel sans saut artificiel
  const ca = 600;
  const threshold = 77700;
  const rawPercent = (ca / threshold) * 100;
  const formattedPct = rawPercent.toFixed(1).replace(".", ",");
  assert.equal(formattedPct, "0,8");

  // Graduation axe graphique (pas d'arrondi 2.5k -> 3k ou 7.5k -> 8k)
  function formatAxisTick(labelVal: number) {
    const valInK = labelVal / 1000;
    return (valInK % 1 === 0 ? `${valInK}k` : `${valInK.toFixed(1).replace(".", ",")}k`) + " €";
  }

  assert.equal(formatAxisTick(2500), "2,5k €");
  assert.equal(formatAxisTick(5000), "5k €");
  assert.equal(formatAxisTick(7500), "7,5k €");
  assert.equal(formatAxisTick(10000), "10k €");
});

test("B7 - Calcul CA facturé client : MON AUTO affiche ses 4 factures et 16 050 €", () => {
  const monAutoInvoices = [
    { client_id: "client-auto", total_ttc: 50, status: "late", type: "invoice" },
    { client_id: "client-auto", total_ttc: 1000, status: "late", type: "invoice" },
    { client_id: "client-auto", total_ttc: 5000, status: "late", type: "invoice" },
    { client_id: "client-auto", total_ttc: 10000, status: "late", type: "invoice" },
    { client_id: "client-auto", total_ttc: 200, status: "draft", type: "invoice" }, // brouillon exclu
  ];

  const stats = new Map<string, { total_ca: number; invoice_count: number }>();
  for (const i of monAutoInvoices) {
    if (i.status === "draft") continue;
    const s = stats.get(i.client_id) || { total_ca: 0, invoice_count: 0 };
    const invAmount = Number(i.total_ttc) || 0;
    if (i.type === "credit_note") {
      s.total_ca -= invAmount;
    } else {
      s.total_ca += invAmount;
      s.invoice_count += 1;
    }
    stats.set(i.client_id, s);
  }

  const clientStats = stats.get("client-auto")!;
  assert.equal(clientStats.invoice_count, 4);
  assert.equal(clientStats.total_ca, 16050);
});
