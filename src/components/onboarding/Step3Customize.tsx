import { useRef, useState, useEffect, type FormEvent, type DragEvent } from "react";
import { Upload, X, Check, FileText, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { OnboardingLayout } from "./OnboardingLayout";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import {
  ACCENT_COLORS,
  PAYMENT_CONDITIONS,
  formatIban,
  isValidFrenchIban,
  buildInvoiceFooter,
  type OnboardingData,
} from "../../lib/onboarding";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface Step3CustomizeProps {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function InvoicePreview({ data }: { data: OnboardingData }) {
  return (
    <div
      className="bg-white rounded-card p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.18)] w-full"
      style={{ aspectRatio: "1 / 1.3" }}
    >
      <div className="flex items-start justify-between mb-3">
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
        ) : (
          <div className="w-8 h-8 rounded bg-gray-200" />
        )}
        <span className="text-[11px] font-bold" style={{ color: data.accentColor }}>
          FACTURE
        </span>
      </div>
      <p className="text-[11px] font-bold text-gray-900 truncate">
        {data.commercialName || data.legalName || "Votre entreprise"}
      </p>
      <p className="text-[9px] text-gray-500 mb-3 truncate">{data.address || "Adresse"}</p>
      <div className="border-t border-gray-200 pt-2 mb-2">
        <div className="flex justify-between text-[9px] text-gray-700">
          <span>Prestation de conseil</span>
          <span>1 200,00 €</span>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-900">Total</span>
          <span className="text-[13px] font-bold" style={{ color: data.accentColor }}>
            1 200,00 €
          </span>
        </div>
      </div>
      {buildInvoiceFooter(data) && (
        <div className="mt-3 pt-2 border-t border-gray-100 space-y-0.5">
          {data.iban && isValidFrenchIban(data.iban) && (
            <p className="text-[8px] leading-tight text-gray-400">IBAN : {formatIban(data.iban)}</p>
          )}
          {data.paymentConditions.map((c) => (
            <p key={c} className="text-[8px] leading-tight text-gray-400">{c}</p>
          ))}
          {data.customMention.trim() && (
            <p className="text-[8px] leading-tight text-gray-400">{data.customMention.trim()}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Step3Customize({ data, update, onSubmit, onBack }: Step3CustomizeProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  async function handleFile(file: File) {
    setUploadError(null);
    if (!file.type.match(/^image\/(png|jpe?g)$/)) {
      setUploadError("Format non supporté. Utilisez PNG ou JPG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Fichier trop volumineux (max 2 Mo).");
      return;
    }
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      update({ logoUrl: urlData.publicUrl });
    } catch {
      setUploadError("Échec de l'envoi du logo.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function removeLogo() {
    update({ logoUrl: null });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit();
  }

  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 60) {
      setSheetOpen(false);
      dragStartY.current = null;
    }
  }
  function onSheetTouchEnd() {
    dragStartY.current = null;
  }

  return (
    <OnboardingLayout step={3} onBack={onBack} wide>
      <div className="text-center mb-6 mt-2">
        <h2 className="text-xl font-bold text-text mb-1">Personnalisez vos factures</h2>
        <p className="text-sm text-muted">Modifiable à tout moment dans les paramètres.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] lg:grid-cols-[60fr_40fr] gap-6 lg:gap-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="text-sm font-bold text-text mb-2 block">Logo</label>
            {data.logoUrl ? (
              <div className="flex items-center gap-3 border border-border rounded-card p-3">
                <img
                  src={data.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 rounded object-cover"
                />
                <Button type="button" variant="ghost" size="sm" onClick={removeLogo} leftIcon={<X className="w-4 h-4" />}>
                  Retirer
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "border-2 border-dashed rounded-card p-6 text-center cursor-pointer transition-colors min-h-[44px]",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <Upload className="w-6 h-6 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">
                  {uploading ? "Envoi…" : "Glissez votre logo ou cliquez"}
                </p>
                <p className="text-xs text-muted mt-1">PNG ou JPG, max 2 Mo</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
              </div>
            )}
            {uploadError && <p className="text-sm text-danger mt-1">{uploadError}</p>}
          </div>

          <Input
            ref={nameRef}
            label="Nom commercial"
            value={data.commercialName}
            onChange={(e) => update({ commercialName: e.target.value })}
            placeholder="Nom affiché sur vos factures"
          />

          <div>
            <label className="text-sm font-bold text-text mb-2 block">Couleur d'accent</label>
            <div className="flex gap-3 flex-wrap">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update({ accentColor: color })}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    data.accentColor === color
                      ? "ring-2 ring-offset-2 ring-offset-surface ring-primary"
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Couleur ${color}`}
                >
                  {data.accentColor === color && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-text">Pied de facture</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-text mb-1.5 block">
                  IBAN (pour vos virements)
                </label>
                <Input
                  value={data.iban}
                  onChange={(e) => update({ iban: formatIban(e.target.value) })}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  inputMode="text"
                  autoComplete="off"
                />
                {data.iban && !isValidFrenchIban(data.iban) && (
                  <p className="text-xs text-error mt-1">Format IBAN français invalide.</p>
                )}
                <p className="text-xs text-muted mt-1">
                  Affiché sur vos factures pour faciliter les virements de vos clients.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-2 block">
                  Conditions de règlement
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_CONDITIONS.map((cond) => {
                    const selected = data.paymentConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() =>
                          update({
                            paymentConditions: selected
                              ? data.paymentConditions.filter((c) => c !== cond)
                              : [...data.paymentConditions, cond],
                          })
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 min-h-[36px]",
                          selected
                            ? "bg-primary/15 text-primary border border-primary/40"
                            : "bg-transparent text-muted border border-border hover:border-text-muted hover:text-text"
                        )}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1.5 block">
                  Mention personnalisée
                </label>
                <textarea
                  value={data.customMention}
                  onChange={(e) =>
                    update({ customMention: e.target.value.slice(0, 200) })
                  }
                  placeholder="Texte libre supplémentaire…"
                  rows={2}
                  maxLength={200}
                  className="w-full min-h-[44px] rounded bg-bg border border-border px-3 py-2 text-sm text-text placeholder:text-muted transition-colors duration-200 focus:border-primary resize-none"
                />
                <p className="text-xs text-muted mt-1 text-right">
                  {data.customMention.length}/200
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            style={{
              background: `linear-gradient(135deg, var(--primary), var(--accent))`,
            }}
          >
            Lancer Bylz 🚀
          </Button>
        </form>

        {/* Desktop / tablet preview column */}
        <div className="hidden md:flex flex-col items-center">
          <Badge variant="primary" className="mb-3 self-center">Aperçu en direct</Badge>
          <div className="sticky top-24 w-full max-w-[340px] md:max-w-[300px] lg:max-w-[340px] mx-auto">
            <InvoicePreview data={data} />
          </div>
        </div>
      </div>

      {/* Mobile preview toggle bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-surface border-t border-border text-sm font-medium text-text shadow-[0_-4px_16px_rgba(0,0,0,0.2)]"
        >
          <Eye className="w-4 h-4" />
          Voir l'aperçu
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-card border-t border-border shadow-2xl"
            style={{ height: "70vh" }}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-semibold text-text">Aperçu en direct</span>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="text-muted hover:text-text p-1"
                aria-label="Fermer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-6 pt-2 flex justify-center">
              <div className="w-full max-w-[340px]">
                <InvoicePreview data={data} />
              </div>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
