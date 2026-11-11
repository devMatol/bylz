import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, ArrowRight } from "lucide-react";
import type { Company } from "../../types/database";

interface OnboardingChecklistProps {
  company: Company | null;
  clientsCount: number;
  invoicesCount: number;
}

export function OnboardingChecklist({
  company,
  clientsCount,
  invoicesCount,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("bylz-onboarding-checklist-dismissed") === "true";
  });
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("bylz-onboarding-checklist-collapsed") === "true";
  });

  const steps = [
    {
      id: "company_info",
      title: "Infos de l'entreprise",
      desc: "Raison sociale & adresse de facturation",
      completed: Boolean(company?.legal_name && company.legal_name !== "Mon Entreprise" && company.address),
      link: "/settings",
      actionText: "Configurer",
    },
    {
      id: "siret",
      title: "Numéro SIRET (14 chiffres)",
      desc: "Obligatoire sur toutes vos factures",
      completed: Boolean(company?.siret && company.siret.replace(/\s/g, "").length === 14),
      link: "/settings",
      actionText: "Ajouter",
    },
    {
      id: "iban",
      title: "Coordonnées bancaires (IBAN)",
      desc: "Requis pour le règlement et la facturation",
      completed: Boolean(
        (company as any)?.iban ||
        (company?.invoice_footer && /IBAN/i.test(company.invoice_footer))
      ),
      link: "/settings?tab=bank",
      actionText: "Renseigner",
    },
    {
      id: "logo",
      title: "Logo d'entreprise",
      desc: "Pour personnaliser vos devis & factures PDF",
      completed: Boolean(company?.logo_url),
      link: "/settings",
      actionText: "Importer",
    },
    {
      id: "first_client",
      title: "Premier client",
      desc: "Ajoutez les coordonnées de votre premier client",
      completed: clientsCount > 0 || invoicesCount > 0,
      link: "/clients",
      actionText: "Créer un client",
    },
    {
      id: "first_invoice",
      title: "Première facture",
      desc: "Émettez votre première facture conforme",
      completed: invoicesCount > 0,
      link: "/invoices/new",
      actionText: "Créer une facture",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem("bylz-onboarding-checklist-dismissed", "true");
    setDismissed(true);
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("bylz-onboarding-checklist-collapsed", String(next));
  };

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl bg-surface border border-border shadow-sm overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/70 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-primary dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text truncate">
                Premiers pas sur Bylz
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {completedCount}/{steps.length} étapes
              </span>
            </div>
            <p className="text-xs text-muted truncate mt-0.5">
              Complétez votre profil pour émettre des factures 100 % conformes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label={collapsed ? "Déplier la checklist" : "Replier la checklist"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Masquer la checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      {!collapsed && (
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                step.completed
                  ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                  : "bg-surface border-border text-text hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold ${step.completed ? "line-through text-slate-600 dark:text-slate-300" : "text-text"}`}>
                    {idx + 1}. {step.title}
                  </p>
                  <p className={`text-[11px] leading-tight mt-0.5 ${step.completed ? "text-slate-500 dark:text-slate-400" : "text-muted"}`}>
                    {step.desc}
                  </p>
                </div>
              </div>

              {!step.completed && (
                <div className="mt-3 pt-2 border-t border-border/50 flex justify-end">
                  <Link
                    to={step.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover"
                  >
                    <span>{step.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
