import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "gradient" | "white" | "navy" | "icon";
  className?: string;
  height?: number;
  showText?: boolean;
  to?: string;
  onClick?: () => void;
}

export function Logo({
  variant = "gradient",
  className = "",
  height = 38,
  showText = true,
  to = "/",
  onClick,
}: LogoProps) {
  const isWhite = variant === "white";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 group focus:outline-none select-none ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* High-DPI Vector Mark */}
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto object-contain flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ maxHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="bylzLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C6FE0" />
            <stop offset="50%" stopColor="#5046E5" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          fill={isWhite ? "#FFFFFF" : "url(#bylzLogoGrad)"}
        />

        {/* Lightning Bolt Symbol */}
        <path
          d="M56 16 L24 54 H48 L42 84 L76 46 H52 Z"
          fill={isWhite ? "#5046E5" : "#FFFFFF"}
        />
      </svg>

      {/* Typography */}
      {showText && variant !== "icon" && (
        <span
          className={`font-black tracking-tighter transition-opacity duration-200 ${
            isWhite ? "text-white" : "text-text"
          }`}
          style={{ fontSize: `${Math.round(height * 0.72)}px`, lineHeight: 1 }}
        >
          bylz
          <span className="text-primary font-black">.</span>
        </span>
      )}
    </Link>
  );
}
