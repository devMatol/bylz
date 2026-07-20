import {
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useId,
} from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-text"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 rounded bg-bg border border-border px-3 text-text placeholder:text-muted transition-all duration-200 input-focus",
              leftIcon && "pl-10",
              error && "border-danger",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-sm text-danger">{error}</span>
        ) : helperText ? (
          <span className="text-sm text-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
