import { type ReactNode } from "react";
import { GlowContainer } from "../shared/GlowContainer";
import { cn } from "../../lib/utils";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthLayout({ title, subtitle, children, footer, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
        <GlowContainer variant="primary" intensity="subtle" className="w-full h-full">
          <></>
        </GlowContainer>
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text">Bylz</h1>
        </div>

        <div
          className={cn(
            "bg-surface border border-border rounded-card p-8 shadow-xl",
            className
          )}
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text mb-1">{title}</h2>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>

        {footer && (
          <div className="text-center mt-6 text-sm text-muted">{footer}</div>
        )}
      </div>
    </div>
  );
}
