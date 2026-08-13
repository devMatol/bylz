import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "gradient" | "white" | "navy" | "icon";
  className?: string;
  height?: number;
  showText?: boolean;
  onClick?: () => void;
}

export function Logo({
  variant = "gradient",
  className = "",
  height = 36,
  showText = true,
  onClick,
}: LogoProps) {
  let logoSrc = "/bylz-logo-gradient.svg";

  if (showText && variant !== "icon") {
    if (variant === "white") {
      logoSrc = "/bylz-logo-white.svg";
    } else if (variant === "navy") {
      logoSrc = "/bylz-logo-navy.svg";
    } else {
      logoSrc = "/bylz-logo-gradient.svg";
    }
  } else {
    if (variant === "white") {
      logoSrc = "/bylz-icon-white.svg";
    } else {
      logoSrc = "/bylz-icon-gradient.svg";
    }
  }

  return (
    <Link
      to="/"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 group focus:outline-none select-none ${className}`}
    >
      <img
        src={logoSrc}
        alt="Bylz Logo"
        style={{ height: `${height}px` }}
        className="w-auto object-contain drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-200"
      />
    </Link>
  );
}
