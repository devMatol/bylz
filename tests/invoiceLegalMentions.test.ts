import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCompanyLegalName,
  isB2BClient,
  resolveOperationDate,
  B2B_LEGAL_PENALTY_MENTION,
} from "../src/lib/invoiceLegalMentions.ts";

test("Mention EI : ajoutée uniquement pour micro et entrepreneur individuel", () => {
  // Micro / EI sans mention -> ajoutée
  assert.equal(formatCompanyLegalName("Jean Dupont", "micro"), "Jean Dupont EI");
  assert.equal(formatCompanyLegalName("Jean Dupont", "ei"), "Jean Dupont EI");
  assert.equal(formatCompanyLegalName("Jean Dupont", "auto_entrepreneur"), "Jean Dupont EI");

  // Si mention déjà présente -> pas de doublon
  assert.equal(formatCompanyLegalName("Jean Dupont EI", "micro"), "Jean Dupont EI");
  assert.equal(formatCompanyLegalName("Jean Dupont Entrepreneur Individuel", "micro"), "Jean Dupont Entrepreneur Individuel");

  // Sociétés -> JAMAIS de mention EI
  assert.equal(formatCompanyLegalName("Acme SASU", "sasu"), "Acme SASU");
  assert.equal(formatCompanyLegalName("Tech SARL", "sarl"), "Tech SARL");
  assert.equal(formatCompanyLegalName("Studio EURL", "eurl"), "Studio EURL");
  assert.equal(formatCompanyLegalName("Global SAS", "sas"), "Global SAS");
  assert.equal(formatCompanyLegalName("Autre Entreprise", "autre"), "Autre Entreprise");

  // Non renseigné -> aucune mention ajoutée
  assert.equal(formatCompanyLegalName("Mon Entreprise", undefined), "Mon Entreprise");
  assert.equal(formatCompanyLegalName("Mon Entreprise", null), "Mon Entreprise");
  assert.equal(formatCompanyLegalName("Mon Entreprise", ""), "Mon Entreprise");
});

test("Détection client B2B vs Particulier", () => {
  // Client explicitement B2B
  assert.equal(isB2BClient({ type: "b2b" }), true);

  // Client avec SIRET / SIREN
  assert.equal(isB2BClient({ type: "b2c", siret: "12345678900012" }), false); // type b2c explicite prime
  assert.equal(isB2BClient({ siret: "12345678900012" }), true);
  assert.equal(isB2BClient({ siren: "123456789" }), true);

  // Particulier sans SIRET
  assert.equal(isB2BClient({ type: "b2c" }), false);
  assert.equal(isB2BClient({ name: "M. Martin" }), false);
});

test("Date de prestation / vente", () => {
  assert.equal(resolveOperationDate("2026-05-10", "2026-05-15"), "2026-05-10");
  assert.equal(resolveOperationDate(undefined, "2026-05-15"), "2026-05-15");
});

test("Mention des pénalités de retard en toutes lettres", () => {
  assert.match(B2B_LEGAL_PENALTY_MENTION, /trois fois le taux d'intérêt légal/);
  assert.match(B2B_LEGAL_PENALTY_MENTION, /40 €/);
});
