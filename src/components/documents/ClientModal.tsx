import { useState, useEffect, useRef, type FormEvent } from "react";
import { Loader2, Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { useToast } from "../ui/Toast";
import { createClient, updateClient } from "../../lib/api";
import type { Client, ClientType } from "../../types/database";

interface SiretResult {
  legal_name: string;
  address: string;
  naf_code: string;
  naf_label: string;
  active: boolean;
}

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  client?: Client | null;
  onSaved?: (client: Client) => void;
}

function formatSiret(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
}
function siretDigits(s: string): string {
  return s.replace(/\s/g, "");
}
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ClientModal({
  open,
  onClose,
  companyId,
  client,
  onSaved,
}: ClientModalProps) {
  const { toast } = useToast();
  const isEdit = !!client;
  const [type, setType] = useState<ClientType>(client?.type || "b2b");
  const [name, setName] = useState(client?.name || "");
  const [email, setEmail] = useState(client?.email || "");
  const [address, setAddress] = useState(client?.address || "");
  const [siretInput, setSiretInput] = useState(
    client?.siret ? formatSiret(client.siret) : ""
  );
  const [vatNumber, setVatNumber] = useState(client?.vat_number || "");
  const [siretStatus, setSiretStatus] = useState<
    "idle" | "loading" | "found" | "error"
  >("idle");
  const [siretResult, setSiretResult] = useState<SiretResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    setType(client?.type || "b2b");
    setName(client?.name || "");
    setEmail(client?.email || "");
    setAddress(client?.address || "");
    setSiretInput(client?.siret ? formatSiret(client.siret) : "");
    setVatNumber(client?.vat_number || "");
    setSiretStatus("idle");
    setSiretResult(null);
    setErrorMsg(null);
    setErrors({});
  }, [open, client]);

  // SIRET lookup for B2B
  useEffect(() => {
    if (!open || type !== "b2b") return;
    const digits = siretDigits(siretInput);
    if (digits.length === 14) {
      setSiretStatus("loading");
      setErrorMsg(null);
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
      lookupTimer.current = setTimeout(() => {
        void lookupSiret(digits);
      }, 300);
    } else if (digits.length < 14) {
      setSiretStatus("idle");
      setSiretResult(null);
      setErrorMsg(null);
    }
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siretInput, type, open]);

  async function lookupSiret(siret: string) {
    try {
      const { data: json, error } = await supabase.functions.invoke<SiretResult>(
        "siret-lookup",
        { body: { siret } }
      );
      if (error) throw new Error(error.message || "Erreur de recherche");
      if (!json) throw new Error("Réponse vide");
      setSiretResult(json);
      setName(json.legal_name);
      setAddress(json.address);
      setSiretStatus("found");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur de recherche");
      setSiretStatus("error");
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Le nom est requis";
    if (email.trim() && !isValidEmail(email.trim()))
      e.email = "Email invalide";
    if (type === "b2b" && siretDigits(siretInput).length !== 14)
      e.siret = "SIRET invalide (14 chiffres)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    try {
      const siret = type === "b2b" ? siretDigits(siretInput) : null;
      const siren = type === "b2b" && siret ? siret.slice(0, 9) : null;
      const payload = {
        name: name.trim(),
        type,
        siren,
        siret,
        vat_number: vatNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      };
      const saved = isEdit
        ? await updateClient(companyId, client!.id, payload)
        : await createClient(companyId, payload);
      toast(
        isEdit ? "Client mis à jour" : "Client créé",
        "success"
      );
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le client" : "Nouveau client"}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Type selector */}
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            {(["b2b", "b2c"] as ClientType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "border rounded-card p-4 text-left transition-all duration-200",
                  type === t
                    ? "border-primary bg-primary/5 bylz-glow-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-bold text-text">
                    {t === "b2b" ? "Professionnel (B2B)" : "Particulier (B2C)"}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {t === "b2b"
                    ? "Entreprise avec SIRET"
                    : "Client particulier sans SIRET"}
                </p>
              </button>
            ))}
          </div>
        )}

        {type === "b2b" && (
          <>
            <Input
              label="SIRET"
              placeholder="XXX XXX XXX XXXXX"
              value={siretInput}
              onChange={(e) => setSiretInput(formatSiret(e.target.value))}
              inputMode="numeric"
              error={errors.siret}
              disabled={isEdit}
              helperText={isEdit ? "Le SIRET n'est pas modifiable" : undefined}
            />
            {siretStatus === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Recherche SIRENE…
              </div>
            )}
            {siretStatus === "found" && siretResult && (
              <div className="border border-primary/40 rounded-card p-3 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-text truncate">
                    {siretResult.legal_name}
                  </p>
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3" />
                    Vérifié
                  </Badge>
                </div>
                <p className="text-sm text-muted">{siretResult.address}</p>
              </div>
            )}
            {siretStatus === "error" && (
              <p className="text-sm text-danger flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errorMsg || "SIRET introuvable"}
              </p>
            )}
            <Input
              label="Numéro de TVA (optionnel)"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="FRXX123456789"
            />
          </>
        )}

        <Input
          label={type === "b2b" ? "Raison sociale" : "Nom"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Email (optionnel)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="client@exemple.fr"
        />
        <Input
          label="Adresse"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresse postale"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            {isEdit ? "Enregistrer" : "Créer le client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
