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
  height = 42,
  showText = true,
  to = "/",
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
      to={to}
      onClick={onClick}
      className={`inline-flex items-center gap-3 group focus:outline-none select-none ${className}`}
    >
      <img
        src={logoSrc}
        alt="Bylz"
        style={{ height: `${height}px` }}
        className="w-auto object-contain image-rendering-crisp filter drop-shadow-md group-hover:scale-[1.03] transition-transform duration-200"
      />
    </Link>
  );
}
