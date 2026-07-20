export function cn(...classes: (string | false | null | undefined | 0)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatAmount(
  value: number,
  options: { currency?: boolean } = {}
): string {
  const { currency = true } = options;
  const formatterOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (currency) {
    formatterOptions.style = "currency";
    formatterOptions.currency = "EUR";
  }
  return new Intl.NumberFormat("fr-FR", formatterOptions).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
