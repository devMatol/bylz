import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Shield, Eye, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { Profile } from "../../types/database";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDateShort } from "../../lib/date";

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, profile, realProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const activeProfile = realProfile || profile;

  const getFallbackUser = useCallback((): Profile => {
    if (activeProfile) return activeProfile;
    return {
      id: user?.id || "admin-fallback",
      email: user?.email || "matthiasollivier123@gmail.com",
      plan: "pro",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      trial_ends_at: null,
      trial_used: false,
      accountant_email: null,
      tmi: null,
      is_admin: true,
      admin_role: "super_admin",
      suspended_at: null,
      created_at: new Date().toISOString(),
    };
  }, [user, activeProfile]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase profiles query error:", error);
        setErrorNotice(error.message);
        setUsers([getFallbackUser()]);
      } else {
        const fetchedList = (data as Profile[]) || [];
        // Ensure active user is always included if list is empty or doesn't contain current user
        if (fetchedList.length === 0) {
          setUsers([getFallbackUser()]);
          setErrorNotice("La politique RLS Supabase limite la lecture des profils. Exécutez le script SQL ci-dessous dans votre SQL Editor pour débloquer la totalité des utilisateurs inscrits.");
        } else {
          setUsers(fetchedList);
        }
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setErrorNotice(err instanceof Error ? err.message : "Erreur lors du chargement des utilisateurs");
      setUsers([getFallbackUser()]);
    } finally {
      setLoading(false);
    }
  }, [getFallbackUser]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const rawUser = u as unknown as { email?: string; full_name?: string };
    const emailMatch = rawUser.email ? rawUser.email.toLowerCase().includes(search.toLowerCase()) : false;
    const nameMatch = rawUser.full_name ? rawUser.full_name.toLowerCase().includes(search.toLowerCase()) : false;
    const matchesSearch = search === "" || emailMatch || nameMatch;
    const matchesPlan = planFilter === "all" || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Gestion des Utilisateurs</span>
            <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-pill bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {filteredUsers.length} affiché(s)
            </span>
          </h1>
          <p className="text-xs text-slate-400">Consultez, gérez et assistez les utilisateurs inscrits sur Bylz</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par email..."
              className="w-full bg-slate-900 border border-slate-800 rounded-card pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-card px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
          >
            <option value="all">Tous les plans</option>
            <option value="starter">Starter</option>
            <option value="solo">Solo</option>
            <option value="pro">Pro</option>
          </select>

          <button
            type="button"
            onClick={() => void loadUsers()}
            className="p-2 rounded-card bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            title="Rafraîchir la liste"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RLS Policy Notice if restricted */}
      {errorNotice && (
        <div className="p-4 rounded-card bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white text-sm">Action requise : Débloquer l'accès RLS Supabase</p>
            <p className="mt-1 leading-relaxed">
              Supabase applique la politique RLS par défaut et bloque la lecture des autres utilisateurs.
              Exécutez cette commande dans le <strong>SQL Editor</strong> Supabase pour afficher 100% des comptes inscrits :
            </p>
            <pre className="mt-2 p-2.5 rounded bg-slate-950 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
              {`CREATE POLICY "Admins read profiles" ON profiles FOR SELECT USING (true);`}
            </pre>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <Skeleton height="15rem" />
      ) : (
        <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Plan Actuel</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Inscrit le</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucun utilisateur ne correspond à votre recherche
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span>{u.email}</span>
                            {u.suspended_at && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                                Suspendu
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span
                          className={`px-2.5 py-1 rounded-pill text-[11px] uppercase ${
                            u.plan === "pro"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : u.plan === "solo"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.admin_role === "super_admin" || u.email === "matthiasollivier123@gmail.com" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/40">
                            <Shield className="w-3 h-3 text-amber-400" /> Super Admin
                          </span>
                        ) : u.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                            Admin
                          </span>
                        ) : (
                          <span className="text-slate-500">Membre</span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.suspended_at ? (
                          <span className="text-rose-400 font-bold">Compte Bloqué</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Actif</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono">
                        {formatDateShort(u.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-card bg-slate-800 hover:bg-rose-900/40 text-slate-200 hover:text-white border border-slate-700 transition-colors font-bold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-rose-400" />
                          <span>Détails & Actions</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
