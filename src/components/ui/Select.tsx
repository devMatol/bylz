import {
  type SelectHTMLAttributes,
  forwardRef,
  useId,
  type ReactNode,
} from "react";
import { cn } from "../../lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, className, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold text-text"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full h-10 rounded bg-bg border border-border px-3 text-text transition-colors duration-200 focus:border-primary",
            error && "border-danger",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <span className="text-sm text-danger">{error}</span>
        ) : helperText ? (
          <span className="text-sm text-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
