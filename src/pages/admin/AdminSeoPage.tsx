import { useState, useEffect, useCallback } from "react";
import { Search, MousePointer, Eye, TrendingUp, Key, ArrowUpRight, HelpCircle, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";

interface GscMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
  dailyTrends: { date: string; clicks: number; impressions: number }[];
}

export function AdminSeoPage() {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [data, setData] = useState<GscMetrics | null>(null);

  const fetchSeoData = useCallback(async () => {
    setLoading(true);
    try {
      // Check admin_metrics_cache for type 'gsc'
      const { data: cacheRow } = await supabase
        .from("admin_metrics_cache")
        .select("*")
        .eq("cache_key", "gsc_30d_metrics")
        .maybeSingle();

      if (cacheRow && cacheRow.data && (cacheRow.data as unknown as GscMetrics).clicks !== undefined) {
        setIsConnected(true);
        setData(cacheRow.data as unknown as GscMetrics);
      } else {
        // Not connected or no cache yet
        setIsConnected(false);
      }
    } catch (err) {
      console.error("Error fetching SEO metrics:", err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSeoData();
  }, [fetchSeoData]);

  // Demo toggle to test GSC view if user wants to see dashboard presentation
  const handleSimulateConnection = () => {
    const demoData: GscMetrics = {
      clicks: 1420,
      impressions: 28400,
      ctr: 5.0,
      position: 8.4,
      topQueries: [
        { query: "factur-x auto entrepreneur 2026", clicks: 320, impressions: 4500, ctr: 7.1, position: 2.1 },
        { query: "simulateur cotisations urssaf bnc", clicks: 280, impressions: 3800, ctr: 7.3, position: 1.8 },
        { query: "seuil de franchise tva 39100", clicks: 210, impressions: 3100, ctr: 6.7, position: 3.4 },
        { query: "logiciel facturation micro entreprise gratuit", clicks: 190, impressions: 4200, ctr: 4.5, position: 4.2 },
        { query: "bylz facturation", clicks: 150, impressions: 1600, ctr: 9.3, position: 1.0 },
      ],
      topPages: [
        { page: "https://bylz.fr/outils/simulateur-urssaf", clicks: 450, impressions: 8200 },
        { page: "https://bylz.fr/outils/simulateur-seuil-tva", clicks: 380, impressions: 7100 },
        { page: "https://bylz.fr/blog/reforme-factur-x-2026-auto-entrepreneurs", clicks: 290, impressions: 5400 },
        { page: "https://bylz.fr/", clicks: 210, impressions: 4200 },
      ],
      dailyTrends: Array.from({ length: 14 }).map((_, i) => ({
        date: `2026-07-${(i + 10).toString().padStart(2, "0")}`,
        clicks: Math.round(80 + Math.random() * 40),
        impressions: Math.round(1500 + Math.random() * 800),
      })),
    };
    setIsConnected(true);
    setData(demoData);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-rose-400" />
            <span>Métriques SEO & Google Search Console</span>
          </h1>
          <p className="text-xs text-slate-400">
            Suivi des clics, impressions, CTR et mots-clés positionnés sur Google (bylz.fr)
          </p>
        </div>

        {isConnected && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchSeoData()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="border-slate-800 text-slate-200 hover:bg-slate-900 text-xs font-bold"
          >
            Actualiser GSC
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton height="18rem" />
      ) : !isConnected ? (
        /* Setup Guide Card when GSC credentials are not yet configured */
        <Card className="bg-slate-900 border-slate-800 p-8 space-y-6 shadow-2xl">
          <div className="flex items-center space-x-3 text-rose-400">
            <Key className="w-6 h-6" />
            <h3 className="text-lg font-black text-white">Connecter Google Search Console (GSC)</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Pour afficher les vraies métriques de trafic Google sur <strong>bylz.fr</strong>, associez votre compte de service GCP à l'API Search Console :
          </p>

          <div className="space-y-4 text-xs font-medium border-t border-b border-slate-800 py-4">
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <div>
                <p className="font-bold text-white">Créer un compte de service GCP</p>
                <p className="text-slate-400">
                  Rendez-vous dans la console Google Cloud, activez l'API Search Console et téléchargez les clés JSON du Service Account.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <div>
                <p className="font-bold text-white">Partager l'accès au domaine bylz.fr</p>
                <p className="text-slate-400">
                  Dans la Search Console de <strong>bylz.fr</strong>, ajoutez l'e-mail du Service Account avec les droits de "Propriétaire" ou "Utilisateur".
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <div>
                <p className="font-bold text-white">Ajouter la clé dans les secrets Supabase</p>
                <p className="text-slate-400">
                  Enregistrez le JSON de la clé sous la variable d'environnement <code className="text-rose-300 font-mono">GSC_SERVICE_ACCOUNT</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">Aucune donnée simulée ou faussée par défaut.</span>
            <Button
              type="button"
              variant="outline"
              onClick={handleSimulateConnection}
              className="text-xs font-bold border-rose-800/60 text-rose-300 hover:bg-rose-950/40"
            >
              Prévisualiser la maquette SEO
            </Button>
          </div>
        </Card>
      ) : data ? (
        /* Active GSC Metrics View */
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-card bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-rose-400" /> Clics Totaux (30j)
              </p>
              <p className="text-2xl font-black text-white font-mono">{data.clicks.toLocaleString("fr-FR")}</p>
            </div>

            <div className="p-4 rounded-card bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Impressions (30j)
              </p>
              <p className="text-2xl font-black text-white font-mono">{data.impressions.toLocaleString("fr-FR")}</p>
            </div>

            <div className="p-4 rounded-card bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> CTR Moyen
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{data.ctr}%</p>
            </div>

            <div className="p-4 rounded-card bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-400" /> Position Moyenne
              </p>
              <p className="text-2xl font-black text-sky-400 font-mono">{data.position}</p>
            </div>
          </div>

          {/* Top Queries Table */}
          <Card className="bg-slate-900 border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-white text-sm">Top 10 des Requêtes Google les plus performantes</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="p-3">Mot-Clé / Requête</th>
                    <th className="p-3 text-right">Clics</th>
                    <th className="p-3 text-right">Impressions</th>
                    <th className="p-3 text-right">CTR</th>
                    <th className="p-3 text-right">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.topQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{q.query}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">{q.clicks}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{q.impressions}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{q.ctr}%</td>
                      <td className="p-3 text-right font-mono font-bold text-sky-400">#{q.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top Pages Table */}
          <Card className="bg-slate-900 border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-white text-sm">Top Pages d'atterrissage SEO</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="p-3">Page / URL</th>
                    <th className="p-3 text-right">Clics</th>
                    <th className="p-3 text-right">Impressions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.topPages.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-rose-300 underline font-semibold truncate max-w-sm">
                        <a href={p.page} target="_blank" rel="noreferrer">
                          {p.page}
                        </a>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">{p.clicks}</td>
                      <td className="p-3 text-right font-mono text-slate-400">{p.impressions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
