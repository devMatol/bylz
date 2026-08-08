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
  height = 36,
  showText = true,
}: LogoProps) {
  let iconSrc = "/bylz-icon-gradient.svg";
  if (variant === "white") iconSrc = "/bylz-icon-white.svg";

  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 group focus:outline-none select-none ${className}`}
    >
      <img
        src={iconSrc}
        alt="Bylz Icon"
        style={{ height: `${height}px` }}
        className="w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
      />
      {showText && variant !== "icon" && (
        <span className="text-xl sm:text-2xl font-black tracking-tight text-text font-sans flex items-center">
          Bylz<span className="text-primary font-black">.</span>
        </span>
      )}
    </Link>
  );
}
