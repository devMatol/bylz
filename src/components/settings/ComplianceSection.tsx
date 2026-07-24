import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { formatAmount } from "../../lib/utils";
import type { EreportingBatch, FactpulseStatus } from "../../types/database";
import { FactPulseModeToggle } from "../admin/FactPulseModeToggle";
import { StripeModeToggle } from "../admin/StripeModeToggle";

export function ComplianceSection() {
  const { company, user, profile, realProfile } = useAuth();
  const activeProfile = realProfile || profile;
  const isOwnerEmail = user?.email?.toLowerCase() === "matthiasollivier123@gmail.com";
  const isSuperAdmin = activeProfile?.admin_role === "super_admin" || isOwnerEmail;

  const { toast } = useToast();
  const [batches, setBatches] = useState<EreportingBatch[]>([]);
  const [status, setStatus] = useState<FactpulseStatus | null>(null);
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
        supabase
          .from("factpulse_status")
          .select("*")
          .eq("id", "default")
          .maybeSingle(),
      ]);

      setBatches((bData as EreportingBatch[]) || []);
      setStatus((sData as FactpulseStatus) || null);
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
        toast(res?.message || error?.message || "Erreur lors de la génération du batch E-reporting.", "warning");
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
            <span>Conformité E-invoicing & FactPulse (PDP)</span>
          </h3>
          <p className="text-xs text-muted mt-1">
            Transmission réglementaire B2B et e-reporting mensuel B2C centralisé via la plateforme PDP FactPulse.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleGenerateBatch}
          loading={generating}
          className="bylz-glow-cta text-xs font-bold"
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          Générer Batch E-Reporting (B2C)
        </Button>
      </div>

      {/* FactPulse & Stripe Connection Status */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FactPulseModeToggle />
          <StripeModeToggle />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-card bg-surface-hover/40 border border-border space-y-1">
          <p className="text-xs font-bold text-muted uppercase">Statut Connexion PDP FactPulse</p>
          <div className="flex items-center space-x-2 pt-1">
            {status && status.token_valid === false ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Token Expiré
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Actif & Conforme
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-card bg-surface-hover/40 border border-border space-y-1">
          <p className="text-xs font-bold text-muted uppercase">Automatisation Mensuelle Cron</p>
          <p className="text-xs text-text font-medium pt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Exécution le <strong>5 du mois à 02:00 UTC</strong></span>
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
                  <th className="p-3 font-mono">Réf. FactPulse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-hover/50">
                    <td className="p-3 font-bold text-text">{b.period_start ? b.period_start.slice(0, 7) : b.created_at.slice(0, 7)}</td>
                    <td className="p-3 font-semibold text-muted uppercase text-[11px]">{b.nature || "Services"}</td>
                    <td className="p-3 text-right font-mono font-bold">{b.transaction_count || (b as any).count || 0}</td>
                    <td className="p-3 text-right font-mono font-bold text-primary">
                      {formatAmount(Number((b as any).amount_ttc || (b as any).total_ttc || 0))}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
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
                    <td className="p-3 font-mono text-[11px] text-muted">{b.factpulse_ref || "-"}</td>
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
