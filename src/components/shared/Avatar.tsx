import { cn } from "../../lib/utils";

const COLORS = [
  "#7C6FE0",
  "#6CB8F5",
  "#10B981",
  "#F59E0B",
  "#F43F5E",
  "#64748B",
  "#EC4899",
  "#14B8A6",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const color = COLORS[hashName(name) % COLORS.length];
  const sizeClass =
    size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white flex-shrink-0",
        sizeClass,
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </span>
  );
}
