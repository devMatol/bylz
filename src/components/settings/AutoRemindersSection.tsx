import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Trash2, Edit3, Eye, ShieldCheck, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { canUseFeature } from "../../lib/planLimits";
import { UpgradeModal } from "../shared/UpgradeModal";
import { ReminderModal } from "../documents/ReminderModal";
import {
  fetchReminderRules,
  saveReminderRule,
  deleteReminderRule,
  toggleCompanyAutoReminders,
} from "../../lib/api";
import type { ReminderRule, ReminderTone } from "../../types/database";

export function AutoRemindersSection() {
  const { profile, company, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [masterEnabled, setMasterEnabled] = useState<boolean>(company?.auto_reminders_enabled !== false);
  const [loading, setLoading] = useState(true);
  const [savingMaster, setSavingMaster] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Edit / Add modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<ReminderRule> | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRule, setPreviewRule] = useState<ReminderRule | null>(null);

  const canUseAutoReminders = canUseFeature(profile?.plan, "reminders");

  const loadRules = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await fetchReminderRules(company.id);
      setRules(data);
    } catch (err: any) {
      toast(err.message || "Erreur lors du chargement des règles de relance", "danger");
    } finally {
      setLoading(false);
    }
  }, [company, toast]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  useEffect(() => {
    if (company) {
      setMasterEnabled(company.auto_reminders_enabled !== false);
    }
  }, [company]);

  const handleMasterToggle = async () => {
    if (!canUseAutoReminders) {
      setUpgradeModalOpen(true);
      return;
    }
    if (!company) return;
    const nextVal = !masterEnabled;
    setMasterEnabled(nextVal);
    setSavingMaster(true);
    try {
      await toggleCompanyAutoReminders(company.id, nextVal);
      toast(
        nextVal
          ? "Relances automatiques activées sur l'ensemble de vos factures !"
          : "Relances automatiques suspendues.",
        "success"
      );
      void refreshProfile();
    } catch (err: any) {
      setMasterEnabled(!nextVal);
      toast(err.message || "Erreur lors de la mise à jour", "danger");
    } finally {
      setSavingMaster(false);
    }
  };

  const handleToggleRule = async (rule: ReminderRule) => {
    if (!company) return;
    try {
      const updated = await saveReminderRule(company.id, {
        id: rule.id,
        enabled: !rule.enabled,
        delay_days: rule.delay_days,
        tone: rule.tone,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: updated.enabled } : r))
      );
      toast(
        updated.enabled
          ? `Règle J+${rule.delay_days} activée`
          : `Règle J+${rule.delay_days} désactivée`,
        "success"
      );
    } catch (err: any) {
      toast(err.message || "Erreur lors de la mise à jour de la règle", "danger");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!company) return;
    try {
      await deleteReminderRule(company.id, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast("Règle de relance supprimée", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la suppression", "danger");
    }
  };

  const handleOpenEdit = (rule?: ReminderRule) => {
    if (!canUseAutoReminders) {
      setUpgradeModalOpen(true);
      return;
    }
    setEditingRule(
      rule || {
        delay_days: 7,
        tone: "friendly",
        enabled: true,
        custom_subject: null,
        custom_body: null,
      }
    );
    setEditModalOpen(true);
  };

  const handleSaveRuleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !editingRule) return;
    setSavingRule(true);
    try {
      await saveReminderRule(company.id, editingRule);
      toast("Règle de relance enregistrée !", "success");
      setEditModalOpen(false);
      void loadRules();
    } catch (err: any) {
      toast(err.message || "Erreur lors de l'enregistrement", "danger");
    } finally {
      setSavingRule(false);
    }
  };

  const toneLabels: Record<ReminderTone, { label: string; color: string }> = {
    friendly: { label: "Amical", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    firm: { label: "Ferme", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    formal: { label: "Formel (Indemnité 40€ B2B)", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-black text-text tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Relances Automatiques des Impayés</span>
          </h3>
          <p className="text-xs text-muted mt-1">
            Bylz relance automatiquement vos clients en retard de paiement avec un ton qui s'intensifie progressivement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted">
            {masterEnabled ? "Activé" : "Suspendu"}
          </span>
          <button
            type="button"
            onClick={handleMasterToggle}
            disabled={savingMaster}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              masterEnabled ? "bg-primary" : "bg-surface-hover border border-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                masterEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Solo+ Feature Lock Banner if Starter */}
      {!canUseAutoReminders && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-text">Fonctionnalité disponible avec les plans Solo & Pro</p>
              <p className="text-xs text-muted">
                Automatisez vos relances d'impayés et gagnez jusqu'à 15 jours de trésorerie sans effort.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setUpgradeModalOpen(true)}
            className="bylz-glow-cta text-xs font-bold whitespace-nowrap"
          >
            Débloquer les relances
          </Button>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
            Échéancier des Relances ({rules.length})
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => handleOpenEdit()}
            className="text-xs"
          >
            Ajouter une échéance de relance
          </Button>
        </div>

        {loading ? (
          <div className="text-xs text-muted py-4">Chargement de l'échéancier...</div>
        ) : rules.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted bg-surface-hover/20 rounded-card border border-border">
            Aucune règle de relance configurée.
          </div>
        ) : (
          <div className="space-y-2.5">
            {rules.map((rule) => {
              const toneInfo = toneLabels[rule.tone];
              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    rule.enabled && masterEnabled
                      ? "bg-surface-hover/30 border-border"
                      : "bg-surface-hover/10 border-border/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">
                      J+{rule.delay_days}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-text">
                          Relance à J+{rule.delay_days}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-extrabold border ${toneInfo.color}`}
                        >
                          {toneInfo.label}
                        </span>
                        {rule.custom_subject && (
                          <span className="text-[10px] font-semibold text-muted bg-surface border border-border px-1.5 py-0.5 rounded">
                            Personnalisé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        Envoyée automatiquement {rule.delay_days} jours après l'échéance de la facture.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewRule(rule);
                        setPreviewOpen(true);
                      }}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-text border border-border transition-colors"
                      title="Aperçu du mail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rule)}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-text border border-border transition-colors"
                      title="Modifier la règle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!rule.id.startsWith("def-") && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-danger border border-border transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ml-1 ${
                        rule.enabled ? "bg-primary" : "bg-surface-hover border border-border"
                      }`}
                      title={rule.enabled ? "Désactiver" : "Activer"}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          rule.enabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Rule Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        className="max-w-xl p-6 space-y-4"
      >
        <h3 className="text-lg font-extrabold text-text">
          {editingRule?.id ? "Modifier l'échéance de relance" : "Ajouter une échéance de relance"}
        </h3>

        <form onSubmit={handleSaveRuleForm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">
              Délai après échéance (en jours)
            </label>
            <Input
              type="number"
              min="1"
              max="180"
              value={editingRule?.delay_days || 7}
              onChange={(e) =>
                setEditingRule((prev) => ({
                  ...prev,
                  delay_days: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">
              Ton du message
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["friendly", "firm", "formal"] as ReminderTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditingRule((prev) => ({ ...prev, tone: t }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    editingRule?.tone === t
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface border-border text-muted hover:text-text"
                  }`}
                >
                  {t === "friendly" ? "Amical" : t === "firm" ? "Ferme" : "Formel"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">
              Sujet de l'email (Optionnel)
            </label>
            <Input
              placeholder="Ex: Rappel amical : Facture {{invoice_number}}"
              value={editingRule?.custom_subject || ""}
              onChange={(e) =>
                setEditingRule((prev) => ({
                  ...prev,
                  custom_subject: e.target.value || null,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">
              Corps du message (Optionnel)
            </label>
            <textarea
              rows={5}
              placeholder="Laissez vide pour utiliser le modèle automatique conforme Bylz..."
              value={editingRule?.custom_body || ""}
              onChange={(e) =>
                setEditingRule((prev) => ({
                  ...prev,
                  custom_body: e.target.value || null,
                }))
              }
              className="w-full bg-surface border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Interactive Variables Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">
              Variables de personnalisation
            </span>
            <p className="text-[11px] text-muted leading-relaxed">
              Cliquez sur une variable ci-dessous pour l'insérer à la fin du corps du message :
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { tag: "{{client_name}}", label: "Nom du client" },
                { tag: "{{invoice_number}}", label: "N° de facture" },
                { tag: "{{amount_ttc}}", label: "Montant TTC" },
                { tag: "{{due_date}}", label: "Date d'échéance" },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => {
                    setEditingRule((prev) => ({
                      ...prev,
                      custom_body: (prev?.custom_body || "") + " " + v.tag,
                    }));
                  }}
                  className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-bold text-primary hover:bg-surface-hover hover:border-primary/30 transition-all flex items-center gap-1"
                >
                  <code className="text-primary font-mono">{v.tag}</code>
                  <span className="text-muted font-normal">({v.label})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={savingRule}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewRule && (
        <ReminderModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onSend={async () => {}}
          clientName="Société Client Exemple"
          clientEmail="comptabilite@client.fr"
          invoiceNumber="FAC-2026-042"
          invoiceAmount={1440.0}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="reminders"
      />
    </Card>
  );
}
