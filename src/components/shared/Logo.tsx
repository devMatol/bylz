import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "gradient" | "white" | "navy" | "icon";
  className?: string;
  height?: number;
  showText?: boolean;
}

export function Logo({
  variant = "gradient",
  className = "",
  height = 32,
  showText = true,
}: LogoProps) {
  let logoSrc = "/bylz-logo-gradient.svg";
  if (variant === "white") logoSrc = "/bylz-logo-white.svg";
  if (variant === "navy") logoSrc = "/bylz-logo-navy.svg";
  if (variant === "icon") logoSrc = "/bylz-icon-gradient.svg";

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group focus:outline-none ${className}`}>
      {variant === "icon" ? (
        <img
          src="/bylz-icon-gradient.svg"
          alt="Bylz Icon"
          style={{ height: `${height}px` }}
          className="w-auto object-contain group-hover:scale-105 transition-transform"
        />
      ) : (
        <img
          src={logoSrc}
          alt="Bylz Logo"
          style={{ height: `${height}px` }}
          className="w-auto object-contain group-hover:scale-105 transition-transform"
        />
      )}
    </Link>
  );
}
