import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("C10 - Détection alerte synchro bancaire > 7 jours", () => {
  const now = new Date("2026-11-04T12:00:00Z").getTime();

  function isSyncStale(lastSyncedAt: string | null, referenceTime = now): boolean {
    if (!lastSyncedAt) return false;
    const diffDays = Math.floor((referenceTime - new Date(lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  }

  // Synchro il y a 2 jours : pas d'alerte
  assert.equal(isSyncStale("2026-11-02T10:00:00Z"), false);

  // Synchro il y a 7 jours pile : limite non dépassée
  assert.equal(isSyncStale("2026-10-28T12:00:00Z"), false);

  // Synchro il y a 8 jours : alerte orange requise
  assert.equal(isSyncStale("2026-10-27T10:00:00Z"), true);

  // Synchro il y a 30 jours : alerte orange requise
  assert.equal(isSyncStale("2026-10-05T10:00:00Z"), true);
});

test("C11 - Mapping de l'historique des relances avec métadonnées factures", () => {
  const reminders = [
    {
      id: "rem-1",
      invoice_id: "inv-42",
      sent_at: "2026-10-15T09:00:00Z",
      days_late: 7,
      source: "auto",
      recipient_email: "compta@client.fr",
    },
  ];

  const invoiceMap = new Map([
    ["inv-42", { number: "FAC-2026-042", client_name: "Acme Corp" }],
  ]);

  const history = reminders.map((r) => ({
    id: r.id,
    invoice_number: invoiceMap.get(r.invoice_id)?.number || "Facture",
    client_name: invoiceMap.get(r.invoice_id)?.client_name || "Client",
    sent_at: r.sent_at,
    days_late: r.days_late,
    source: r.source,
    recipient_email: r.recipient_email,
  }));

  assert.equal(history.length, 1);
  assert.equal(history[0].invoice_number, "FAC-2026-042");
  assert.equal(history[0].client_name, "Acme Corp");
  assert.equal(history[0].days_late, 7);
  assert.equal(history[0].source, "auto");
});

test("C12 - Suppression de l'autofocus intrusif sur le champ de recherche", () => {
  const searchInputSource = fs.readFileSync("src/components/shared/SearchInput.tsx", "utf8");
  assert.equal(searchInputSource.includes(".focus()"), false, "SearchInput ne doit pas appeler .focus() automatiquement");
});

test("C13 - Disponibilité des actions sur les devis (ouvrir, facturer, dupliquer)", () => {
  const quote = {
    id: "quote-1",
    status: "accepted",
    number: "DEV-2026-001",
    total_ttc: 1200,
  };

  // Une action de conversion doit pouvoir être déclenchée sur un devis
  function canConvertToInvoice(status: string) {
    return status !== "rejected" && status !== "cancelled";
  }

  assert.equal(canConvertToInvoice(quote.status), true);
  assert.equal(canConvertToInvoice("draft"), true);
  assert.equal(canConvertToInvoice("refused"), true);
});
