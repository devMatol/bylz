import { useState, useEffect, useCallback } from "react";
import { FileText, ChevronDown, ChevronRight, Shield, User, Clock, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { AuditLog } from "../../types/database";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDateShort } from "../../lib/date";

interface EnrichedAuditLog extends AuditLog {
  admin_email?: string;
  target_email?: string;
}

export function AdminLogsPage() {
  const [logs, setLogs] = useState<EnrichedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rawLogs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const logList = (rawLogs as AuditLog[]) || [];

      // Collect all admin_ids and target_user_ids
      const uids = Array.from(
        new Set(
          logList
            .flatMap((l) => [l.admin_id, l.target_user_id])
            .filter((id): id is string => Boolean(id))
        )
      );

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", uids);

      const userMap: Record<string, string> = {};
      if (profs) {
        for (const p of profs) {
          userMap[p.id] = p.email;
        }
      }

      const enriched: EnrichedAuditLog[] = logList.map((l) => ({
        ...l,
        admin_email: userMap[l.admin_id] || l.admin_id,
        target_email: l.target_user_id ? userMap[l.target_user_id] || l.target_user_id : "N/A",
      }));

      setLogs(enriched);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (actionFilter === "all") return true;
    return l.action === actionFilter;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-400" />
            <span>Journal d'Audit Administratif</span>
          </h1>
          <p className="text-xs text-slate-400">
            Historique inaltérable en lecture seule de toutes les actions d'administration et d'impersonation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-card px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
          >
            <option value="all">Toutes les actions</option>
            <option value="impersonation_start">Début Impersonation</option>
            <option value="impersonation_end">Fin Impersonation</option>
            <option value="plan_override">Modification de Plan</option>
            <option value="trial_gift">Cadeau Essai Pro</option>
            <option value="admin_promoted">Promotion Admin</option>
            <option value="admin_demoted">Rétrogradation Admin</option>
            <option value="account_suspended">Suspension de Compte</option>
            <option value="rgpd_delete">Suppression RGPD</option>
            <option value="offer_updated">Mise à jour Offre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Skeleton height="18rem" />
      ) : (
        <Card className="bg-slate-900 border-slate-800 p-0 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Administrateur</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Cible</th>
                  <th className="p-4">Date & Heure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Aucun événement d'audit enregistré
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => {
                    const isExpanded = expandedId === l.id;
                    return (
                      <tr key={l.id} className="contents">
                        <tr
                          onClick={() => toggleExpand(l.id)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="p-4 text-slate-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-rose-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                          </td>
                          <td className="p-4 font-bold text-white">
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-rose-400" />
                              {l.admin_email}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-pill bg-slate-800 text-rose-300 font-mono font-bold text-[11px] border border-slate-700">
                              {l.action}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-300">
                            {l.target_email}
                          </td>
                          <td className="p-4 font-mono text-slate-400">
                            {formatDateShort(l.created_at)}
                          </td>
                        </tr>

                        {/* Expandable JSON details row */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={5} className="p-4 pl-12 border-t border-slate-800/60">
                              <p className="text-[11px] font-bold text-slate-400 mb-2">Détails bruts (JSON) :</p>
                              <pre className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
                                {JSON.stringify(l.details || {}, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
