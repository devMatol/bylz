/**
 * Module partagé pour les mentions légales obligatoires des factures
 * Utilisé à la fois par le frontend (generateInvoicePdf.ts) et la fonction Edge (generate-pdf/index.ts).
 */

export type LegalStructure = "micro" | "ei" | "sasu" | "sas" | "eurl" | "sarl" | "autre" | string;

/**
 * Règle légale : la mention « EI » (ou « Entrepreneur individuel ») est obligatoire
 * UNIQUEMENT pour les entrepreneurs individuels et micro-entreprises (art. R. 123-237 du Code de commerce).
 * Elle ne doit JAMAIS être ajoutée à une société (SASU, SAS, EURL, SARL, etc.).
 * Si la structure n'est pas renseignée, aucune mention n'est ajoutée.
 */
export function formatCompanyLegalName(name: string, structure?: LegalStructure | null): string {
  const cleanName = (name || "Mon Entreprise").trim();
  const normalizedStructure = (structure || "").toLowerCase().trim();

  const isIndividualEntrepreneur =
    normalizedStructure === "micro" ||
    normalizedStructure === "ei" ||
    normalizedStructure === "auto_entrepreneur";

  if (!isIndividualEntrepreneur) {
    return cleanName;
  }

  const alreadyHasMention =
    /\bEI\b/i.test(cleanName) || /entrepreneur\s+individuel/i.test(cleanName);

  if (alreadyHasMention) {
    return cleanName;
  }

  return `${cleanName} EI`;
}

/**
 * Détermine si le client est un professionnel (B2B).
 * - En priorité : le champ explicite client.type ('b2b' vs 'b2c') saisi par l'utilisateur.
 * - En complément : la présence d'un SIREN ou SIRET client.
 * Si le client est un particulier ('b2c') sans SIRET, retourne false.
 */
export function isB2BClient(client: {
  type?: string | null;
  siren?: string | null;
  siret?: string | null;
  isB2B?: boolean | null;
}): boolean {
  if (typeof client.isB2B === "boolean") {
    return client.isB2B;
  }
  if (client.type === "b2b") {
    return true;
  }
  if (client.type === "b2c") {
    return false;
  }
  return Boolean((client.siret && client.siret.trim().length > 0) || (client.siren && client.siren.trim().length > 0));
}

/**
 * Mentions obligatoires B2B : pénalités de retard et indemnité de recouvrement de 40 €.
 * En B2B, l'article L441-10 du Code de commerce impose d'indiquer :
 * - Le taux des pénalités de retard (trois fois le taux d'intérêt légal en toutes lettres)
 * - L'indemnité forfaitaire de recouvrement de 40 €
 */
export const B2B_LEGAL_PENALTY_MENTION =
  "Pénalités de retard : trois fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.";

/**
 * Mention obligatoire de franchise en base de TVA (art. 293 B du CGI).
 */
export const VAT_FRANCHISE_MENTION =
  "Auto-entrepreneur, TVA non applicable, art. 293 B du CGI";

/**
 * Date de la vente ou de la prestation de services (art. L441-9 du Code de commerce).
 */
export function resolveOperationDate(operationDate?: string | null, issueDate?: string | null): string {
  return operationDate || issueDate || new Date().toISOString();
}
