/**
 * Fonctions pures et partagées pour l'intégration FactPulse
 * - Validation d'adresses
 * - Concordance arithmétique de TVA et totaux
 * - Mapping des codes statut du cycle de vie (AFNOR XP Z12-012 / DGFIP / Invopop)
 * - Vérification cryptographique des signatures de webhook et limitation anti-rejeu
 * - Filtrage strict des données à caractère personnel (RGPD)
 */

/**
 * Contrôle strict fail-closed d'autorisation d'émission FactPulse.
 * L'URL étant unique (https://factpulse.fr/api/v1), aucun envoi réseau
 * n'est autorisé sans accord explicite FACTPULSE_ALLOW_PRODUCTION="true".
 */
export function isFactPulseTransmissionAllowed(envAllowProduction?: string | null): {
  allowed: boolean;
  status?: number;
  errorCode?: string;
  error?: string;
} {
  if (envAllowProduction !== "true") {
    return {
      allowed: false,
      status: 403,
      errorCode: "production_disabled",
      error: "Transmission à la facturation électronique désactivée pour le moment.",
    };
  }
  return { allowed: true };
}

export interface FactPulseAddressInput {
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

/**
 * Valide qu'une adresse comporte rue, code postal et ville non vides.
 * Bloque avec un message explicite adapté au rôle.
 */
export function validateFactPulseAddress(
  input: FactPulseAddressInput | null | undefined,
  role: "émetteur" | "client"
): { valid: boolean; street: string; postalCode: string; city: string; error?: string } {
  const street = (input?.address || "").trim();
  const postalCode = (input?.postal_code || "").trim();
  const city = (input?.city || "").trim();

  if (!street || !postalCode || !city) {
    const error =
      role === "émetteur"
        ? "Adresse de l'émetteur incomplète. L'adresse (rue), le code postal et la ville sont obligatoires pour la facturation électronique."
        : "Adresse du client B2B incomplète. L'adresse (rue), le code postal et la ville sont obligatoires pour la facturation électronique.";
    return { valid: false, street, postalCode, city, error };
  }

  return { valid: true, street, postalCode, city };
}

export interface FactPulseLineInput {
  quantity: number;
  unitPrice: number;
  vatRate?: number;
}

/**
 * Contrôle l'arithmétique exacte entre les lignes et les totaux enregistrés sur la facture.
 * Évite tout rejet Schematron (BR-CO-10, BR-CO-13, BR-CO-15, etc.).
 */
export function verifyInvoiceTotalsConcordance(
  lines: FactPulseLineInput[],
  invoiceTotalHt: number,
  invoiceTotalVat: number,
  invoiceTotalTtc: number,
  vatRegime: "franchise" | "vat" = "franchise"
): {
  valid: boolean;
  computedHt: number;
  computedVat: number;
  computedTtc: number;
  error?: string;
} {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const isFranchise = vatRegime === "franchise";

  const computedHt = round2(
    lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  );

  const computedVat = isFranchise
    ? 0
    : round2(
        lines.reduce((sum, l) => {
          const rate = l.vatRate !== undefined ? Number(l.vatRate) : 20;
          const lineHt = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
          return sum + round2((lineHt * rate) / 100);
        }, 0)
      );

  const computedTtc = round2(computedHt + computedVat);

  const diffHt = Math.abs(computedHt - Number(invoiceTotalHt || 0));
  const diffVat = Math.abs(computedVat - Number(invoiceTotalVat || 0));
  const diffTtc = Math.abs(computedTtc - Number(invoiceTotalTtc || 0));

  if (diffHt > 0.05) {
    return {
      valid: false,
      computedHt,
      computedVat,
      computedTtc,
      error: `Écart arithmétique sur le total HT : lignes (${computedHt.toFixed(2)} €) vs facture (${Number(invoiceTotalHt).toFixed(2)} €).`,
    };
  }

  if (diffVat > 0.05) {
    return {
      valid: false,
      computedHt,
      computedVat,
      computedTtc,
      error: `Écart arithmétique sur le total TVA : lignes (${computedVat.toFixed(2)} €) vs facture (${Number(invoiceTotalVat).toFixed(2)} €).`,
    };
  }

  if (diffTtc > 0.05) {
    return {
      valid: false,
      computedHt,
      computedVat,
      computedTtc,
      error: `Écart arithmétique sur le total TTC : calculé (${computedTtc.toFixed(2)} €) vs facture (${Number(invoiceTotalTtc).toFixed(2)} €).`,
    };
  }

  return { valid: true, computedHt, computedVat, computedTtc };
}

export interface PaStatusMapping {
  pa_status: "submitted" | "delivered" | "accepted" | "rejected" | "litigation" | "suspended" | null;
  rank: number;
  code: number;
  label: string;
  isKnown: boolean;
  isTerminal: boolean;
}

/**
 * Rang de priorité des statuts pour empêcher toute régression dans le cycle de vie
 */
export function getPaStatusRank(status: string | null | undefined): number {
  switch (status) {
    case "none":
      return 0;
    case "submitting":
      return 5;
    case "submitted":
      return 10;
    case "delivered":
      return 20;
    case "litigation":
      return 25;
    case "suspended":
      return 26;
    case "accepted":
      return 30;
    case "rejected":
      return 40;
    default:
      return 0;
  }
}

/**
 * Mapping des codes du cycle de vie du statut de facture.
 * Source normative :
 * - Norme AFNOR XP Z12-012 (Tableau BR-FR-CDV-CL-06)
 * - Spécifications DGFIP Facturation Électronique Annexe 6 (Cycle de vie des flux)
 * - Invopop French Public Administration status guide (https://docs.invopop.com/guides/fr-pa-status)
 * - FactPulse API Documentation (https://factpulse.fr/api/facturation/documentation)
 *
 * Définition exhaustive des codes 200 à 213 :
 * 200 : Déposée (par le fournisseur) -> submitted (rank 10)
 * 201 : Émise (par la plateforme) -> submitted (rank 11)
 * 202 : Reçue (par la plateforme destinataire) -> submitted (rank 12)
 * 203 : Mise à disposition (de l'acheteur) -> delivered (rank 20)
 * 204 : Prise en charge (par l'acheteur) -> delivered (rank 21)
 * 205 : Approuvée (par l'acheteur) -> accepted (rank 30)
 * 206 : Approuvée partiellement -> accepted (rank 31)
 * 207 : En litige -> litigation (rank 25) (distinct de submitted)
 * 208 : Suspendue -> suspended (rank 26) (distinct de submitted)
 * 209 : Complétée -> null (rank 22) (statut informatif d'enrichissement de données, n'est PAS un rejet)
 * 210 : Refusée (par l'acheteur) -> rejected (rank 40, terminal)
 * 211 : Paiement transmis -> accepted (rank 32)
 * 212 : Encaissée -> accepted (rank 33, terminal)
 * 213 : Rejetée par la plateforme -> rejected (rank 40, terminal)
 */
export function mapCdarStatusCodeToPaStatus(
  statusCode: number | string | null | undefined,
  eventType?: string
): PaStatusMapping {
  const code = Number(statusCode);

  switch (code) {
    case 200:
      return { pa_status: "submitted", rank: 10, code: 200, label: "Déposée", isKnown: true, isTerminal: false };
    case 201:
      return { pa_status: "submitted", rank: 11, code: 201, label: "Émise", isKnown: true, isTerminal: false };
    case 202:
      return { pa_status: "submitted", rank: 12, code: 202, label: "Reçue", isKnown: true, isTerminal: false };
    case 203:
      return { pa_status: "delivered", rank: 20, code: 203, label: "Mise à disposition", isKnown: true, isTerminal: false };
    case 204:
      return { pa_status: "delivered", rank: 21, code: 204, label: "Prise en charge", isKnown: true, isTerminal: false };
    case 205:
      return { pa_status: "accepted", rank: 30, code: 205, label: "Approuvée", isKnown: true, isTerminal: false };
    case 206:
      return { pa_status: "accepted", rank: 31, code: 206, label: "Approuvée partiellement", isKnown: true, isTerminal: false };
    case 207:
      return { pa_status: "litigation", rank: 25, code: 207, label: "En litige", isKnown: true, isTerminal: false };
    case 208:
      return { pa_status: "suspended", rank: 26, code: 208, label: "Suspendue", isKnown: true, isTerminal: false };
    case 209:
      // 209 n'est PAS un rejet, mais une notification de complétion de métadonnées
      return { pa_status: null, rank: 22, code: 209, label: "Complétée", isKnown: true, isTerminal: false };
    case 210:
      return { pa_status: "rejected", rank: 40, code: 210, label: "Refusée", isKnown: true, isTerminal: true };
    case 211:
      return { pa_status: "accepted", rank: 32, code: 211, label: "Paiement transmis", isKnown: true, isTerminal: false };
    case 212:
      return { pa_status: "accepted", rank: 33, code: 212, label: "Encaissée", isKnown: true, isTerminal: true };
    case 213:
      return { pa_status: "rejected", rank: 40, code: 213, label: "Rejetée par la plateforme", isKnown: true, isTerminal: true };
    default:
      if (eventType === "submission.completed") {
        return { pa_status: "submitted", rank: 10, code: 200, label: "Soumission confirmée par l'API", isKnown: true, isTerminal: false };
      }
      if (eventType === "submission.failed") {
        return { pa_status: "rejected", rank: 40, code: 213, label: "Échec de soumission", isKnown: true, isTerminal: true };
      }
      return { pa_status: null, rank: 0, code: code || 0, label: `Statut non répertorié (${statusCode})`, isKnown: false, isTerminal: false };
  }
}

/**
 * Vérification HMAC-SHA256 à temps constant et contrôle d'horodatage anti-rejeu.
 * Référence documentation FactPulse SDK & Webhooks : https://factpulse.fr/api/facturation/documentation
 *
 * Header 'X-Webhook-Signature' : sha256=<hex> ou hex direct.
 * Si X-Webhook-Timestamp est présent, l'absence ou expiration (>300s) rejette la requête.
 */
export async function verifyWebhookSignatureAndTime(
  rawBody: string,
  signatureHeader: string | null | undefined,
  timestampHeader: string | null | undefined,
  secret: string | null | undefined,
  maxDriftSeconds = 300,
  nowTimestampSec = Math.floor(Date.now() / 1000)
): Promise<{ valid: boolean; reason?: string }> {
  // Échec fermé : si le secret est absent ou vide, refus systématique
  if (!secret || secret.trim() === "") {
    return { valid: false, reason: "Secret webhook non configuré (échec fermé)." };
  }

  if (!signatureHeader || signatureHeader.trim() === "") {
    return { valid: false, reason: "En-tête X-Webhook-Signature manquant." };
  }

  // Contrôle de l'horodatage anti-rejeu
  if (timestampHeader) {
    const eventTime = parseInt(timestampHeader, 10);
    if (Number.isNaN(eventTime)) {
      return { valid: false, reason: "En-tête X-Webhook-Timestamp invalide." };
    }
    const drift = Math.abs(nowTimestampSec - eventTime);
    if (drift > maxDriftSeconds) {
      return { valid: false, reason: `Horodatage expiré ou hors tolérance (écart: ${drift}s > ${maxDriftSeconds}s).` };
    }
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret.trim());
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const cleanHex = signatureHeader.trim().replace(/^sha256=/i, "");
    if (cleanHex.length % 2 !== 0) {
      return { valid: false, reason: "Format de signature hexadécimal invalide." };
    }

    const sigBytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      sigBytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }

