import { cn } from "../../lib/utils";

interface FilterPillsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-[40px] px-3.5 py-2 rounded-pill text-xs font-semibold border flex-shrink-0 transition-all duration-200 inline-flex items-center justify-center",
            value === o.id
              ? "border-primary bg-primary/10 text-primary dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-400"
              : "border-border text-muted hover:text-text"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
