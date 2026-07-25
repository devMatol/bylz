import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  label: string;
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

export function FloatingActionButton({
  label,
  to,
  onClick,
  icon = <Plus className="w-5 h-5" />,
}: FloatingActionButtonProps) {
  const content = (
    <div className="flex items-center space-x-2 px-4 py-3 rounded-full bg-primary text-white font-extrabold text-xs shadow-xl shadow-primary/30 border border-white/20 active:scale-95 transition-transform bylz-glow-cta">
      {icon}
      <span>{label}</span>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="md:hidden fixed bottom-20 right-4 z-40 focus:outline-none"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden fixed bottom-20 right-4 z-40 focus:outline-none"
    >
      {content}
    </button>
  );
}
