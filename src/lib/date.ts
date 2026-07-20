import { format, addDays, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export function safeFormatDate(
  d: string | Date | null | undefined,
  fmt = "d MMMM yyyy"
): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return isValid(date) ? format(date, fmt, { locale: fr }) : "—";
}

export function formatDateLong(date: string | Date | null | undefined): string {
  return safeFormatDate(date, "d MMMM yyyy");
}

export function paymentTermsToDate(
  issueDate: string | Date,
  terms: "on_receipt" | "30d" | "60d"
): string {
  const base = typeof issueDate === "string" ? parseISO(issueDate) : issueDate;
  if (!isValid(base)) return "";
  const days = terms === "on_receipt" ? 0 : terms === "30d" ? 30 : 60;
  return format(addDays(base, days), "yyyy-MM-dd");
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDaysISO(date: string, days: number): string {
  const base = parseISO(date);
  if (!isValid(base)) return "";
  return format(addDays(base, days), "yyyy-MM-dd");
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function startOfMonthISO(): string {
  return format(new Date(), "yyyy-MM-01");
}

export function isValidDate(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? parseISO(d) : d;
  return isValid(date);
}
