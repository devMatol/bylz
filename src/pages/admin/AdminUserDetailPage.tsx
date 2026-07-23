import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  User,
  Building,
  Shield,
  Eye,
  Gift,
  AlertOctagon,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Profile, Company, PlanType } from "../../types/database";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ConfirmModal } from "../../components/documents/ConfirmModal";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../contexts/AuthContext";
import { useImpersonation } from "../../contexts/ImpersonationContext";
import { useToast } from "../../components/ui/Toast";
import { formatDateShort } from "../../lib/date";

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const { startImpersonation } = useImpersonation();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Modals
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("solo");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [{ data: prof }, { data: comp }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("companies").select("*").eq("user_id", id).maybeSingle(),
      ]);

      if (prof) {
        setProfileData(prof as Profile);
        setSelectedPlan(prof.plan || "starter");
      }
      if (comp) setCompanyData(comp as Company);
    } catch (err) {
      console.error("Error loading user detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handlers
  const handleStartImpersonation = async () => {
    if (!adminUser || !id) return;
    setBusy(true);
    try {
      const success = await startImpersonation(adminUser.id, id);
      if (success) {
        toast("Session d'impersonation démarrée", "success");
        navigate("/dashboard");
      } else {
        toast("Impossible de démarrer l'impersonation", "danger");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
      setImpersonateModalOpen(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!adminUser || !id) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ plan: selectedPlan })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        admin_id: adminUser.id,
        action: "plan_override",
        target_user_id: id,
        details: { new_plan: selectedPlan },
      });

      toast(`Plan mis à jour : ${selectedPlan.toUpperCase()}`, "success");
      void loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
      setPlanModalOpen(false);
    }
  };

  const handleGiveTrial = async () => {
    if (!adminUser || !id) return;
    setBusy(true);
    try {
      const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ plan: "pro", trial_ends_at: trialEnds })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        admin_id: adminUser.id,
        action: "trial_gift",
        target_user_id: id,
        details: { trial_ends_at: trialEnds, plan: "pro" },
      });

      toast("Essai Pro 14 jours offert !", "success");
      void loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!adminUser || !id || !profileData) return;
    setBusy(true);
    try {
      const isSuspended = !!profileData.suspended_at;
      const nextSuspended = isSuspended ? null : new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({ suspended_at: nextSuspended })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        admin_id: adminUser.id,
        action: isSuspended ? "account_unsuspended" : "account_suspended",
        target_user_id: id,
        details: { suspended_at: nextSuspended },
      });

      toast(isSuspended ? "Compte réactivé" : "Compte suspendu", "warning");
      void loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!adminUser || !id) return;
    setBusy(true);
    try {
      if (companyData) {
        await supabase.from("companies").delete().eq("id", companyData.id);
      }
      await supabase.from("profiles").delete().eq("id", id);

      await supabase.from("audit_logs").insert({
        admin_id: adminUser.id,
        action: "rgpd_delete",
        target_user_id: id,
        details: { email: profileData?.email },
      });

      toast("Utilisateur supprimé (RGPD)", "success");
      navigate("/admin/users");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setBusy(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="3rem" />
        <Skeleton height="15rem" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-4">
        <p>Utilisateur non trouvé</p>
        <Link to="/admin/users" className="text-xs text-rose-400 underline font-bold">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/users"
            className="p-2 rounded-card bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{profileData.email}</span>
              {profileData.suspended_at && (
                <span className="text-xs px-2.5 py-0.5 rounded-pill bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  Suspendu
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">ID: {profileData.id}</p>
          </div>
        </div>

        {/* IMPERSONATION BUTTON */}
        <Button
          type="button"
          variant="primary"
          onClick={() => setImpersonateModalOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black text-xs py-2.5 px-4 shadow-xl"
        >
          <Eye className="w-4 h-4 mr-1.5 animate-pulse" />
          <span>Se connecter en tant que cet utilisateur</span>
        </Button>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-rose-400" /> Profil & Abonnement
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              Inscrit le {formatDateShort(profileData.created_at)}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Plan actuel :</span>
              <span className="font-mono font-black text-amber-400 uppercase">{profileData.plan}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Statut Admin :</span>
              <span className="font-bold">
                {profileData.admin_role === "super_admin"
                  ? "Super Admin"
                  : profileData.is_admin
                  ? "Admin"
                  : "Utilisateur standard"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Fin d'essai gratuit :</span>
              <span className="font-mono font-bold">
                {profileData.trial_ends_at ? formatDateShort(profileData.trial_ends_at) : "Aucun"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Stripe Customer ID :</span>
              <span className="font-mono text-slate-300">{profileData.stripe_customer_id || "Non lié"}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-card bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Modifier le plan
            </button>
            <button
              type="button"
              onClick={handleGiveTrial}
              disabled={busy}
              className="text-xs font-bold px-3 py-1.5 rounded-card bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors flex items-center gap-1"
            >
              <Gift className="w-3.5 h-3.5" /> Offrir Essai Pro 14j
            </button>
          </div>
        </Card>

        {/* Company Card */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-rose-400" /> Entreprise liée
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {companyData ? companyData.legal_name : "Aucune entreprise"}
            </span>
          </div>

          {companyData ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-400">SIRET :</span>
                <span className="font-mono font-bold text-white">{companyData.siret}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Activité :</span>
                <span className="font-bold text-white">{companyData.activity_type}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Régime TVA :</span>
                <span className="font-bold text-white">{companyData.vat_regime}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Chiffre d'affaires antérieur :</span>
                <span className="font-mono font-bold text-emerald-400">{companyData.previous_ca} €</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              L'utilisateur n'a pas encore complété la fiche entreprise.
            </p>
          )}
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="bg-rose-950/20 border-rose-900/60 p-6 space-y-4">
        <h3 className="font-extrabold text-rose-300 text-sm flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-500" /> Zone Administrateur Sensible
        </h3>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleToggleSuspend}
            loading={busy}
            className="border-rose-800/60 text-rose-300 hover:bg-rose-900/40 text-xs"
          >
            {profileData.suspended_at ? "Réactiver le compte" : "Suspendre le compte"}
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
            loading={busy}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Supprimer le compte (RGPD)
          </Button>
        </div>
      </Card>

      {/* IMPERSONATION CONFIRMATION MODAL */}
      <Modal
        open={impersonateModalOpen}
        onClose={() => setImpersonateModalOpen(false)}
        title="Confirmation d'impersonation"
      >
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <div className="p-3.5 rounded-card bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold space-y-1">
            <p className="font-bold">⚠️ Mode d'inspection de compte actif</p>
            <p>
              Vous allez accéder à l'application avec les données et le contexte de <strong>{profileData.email}</strong>.
            </p>
          </div>

          <ul className="space-y-2 list-disc list-inside text-slate-400 font-medium">
            <li>Cette action est enregistrée dans le journal d'audit administratif.</li>
            <li>La session expirera automatiquement au bout de <strong>30 minutes</strong>.</li>
            <li>Les actions destructrices (résiliation, suppression) sont bloquées par sécurité.</li>
          </ul>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setImpersonateModalOpen(false)}
              disabled={busy}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleStartImpersonation}
              loading={busy}
              className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold"
            >
              Confirmer & Accéder au compte
            </Button>
          </div>
        </div>
      </Modal>

      {/* PLAN OVERRIDE MODAL */}
      <Modal open={planModalOpen} onClose={() => setPlanModalOpen(false)} title="Modifier le plan abonnement">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Sélectionnez la formule à attribuer manuellement à <strong>{profileData.email}</strong> :
          </p>

          <div className="space-y-2">
            {(["starter", "solo", "pro"] as PlanType[]).map((plan) => (
              <label
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`flex items-center justify-between p-3.5 rounded-card border cursor-pointer transition-all text-xs font-bold ${
                  selectedPlan === plan
                    ? "bg-rose-950/60 border-rose-500 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="plan"
                    checked={selectedPlan === plan}
                    onChange={() => setSelectedPlan(plan)}
                    className="accent-rose-500"
                  />
                  <span className="uppercase">{plan}</span>
                </div>
                <span className="font-mono text-slate-400">
                  {plan === "starter" ? "0 €" : plan === "solo" ? "9 € / mois" : "19 € / mois"}
                </span>
              </label>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setPlanModalOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleUpdatePlan} loading={busy}>
              Appliquer le plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Supprimer définitivement le compte ?"
        message={`Cette action supprimera le profil de ${profileData.email} ainsi que ses données d'entreprise et factures conformément au RGPD.`}
        confirmLabel="Supprimer définitivement"
        danger
      />
    </div>
  );
}
