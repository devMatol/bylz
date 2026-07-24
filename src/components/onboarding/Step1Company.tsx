import { useState, useEffect, useRef, type FormEvent } from "react";
import { Building2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { OnboardingLayout } from "./OnboardingLayout";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import type { OnboardingData } from "../../lib/onboarding";

interface SiretResult {
  legal_name: string;
  address: string;
  naf_code: string;
  naf_label: string;
  active: boolean;
}

interface Step1CompanyProps {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}

function formatSiret(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
}

function siretDigits(formatted: string): string {
  return formatted.replace(/\s/g, "");
}

export function Step1Company({ data, update, onNext }: Step1CompanyProps) {
  const [siretInput, setSiretInput] = useState(data.siret ? formatSiret(data.siret) : "");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "error" | "inactive">("idle");
  const [result, setResult] = useState<SiretResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState(data.legalName);
  const [manualAddress, setManualAddress] = useState(data.address);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siretRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    siretRef.current?.focus();
  }, []);

  useEffect(() => {
    const digits = siretDigits(siretInput);
    if (digits.length === 14) {
      setStatus("loading");
      setErrorMsg(null);
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
      lookupTimer.current = setTimeout(() => {
        void lookupSiret(digits);
      }, 300);
    } else if (digits.length < 14) {
      setStatus("idle");
      setResult(null);
      setErrorMsg(null);
    }
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [siretInput]);

  async function lookupSiret(siret: string) {
    try {
      const { data: json, error } = await supabase.functions.invoke<SiretResult>(
        "siret-lookup",
        { body: { siret } }
      );
      if (error) throw new Error(error.message || "Erreur de recherche");
      if (!json) throw new Error("Réponse vide du service SIRET");
      setResult(json);
      update({
        siret,
        legalName: json.legal_name,
        address: json.address,
        nafCode: json.naf_code,
        nafLabel: json.naf_label,
        active: json.active,
      });
      setStatus(json.active ? "found" : "inactive");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur de recherche");
      setStatus("error");
    }
  }

  const canContinue =
    (status === "found" || status === "inactive") ||
    (manualMode && manualName.trim() && manualAddress.trim());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (manualMode) {
      update({
        siret: siretDigits(siretInput),
        legalName: manualName.trim(),
        address: manualAddress.trim(),
      });
    }
    onNext();
  }

  return (
    <OnboardingLayout step={1}>
      <div className="text-center mb-6 mt-2">
        <h2 className="text-xl font-bold text-text mb-1">Votre entreprise</h2>
        <p className="text-sm text-muted">Saisissez votre SIRET, on s'occupe du reste.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          ref={siretRef}
          label="SIRET"
          placeholder="XXX XXX XXX XXXXX"
          value={siretInput}
          onChange={(e) => setSiretInput(formatSiret(e.target.value))}
          inputMode="numeric"
          required
        />

        {status === "loading" && (
          <div className="border border-border rounded-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Recherche dans le registre SIRENE…
            </div>
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="1rem" width="50%" />
          </div>
        )}

        {(status === "found" || status === "inactive") && result && (
          <div
            className={cn(
              "border rounded-card p-4 transition-all duration-200",
              status === "found"
                ? "border-primary/40 bylz-glow-primary bg-primary/5"
                : "border-warning/40 bg-warning/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-card bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-text truncate">{result.legal_name}</p>
                  {status === "found" && (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" />
                      IDENTITÉ VÉRIFIÉE ✓
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted">{result.address}</p>
                <p className="text-sm text-muted mt-1">
                  {result.naf_label} (NAF {result.naf_code})
                </p>
                {status === "inactive" && (
                  <p className="text-sm text-warning mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Cet établissement est signalé fermé.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted mt-3">
              Vos informations sont récupérées automatiquement depuis le registre officiel SIRENE (INSEE).
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
              {errorMsg || "SIRET introuvable."}
            </p>
            {!manualMode && (
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="text-sm text-primary font-semibold hover:underline self-start"
              >
                Saisir manuellement
              </button>
            )}
          </div>
        )}

        {manualMode && (
          <div className="flex flex-col gap-3">
            <Input
              label="Raison sociale"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Adresse"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              required
            />
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={!canContinue}
        >
          Confirmer et continuer
        </Button>
      </form>
    </OnboardingLayout>
  );
}
