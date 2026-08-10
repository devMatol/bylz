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
  let iconSrc = "/bylz-icon-gradient.svg";
  if (variant === "white") iconSrc = "/bylz-icon-white.svg";

  return (
    <Link
      to="/"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 group focus:outline-none select-none ${className}`}
    >
      <img
        src={iconSrc}
        alt="Bylz Icon"
        style={{ height: `${height}px` }}
        className="w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
      />
    </Link>
  );
}
