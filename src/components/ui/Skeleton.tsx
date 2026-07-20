import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("bylz-skeleton", className)}
      style={{ width, height }}
      {...props}
    />
  );
}
