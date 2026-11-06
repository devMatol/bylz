import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { formatAmount } from "../../lib/utils";
import type { EreportingBatch } from "../../types/database";

export function ComplianceSection() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState<EreportingBatch[]>([]);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [{ data: bData }, { data: sData }] = await Promise.all([
        supabase
          .from("ereporting_batches")
          .select("*")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false }),
        // Only the availability flag is exposed; the integration row itself
        // holds a secret token and stays private.
        supabase.rpc("einvoicing_token_valid"),
      ]);

      setBatches((bData as EreportingBatch[]) || []);
      setTokenValid(sData !== false);
    } catch (e) {
      console.error("Error loading compliance data:", e);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleGenerateBatch = async () => {
    setGenerating(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("generate-ereporting");
      if (error || (res && !res.success)) {
        if (res?.disabled) {
          toast(res?.reason || "E-reporting B2C : transmission réglementaire bientôt disponible (en attente d'ouverture des flux officiels).", "info");
        } else {
          toast(res?.message || error?.message || "Erreur lors de la génération du batch E-reporting.", "warning");
        }
      } else {
        toast("Batch e-reporting B2C généré et transmis à FactPulse !", "success");
      }
      void loadData();
    } catch (e: any) {
      toast(e.message || "Erreur lors de la génération du batch.", "danger");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-black text-text tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Préparation à la facturation électronique</span>
          </h3>
          <p className="text-xs text-muted mt-1">
            Préparation de la facturation électronique. La transmission via un prestataire n'est pas encore ouverte.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="text-xs font-semibold opacity-60 cursor-not-allowed"
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Bientôt disponible
        </Button>
      </div>

      {/* Standards & Démarche de conformité (Réforme 2026) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-card bg-surface-hover/40 border border-emerald-500/30 space-y-2">
          <p className="text-xs font-bold text-muted uppercase">Loi Anti-Fraude TVA (Inaltérabilité & Traçabilité)</p>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Numérotation séquentielle continue
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Numérotation continue sans rupture et données légales figées dès l'émission de la facture.
          </p>
        </div>

        <div className="p-4 rounded-card bg-surface-hover/40 border border-primary/30 space-y-2">
          <p className="text-xs font-bold text-muted uppercase">Norme Européenne EN 16931 / Factur-X</p>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-primary/20 text-primary font-bold text-xs border border-primary/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Factur-X en préparation
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Factures PDF avec mentions légales obligatoires. Format structuré hybride en cours de préparation pour la norme européenne.
          </p>
        </div>

        <div className="p-4 rounded-card bg-surface-hover/40 border border-border space-y-2">
          <p className="text-xs font-bold text-muted uppercase">Facturation électronique & E-reporting</p>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-surface-hover text-muted font-bold text-xs border border-border">
              <Clock className="w-3.5 h-3.5" /> En préparation
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Données de facturation exportables en CSV. Intégration Factur-X et télétransmission en cours de raccordement.
          </p>
        </div>
      </div>

      {/* E-reporting Batches Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
          Historique des Batches E-reporting (B2C)
        </h4>

        {loading ? (
          <div className="text-xs text-muted py-4">Chargement des batches...</div>
        ) : batches.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted bg-surface-hover/20 rounded-card border border-border">
            Aucun batch d'e-reporting B2C généré pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-hover text-muted font-bold uppercase border-b border-border">
                  <th className="p-3">Période</th>
                  <th className="p-3">Nature</th>
                  <th className="p-3 text-right">Nb Factures</th>
                  <th className="p-3 text-right">Montant Total TTC</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 font-mono">Réf. Transmission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-hover/50">
                    <td className="p-3 font-bold text-text">{b.period_start ? b.period_start.slice(0, 7) : b.created_at.slice(0, 7)}</td>
                    <td className="p-3 font-semibold text-muted uppercase text-xs">{b.nature || "Services"}</td>
                    <td className="p-3 text-right font-mono font-bold">{b.transaction_count || (b as any).count || 0}</td>
                    <td className="p-3 text-right font-mono font-bold text-primary">
                      {formatAmount(Number((b as any).amount_ttc || (b as any).total_ttc || 0))}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-pill text-xs font-bold ${
                          b.status === "confirmed" || (b.status as string) === "submitted"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : b.status === "error"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted">{b.factpulse_ref || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
