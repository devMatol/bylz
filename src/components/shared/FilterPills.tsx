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
            "px-3 py-1.5 rounded-pill text-sm font-semibold border transition-all duration-200",
            value === o.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted hover:text-text"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
