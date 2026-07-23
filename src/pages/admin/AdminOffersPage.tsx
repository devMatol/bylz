import { useState, useEffect, useCallback } from "react";
import { Tag, Save, AlertCircle, RefreshCw, CheckCircle2, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Plan, PlanType } from "../../types/database";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { invalidatePlanCache, loadPlansFromDB } from "../../lib/planLimits";

export function AdminOffersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price_cents", { ascending: true });

      if (error) throw error;
      setPlans((data as Plan[]) || []);
    } catch (err) {
      console.error("Error loading plans:", err);
      toast("Erreur lors du chargement des offres", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const handlePlanChange = (key: string, patch: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    );
  };

  const handleFeatureToggle = (key: string, featName: string, val: boolean) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.key !== key) return p;
        const currentFeats = p.features || {};
        return {
          ...p,
          features: {
            ...currentFeats,
            [featName]: val,
          },
        };
      })
    );
  };

  const handleSavePlan = async (plan: Plan) => {
    if (!user) return;
    setSavingKey(plan.key);
    try {
      const { error } = await supabase
        .from("plans")
        .update({
          name: plan.name,
          price_cents: plan.price_cents,
          stripe_price_id: plan.stripe_price_id,
          features: plan.features,
          invoice_limit: plan.invoice_limit === 0 || plan.invoice_limit === null ? null : Number(plan.invoice_limit),
          client_limit: plan.client_limit === 0 || plan.client_limit === null ? null : Number(plan.client_limit),
          is_active: plan.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id);

      if (error) throw error;

      // Log in audit_logs
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "offer_updated",
        target_user_id: null,
        details: { plan_key: plan.key, name: plan.name, price_cents: plan.price_cents },
      });

      // Invalidate in-memory plan cache & reload
      invalidatePlanCache();
      await loadPlansFromDB();

      toast(`Offre ${plan.name} enregistrée avec succès !`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors de la sauvegarde", "danger");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Tag className="w-6 h-6 text-rose-400" />
          <span>Gestion des Offres & Tarifs</span>
        </h1>
        <p className="text-xs text-slate-400">
          Modifiez dynamiquement la configuration des plans, leurs limites et leurs fonctionnalités.
        </p>
      </div>

      {/* Manual Stripe Price Sync Notice */}
      <div className="p-4 rounded-card bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed font-semibold flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-200">Notice de synchronisation Stripe :</p>
          <p>
            Modifier le tarif indicatif ici met à jour la présentation et les calculs dans Bylz. Cela ne modifie pas automatiquement le prix Stripe existant. Pour changer la facturation réelle, créez un nouveau <strong>Price</strong> dans votre dashboard Stripe et collez son ID dans la colonne Stripe Price ID.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton height="16rem" />
      ) : (
        <div className="space-y-6">
          {plans.map((p) => {
            const isSaving = savingKey === p.key;
            return (
              <Card key={p.key} className="bg-slate-900 border-slate-800 p-6 space-y-6 shadow-2xl">
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-card bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center font-mono">
                      {p.key.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handlePlanChange(p.key, { name: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-base font-black text-white focus:outline-none focus:border-rose-500"
                      />
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">Clé interne : {p.key}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={p.is_active}
                        onChange={(e) => handlePlanChange(p.key, { is_active: e.target.checked })}
                        className="accent-rose-500"
                      />
                      <span>Offre active</span>
                    </label>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleSavePlan(p)}
                      loading={isSaving}
                      leftIcon={<Save className="w-4 h-4" />}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Enregistrer {p.name}
                    </Button>
                  </div>
                </div>

                {/* Plan Config Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Prix TTC / Mois (Cents)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={p.price_cents}
                        onChange={(e) => handlePlanChange(p.key, { price_cents: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-rose-500"
                      />
                      <span className="font-mono text-slate-400">({(p.price_cents / 100).toFixed(2)} €)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Stripe Price ID</label>
                    <input
                      type="text"
                      value={p.stripe_price_id || ""}
                      onChange={(e) => handlePlanChange(p.key, { stripe_price_id: e.target.value || null })}
                      placeholder="price_1TvY..."
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Max Factures/Mois</label>
                      <input
                        type="number"
                        value={p.invoice_limit ?? ""}
                        onChange={(e) =>
                          handlePlanChange(p.key, {
                            invoice_limit: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        placeholder="Illimité"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Max Clients</label>
                      <input
                        type="number"
                        value={p.client_limit ?? ""}
                        onChange={(e) =>
                          handlePlanChange(p.key, {
                            client_limit: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        placeholder="Illimité"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Features Toggles JSONB */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                    Fonctionnalités Incluses (jsonb)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { key: "fiscalDashboard", label: "Tableau de Bord Fiscal" },
                      { key: "reminders", label: "Relances Automatiques" },
                      { key: "exports", label: "Exports Comptables" },
                      { key: "paymentLinks", label: "Paiement Stripe Connect" },
                      { key: "multiCompany", label: "Multi-Entreprises" },
                    ].map((f) => {
                      const enabled = !!p.features?.[f.key];
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => handleFeatureToggle(p.key, f.key, !enabled)}
                          className={`p-2.5 rounded-card border text-xs font-bold transition-all text-left flex items-center justify-between ${
                            enabled
                              ? "bg-rose-950/40 border-rose-500/80 text-white"
                              : "bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700"
                          }`}
                        >
                          <span>{f.label}</span>
                          <span className={`w-2 h-2 rounded-full ${enabled ? "bg-rose-400" : "bg-slate-700"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
