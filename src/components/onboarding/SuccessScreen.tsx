import { useNavigate } from "react-router-dom";
import { Receipt, Users, LayoutDashboard, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../lib/utils";

interface SuccessScreenProps {
  migratedInvoiceId?: string | null;
}

export function SuccessScreen({ migratedInvoiceId }: SuccessScreenProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Receipt,
      title: migratedInvoiceId ? "Finaliser ma facture" : "Créer ma première facture",
      desc: migratedInvoiceId
        ? "Émettez la facture que vous venez de préparer"
        : "Émettez une facture en quelques minutes",
      path: migratedInvoiceId ? `/invoices/${migratedInvoiceId}` : "/invoices/new",
    },
    {
      icon: Users,
      title: "Ajouter un client",
      desc: "Constituez votre base de clients",
      path: "/clients",
    },
    {
      icon: LayoutDashboard,
      title: "Explorer le tableau de bord",
      desc: "Découvrez votre espace de pilotage",
      path: "/",
    },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-[640px] text-center">
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
            <svg viewBox="0 0 52 52" className="w-12 h-12">
              <circle cx="26" cy="26" r="24" fill="none" stroke="var(--primary)" strokeWidth="3" opacity="0.2" />
              <path
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27 L22 35 L38 18"
                style={{
                  strokeDasharray: 48,
                  strokeDashoffset: 48,
                  animation: "bylz-check-draw 0.6s ease 0.2s forwards",
                }}
              />
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes bylz-check-draw {
            to { stroke-dashoffset: 0; }
          }
        `}</style>

        <h1 className="text-2xl font-bold text-text mb-2">
          {migratedInvoiceId ? "Votre espace est prêt ! Votre facture vous attend." : "Votre espace est prêt !"}
        </h1>
        <p className="text-sm text-muted mb-8">
          {migratedInvoiceId ? "Félicitations, votre compte Bylz est configuré et votre brouillon a été importé." : "Félicitations, votre compte Bylz est configuré."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.path}
                hover
                glow
                className="cursor-pointer text-left flex flex-col"
                onClick={() => navigate(action.path)}
              >
                <div className="w-10 h-10 rounded-card bg-primary/15 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-text text-sm mb-1">{action.title}</p>
                <p className="text-xs text-muted mb-3">{action.desc}</p>
                <span className="text-xs text-primary font-semibold flex items-center gap-1 mt-auto">
                  Commencer <ArrowRight className="w-3 h-3" />
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
