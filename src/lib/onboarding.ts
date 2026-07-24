import type { ActivityType, UrssafFreq } from "../types/database";

export interface OnboardingData {
  siret: string;
  legalName: string;
  address: string;
  nafCode: string;
  nafLabel: string;
  active: boolean;
  activityType: ActivityType | null;
  urssafFrequency: UrssafFreq;
  logoUrl: string | null;
  commercialName: string;
  accentColor: string;
  iban: string;
  paymentConditions: string[];
  customMention: string;
}

export const PAYMENT_CONDITIONS = [
  "Paiement à réception de facture",
  "Pénalités de retard : 3 fois le taux d'intérêt légal",
  "Indemnité forfaitaire de recouvrement : 40 €",
  "Escompte pour paiement anticipé : néant",
] as const;

export const DEFAULT_PAYMENT_CONDITIONS = [
  "Pénalités de retard : 3 fois le taux d'intérêt légal",
  "Indemnité forfaitaire de recouvrement : 40 €",
];

export function formatIban(raw: string): string {
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

export function isValidFrenchIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "");
  return /^FR\d{25}$/.test(cleaned);
}

export function buildInvoiceFooter(data: OnboardingData): string | null {
  const parts: string[] = [];
  const iban = data.iban.replace(/\s/g, "");
  if (iban) parts.push(`IBAN : ${formatIban(data.iban)}`);
  parts.push(...data.paymentConditions);
  const custom = data.customMention.trim();
  if (custom) parts.push(custom);
  return parts.length ? parts.join("\n") : null;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  siret: "",
  legalName: "",
  address: "",
  nafCode: "",
  nafLabel: "",
  active: true,
  activityType: null,
  urssafFrequency: "quarterly",
  logoUrl: null,
  commercialName: "",
  accentColor: "#7C6FE0",
  iban: "",
  paymentConditions: [...DEFAULT_PAYMENT_CONDITIONS],
  customMention: "",
};

export const ACCENT_COLORS = [
  "#7C6FE0",
  "#6CB8F5",
  "#10B981",
  "#F59E0B",
  "#F43F5E",
  "#64748B",
];

export const ACTIVITY_INFO: Record<
  ActivityType,
  { abattement: string; urssaf: string }
> = {
  freelance_bnc: { abattement: "34%", urssaf: "21.2%" },
  artisan_bic: { abattement: "50%", urssaf: "21.2%" },
  commerce: { abattement: "71%", urssaf: "12.3%" },
  liberal: { abattement: "34%", urssaf: "21.2%" },
};

export function nafToActivityType(nafCode: string): ActivityType | null {
  const prefix = nafCode.slice(0, 2);
  if (["62", "70", "73", "74"].includes(prefix)) return "freelance_bnc";
  if (["41", "42", "43"].includes(prefix)) return "artisan_bic";
  if (["45", "46", "47"].includes(prefix)) return "commerce";
  if (["69", "85", "86", "88"].includes(prefix)) return "liberal";
  return null;
}
