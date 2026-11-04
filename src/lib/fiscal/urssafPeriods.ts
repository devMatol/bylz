import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import type { UrssafFreq, Payment, UrssafDeclaration } from "../../types/database.ts";
import { calculateCotisations } from "./cotisations.ts";

export interface UrssafPeriod {
  periodStart: string; // yyyy-MM-dd
  periodEnd: string;
  dueDate: string; // Date limite légale : dernier jour du mois suivant la période
  label: string;
  revenue: number;
  estimatedAmount: number;
  declared: boolean;
  declaredAt: string | null;
  id: string | null;
}

/**
 * Calcule les périodes de déclaration URSSAF (mensuelles ou trimestrielles).
 *
 * Règle légale stricte :
 * - Date limite de déclaration = Dernier jour du mois civil suivant la fin de la période.
 *   - Pour le mois de septembre : 31 octobre
 *   - Pour le mois de novembre : 31 décembre
 *   - Pour le T1 (jan-mars) : 30 avril
 *   - Pour le T2 (avr-juin) : 31 juillet
 *   - Pour le T3 (juil-sept) : 31 octobre
 *   - Pour le T4 (oct-déc) : 31 janvier
 *
 * Cotisations estimées = Chiffre d'Affaires encaissé × Taux légal (via calculateCotisations).
 */
export function computeUrssafPeriods(
  companyCreatedAt: string,
  frequency: UrssafFreq,
  payments: Payment[],
  declarations: UrssafDeclaration[],
  activityType?: string
): UrssafPeriod[] {
  const created = parseISO(companyCreatedAt);
  const now = new Date();
  const periods: UrssafPeriod[] = [];

  const start = new Date(created.getFullYear(), created.getMonth(), 1);
  const endNow = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const stepMonths = frequency === "monthly" ? 1 : 3;

  for (let d = new Date(start); d < endNow; d.setMonth(d.getMonth() + stepMonths)) {
    const pStart = new Date(d);
    const pEnd = new Date(d.getFullYear(), d.getMonth() + stepMonths, 0);
    // Date limite URSSAF légale : dernier jour du mois suivant la période
    const due = new Date(pEnd.getFullYear(), pEnd.getMonth() + 2, 0);

    const rev = payments
      .filter((p) => {
        const pd = parseISO(p.paid_at);
        return isValid(pd) && pd >= pStart && pd <= new Date(pEnd.getTime() + 86400000);
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const matching = declarations.find((decl) => decl.period_start === format(pStart, "yyyy-MM-dd"));
    const cotiCalc = calculateCotisations(rev, activityType);
    const est = cotiCalc.cotisations;

    const periodLabel = frequency === "quarterly"
      ? `T${Math.floor(pStart.getMonth() / 3) + 1} ${pStart.getFullYear()} (${format(pStart, "MMM", { locale: fr })} - ${format(pEnd, "MMM", { locale: fr })})`
      : format(pStart, "MMMM yyyy", { locale: fr });

    periods.push({
      periodStart: format(pStart, "yyyy-MM-dd"),
      periodEnd: format(pEnd, "yyyy-MM-dd"),
      dueDate: format(due, "yyyy-MM-dd"),
      label: periodLabel,
      revenue: rev,
      estimatedAmount: est,
      declared: !!matching?.declared_at,
      declaredAt: matching?.declared_at || null,
      id: matching?.id || null,
    });
  }

  return periods.reverse();
}
