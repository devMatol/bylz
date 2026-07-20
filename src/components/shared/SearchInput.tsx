import { type InputHTMLAttributes, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className,
  ...props
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (value === "") ref.current.focus();
  }, []);
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded bg-bg border border-border pl-10 pr-3 text-sm text-text placeholder:text-muted transition-colors duration-200 focus:border-primary"
        {...props}
      />
    </div>
  );
}
