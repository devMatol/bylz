import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { useSetPageHeader } from "./PageHeaderContext";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageContainerProps) {
  useSetPageHeader({ title, subtitle, actions });
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex-1">{children}</div>
    </div>
  );
}
