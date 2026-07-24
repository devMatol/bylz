import { useState, useEffect, useCallback, type FormEvent } from "react";
import { ShieldCheck, UserPlus, ShieldAlert, Crown, Trash2, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/database";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ConfirmModal } from "../../components/documents/ConfirmModal";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { formatDateShort } from "../../lib/date";
import { FactPulseModeToggle } from "../../components/admin/FactPulseModeToggle";
import { StripeModeToggle } from "../../components/admin/StripeModeToggle";

export function AdminAdminsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Add Admin modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  // Demote modal state
  const [demoteTarget, setDemoteTarget] = useState<Profile | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_admin", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins((data as Profile[]) || []);
    } catch (err) {
      console.error("Error fetching admins:", err);
      toast("Erreur lors du chargement des administrateurs", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchAdmins();
  }, [fetchAdmins]);

  const handleSearchUsers = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", `%${searchEmail.trim()}%`)
        .eq("is_admin", false)
        .limit(5);

      if (error) throw error;
      setSearchResults((data as Profile[]) || []);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors de la recherche", "danger");
    } finally {
      setSearching(false);
    }
  };

  const handlePromoteAdmin = async (targetUser: Profile) => {
    if (!currentUser) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: true, admin_role: "admin" })
        .eq("id", targetUser.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        admin_id: currentUser.id,
        action: "admin_promoted",
        target_user_id: targetUser.id,
        details: { new_role: "admin", target_email: targetUser.email },
      });

      toast(`${targetUser.email} est désormais administrateur`, "success");
      setAddModalOpen(false);
      setSearchEmail("");
      setSearchResults([]);
      void fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur de promotion", "danger");
    } finally {
      setBusy(false);
    }
  };

  const handleDemoteAdmin = async () => {
    if (!currentUser || !demoteTarget) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: false, admin_role: null })
        .eq("id", demoteTarget.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        admin_id: currentUser.id,
        action: "admin_demoted",
        target_user_id: demoteTarget.id,
        details: { previous_role: demoteTarget.admin_role, target_email: demoteTarget.email },
      });

      toast(`Droits admin retirés pour ${demoteTarget.email}`, "warning");
      setDemoteTarget(null);
      void fetchAdmins();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors du retrait", "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Super Admin FactPulse & Stripe Mode Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FactPulseModeToggle />
        <StripeModeToggle />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
            <span>Gestion des Administrateurs</span>
          </h1>
          <p className="text-xs text-slate-400">
            Gérez les privilèges et contrôlez les accès d'administration à l'application Bylz.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
        >
          Ajouter un administrateur
        </Button>
      </div>

      {loading ? (
        <Skeleton height="15rem" />
      ) : (
        <Card className="bg-slate-900 border-slate-800 p-0 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Administrateur</th>
                  <th className="p-4">Niveau de privilège</th>
                  <th className="p-4">Inscrit le</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <span>{adm.email}</span>
                        {adm.id === currentUser?.id && (
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                            (Vous)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {adm.admin_role === "super_admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-amber-500/20 text-amber-400 font-black border border-amber-500/40 text-xs">
                          <Crown className="w-3.5 h-3.5" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-xs">
                          <ShieldAlert className="w-3.5 h-3.5" /> Admin Standard
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {formatDateShort(adm.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      {adm.admin_role !== "super_admin" && adm.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => setDemoteTarget(adm)}
                          className="px-3 py-1.5 rounded-card bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Retirer l'accès
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ADD ADMIN MODAL */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Promouvoir un administrateur">
        <div className="space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            Recherchez un utilisateur membre par son adresse e-mail pour lui accorder les droits d'<strong>administrateur standard</strong>.
          </p>

          <form onSubmit={handleSearchUsers} className="flex gap-2">
            <input
              type="email"
              required
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500 font-medium"
            />
            <Button type="submit" variant="primary" loading={searching} leftIcon={<Search className="w-4 h-4" />}>
              Rechercher
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="font-bold text-slate-300 text-[11px] uppercase">Résultats :</p>
              {searchResults.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 rounded-card bg-slate-900 border border-slate-800"
                >
                  <div>
                    <p className="font-bold text-white">{res.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Plan: {res.plan}</p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={busy}
                    onClick={() => handlePromoteAdmin(res)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Nommer Admin
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* DEMOTE CONFIRM MODAL */}
      <ConfirmModal
        open={!!demoteTarget}
        onClose={() => setDemoteTarget(null)}
        onConfirm={handleDemoteAdmin}
        title="Retirer les droits administrateur ?"
        message={`Voulez-vous vraiment retirer les droits d'administration de ${demoteTarget?.email} ? L'utilisateur deviendra un membre standard.`}
        confirmLabel="Retirer les droits"
        danger
      />
    </div>
  );
}
