/**
 * prepared_server_quota.ts
 *
 * Logique serveur préparée (NON DÉPLOYÉE) pour l'application stricte du quota
 * WhatsApp Starter (3 factures créées par WhatsApp par mois).
 *
 * RÈGLE STRICTE RESPECTÉE : aucun deploy de fonction ni db push n'est effectué.
 */

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

export interface QuotaCheckResult {
  allowed: boolean;
  count: number;
  limit: number | null;
  errorMessage?: string;
}

/**
 * Vérifie côté serveur si une entreprise peut créer une nouvelle facture via WhatsApp ce mois-ci.
 */
export async function checkWhatsAppMonthlyQuota(
  adminClient: SupabaseClient,
  companyId: string,
  ownerPlan: string,
  isAdmin: boolean
): Promise<QuotaCheckResult> {
  // 1. Pro, unlimited ou admins : usage illimité
  if (ownerPlan === "pro" || ownerPlan === "unlimited" || isAdmin) {
    return { allowed: true, count: 0, limit: null };
  }

  // 2. Solo : pas d'assistant WhatsApp inclus (réservé Starter jusqu'à 3/mois et Pro illimité)
  if (ownerPlan === "solo") {
    return {
      allowed: false,
      count: 0,
      limit: 0,
      errorMessage:
        "⚡ L'assistant WhatsApp n'est pas inclus dans le Plan Solo. Il est disponible gratuitement jusqu'à 3 factures/mois en Starter et en illimité dans le Plan Pro.",
    };
  }

  // 3. Starter : maximum 3 factures créées par WhatsApp par mois calendaire
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();

  const { count, error } = await adminClient
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("created_via", "whatsapp")
    .gte("created_at", startOfMonth);

  if (error) {
    console.error("[WHATSAPP QUOTA] Erreur lors du comptage mensuel :", error);
    // En cas d'erreur de lecture, autoriser pour éviter le blocage utilisateur
    return { allowed: true, count: 0, limit: 3 };
  }

  const currentCount = count || 0;
  if (currentCount >= 3) {
    return {
      allowed: false,
      count: currentCount,
      limit: 3,
      errorMessage:
        "⚠️ Limite mensuelle atteinte : vous avez déjà créé vos 3 factures WhatsApp incluses ce mois-ci sur le Plan Starter. Créez vos prochaines factures sur l'application web (https://bylz.fr/invoices) ou passez au Plan Pro pour un usage illimité.",
    };
  }

  return {
    allowed: true,
    count: currentCount,
    limit: 3,
  };
}