    // FactPulse signe soit le corps brut, soit timestamp + "." + corps si timestamp fourni
    const bodyBytes = encoder.encode(rawBody);
    let isValid = await crypto.subtle.verify("HMAC", key, sigBytes, bodyBytes);

    if (!isValid && timestampHeader) {
      const combined = encoder.encode(`${timestampHeader}.${rawBody}`);
      isValid = await crypto.subtle.verify("HMAC", key, sigBytes, combined);
    }

    if (!isValid) {
      return { valid: false, reason: "Signature HMAC invalide." };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Erreur cryptographique : ${err.message}` };
  }
}

/**
 * Nettoyage récursif de toutes les données personnelles (RGPD) avant enregistrement dans les logs ou tables.
 */
export function sanitizeWebhookPayload(payload: any): any {
  if (!payload || typeof payload !== "object") return {};
  if (Array.isArray(payload)) {
    return payload.map(sanitizeWebhookPayload);
  }

  const clean: Record<string, any> = {};
  const piiKeys = new Set([
    "email",
    "phone",
    "telephone",
    "customer_name",
    "client_name",
    "buyer_name",
    "seller_name",
    "first_name",
    "last_name",
    "nom",
    "prenom",
    "iban",
    "bic",
    "address",
    "street",
    "pdp_credentials",
    "password",
    "token",
    "secret",
  ]);

  for (const [k, v] of Object.entries(payload)) {
    const lowerKey = k.toLowerCase();
    if (piiKeys.has(lowerKey)) {
      clean[k] = "[MASQUÉ]";
    } else if (typeof v === "string") {
      if (v.length > 100 && /^[A-Za-z0-9+/=]+$/.test(v.slice(0, 80))) {
        clean[k] = `${v.slice(0, 30)}... [TRONQUÉ ${v.length} octets]`;
      } else {
        clean[k] = v;
      }
    } else if (typeof v === "object" && v !== null) {
      clean[k] = sanitizeWebhookPayload(v);
    } else {
      clean[k] = v;
    }
  }

  return clean;
}

/**
 * Récupération des transmissions orphelines bloquées au statut 'submitting' :
 * Si une facture est 'submitting' depuis plus de thresholdMinutes (défaut: 10 min),
 * son statut est réinitialisé à 'none' afin de débloquer de nouveaux essais.
 */
export async function recoverStaleSubmittingStatus(
  client: any,
  invoiceId: string,
  thresholdMinutes = 10,
  nowMs = Date.now()
): Promise<{ recovered: boolean }> {
  const thresholdDate = new Date(nowMs - thresholdMinutes * 60 * 1000).toISOString();

  if (typeof client.query === "function") {
    const res = await client.query(
      "UPDATE public.invoices SET pa_status = 'none' WHERE id = $1 AND pa_status = 'submitting' AND pa_status_updated_at < $2 RETURNING id;",
      [invoiceId, thresholdDate]
    );
    return { recovered: res.rows.length > 0 };
  }

  const { data, error } = await client
    .from("invoices")
    .update({ pa_status: "none" })
    .eq("id", invoiceId)
    .eq("pa_status", "submitting")
    .lt("pa_status_updated_at", thresholdDate)
    .select("id");

  if (error) {
    console.warn("Avertissement lors de la récupération du statut bloqué :", error.message);
    return { recovered: false };
  }

  return { recovered: Array.isArray(data) && data.length > 0 };
}

/**
 * Réservation atomique avant tout appel externe payant.
 * Seules les factures avec pa_status IN ('none', 'rejected') peuvent être réservées.
 */
export async function attemptAtomicReservation(
  client: any,
  invoiceId: string
): Promise<{ reserved: boolean; error?: string }> {
  if (typeof client.query === "function") {
    const res = await client.query(
      "UPDATE public.invoices SET pa_status = 'submitting' WHERE id = $1 AND pa_status IN ('none', 'rejected') RETURNING id, pa_status;",
      [invoiceId]
    );
    if (res.rows.length === 0) {
      return {
        reserved: false,
        error: "Une transmission pour cette facture est déjà en cours ou a été validée simultanément.",
      };
    }
    return { reserved: true };
  }

  const { data, error } = await client
    .from("invoices")
    .update({ pa_status: "submitting" })
    .eq("id", invoiceId)
    .in("pa_status", ["none", "rejected"])
    .select("id, pa_status")
    .maybeSingle();

  if (error) {
    return { reserved: false, error: error.message };
  }

  if (!data) {
    return {
      reserved: false,
      error: "Une transmission pour cette facture est déjà en cours ou a été validée simultanément.",
    };
  }

  return { reserved: true };
}

/**
 * Décision de succès d'une soumission FactPulse :
 * Succès UNIQUEMENT si afnorResult.flowId est présent et non vide.
 * Plus aucun repli sur destinationType.
 */
export function decideSubmissionSuccess(resData: any): {
  success: boolean;
  flowId?: string;
  rejectionReason?: string;
} {
  const flowId = resData?.afnorResult?.flowId;
  if (flowId && typeof flowId === "string" && flowId.trim() !== "") {
    return { success: true, flowId: flowId.trim() };
  }

  const rejectionReason =
    resData?.afnorResult?.rejectionReason ||
    resData?.afnorResult?.error ||
    resData?.message ||
    resData?.detail ||
    "Rejet FactPulse : aucun identifiant de flux AFNOR (flowId) attribué.";

  return { success: false, rejectionReason };
}

/**
 * Restauration de l'état précédent en cas d'échec ou d'exception.
 */
export async function restorePreviousStatus(
  client: any,
  invoiceId: string,
  previousStatus: string,
  rejectionReason?: string | null
): Promise<void> {
  const updateData: Record<string, any> = {
    pa_status: previousStatus,
  };
  if (rejectionReason !== undefined) {
    updateData.pa_rejection_reason = rejectionReason;
  }

  if (typeof client.query === "function") {
    await client.query(
      "UPDATE public.invoices SET pa_status = $1, pa_rejection_reason = $2 WHERE id = $3;",
      [previousStatus, rejectionReason || null, invoiceId]
    );
    return;
  }

  await client
    .from("invoices")
    .update(updateData)
    .eq("id", invoiceId);
}

