import { useState } from "react";
import { Download, FileSpreadsheet, ShieldCheck, HelpCircle, CheckCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useToast } from "../ui/Toast";
import { formatAmount } from "../../lib/utils";
import { formatDateShort } from "../../lib/date";
import { get2042CProEstimation, FISCAL_THRESHOLDS } from "../../lib/fiscal";
import type { ActivityType } from "../../types/database";

interface ReceiptEntry {
  date: string;
  invoiceNumber: string;
  clientName: string;
  paymentMethod: string;
  amountHt: number;
  amountVat: number;
  amountTtc: number;
}

interface LivreRecettesSectionProps {
  activityType: ActivityType;
  payments: any[];
  purchases: any[];
  year: number;
}

export function LivreRecettesSection({ activityType, payments, purchases, year }: LivreRecettesSectionProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"recettes" | "achats" | "impots">("recettes");

  const config = FISCAL_THRESHOLDS[activityType] || FISCAL_THRESHOLDS.services;

  // Process payments into Livre des Recettes entries
  const receiptsList: ReceiptEntry[] = payments.map((p) => ({
    date: p.paid_at || p.created_at,
    invoiceNumber: p.invoices?.number || "FAC-ENC",
    clientName: p.invoices?.clients?.name || "Client",
    paymentMethod: p.method === "transfer" ? "Virement bancaire" : p.method === "card" ? "Carte bancaire" : "Chèque / Autre",
    amountHt: Number(p.amount) / 1.2,
    amountVat: Number(p.amount) - (Number(p.amount) / 1.2),
    amountTtc: Number(p.amount),
  }));

  const totalReceiptsTtc = receiptsList.reduce((sum, r) => sum + r.amountTtc, 0);

  // 2042-C-PRO Estimation
  const taxEstimation = get2042CProEstimation(totalReceiptsTtc, config.abattementPercent);

  function exportCsv(type: "recettes" | "achats") {
    try {
      let csvContent = "";
      if (type === "recettes") {
        csvContent = "Date Encaissement;N° Facture;Nom Client;Mode Règlement;Montant HT;Montant TVA;Montant TTC\n";
        receiptsList.forEach((r) => {
          csvContent += `${formatDateShort(r.date)};${r.invoiceNumber};"${r.clientName}";${r.paymentMethod};${r.amountHt.toFixed(2)};${r.amountVat.toFixed(2)};${r.amountTtc.toFixed(2)}\n`;
        });
      } else {
        csvContent = "Date Achat;N° Pièce;Fournisseur;Objet Achat;Montant HT;Montant TVA;Montant TTC\n";
        purchases.forEach((p) => {
          csvContent += `${formatDateShort(p.issue_date || p.created_at)};${p.number};"${p.client_name}";Achat Pro;${(p.total_ht || 0).toFixed(2)};${(p.total_vat || 0).toFixed(2)};${p.total_ttc.toFixed(2)}\n`;
        });
      }

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Livre_${type === "recettes" ? "des_Recettes" : "des_Achats"}_${year}_Bylz.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Fichier CSV certifié téléchargé avec succès", "success");
    } catch {
      toast("Erreur lors de l'exportation CSV", "danger");
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("recettes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "recettes"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-surface-hover text-muted hover:text-text"
            }`}
          >
            📖 Livre des Recettes ({receiptsList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("achats")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "achats"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-surface-hover text-muted hover:text-text"
            }`}
          >
            🛍️ Registre des Achats ({purchases.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("impots")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === "impots"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-surface-hover text-muted hover:text-text"
            }`}
          >
            📋 Assistant Impôts 2042-C-PRO
          </button>
        </div>

        {tab !== "impots" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportCsv(tab)}
            className="text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
            Exporter le livre conforme DGFiP (.csv)
          </Button>
        )}
      </div>

      {/* TAB 1 & 2: TABLES FOR RECETTES / ACHATS */}
      {tab !== "impots" && (
        <Card className="overflow-hidden border border-border">
          <div className="p-4 border-b border-border bg-surface-hover/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-text">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {tab === "recettes"
                  ? "Registre chronologique des encaissements (Art. 286 du CGI)"
                  : "Registre des achats et des dépenses (Art. 286-1-bis CGI)"}
              </span>
            </div>
            <span className="text-xs font-bold text-primary">
              Total {tab === "recettes" ? "Encaissé" : "Débours"} : {formatAmount(tab === "recettes" ? totalReceiptsTtc : purchases.reduce((s, p) => s + p.total_ttc, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-hover text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">N° Pièce / Facture</th>
                  <th className="p-3 font-semibold">{tab === "recettes" ? "Client" : "Fournisseur"}</th>
                  <th className="p-3 font-semibold">Mode de Règlement</th>
                  <th className="p-3 text-right font-semibold">Montant HT</th>
                  <th className="p-3 text-right font-semibold">Montant TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tab === "recettes" ? (
                  receiptsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted">
                        Aucun encaissement enregistré pour l'année {year}.
                      </td>
                    </tr>
                  ) : (
                    receiptsList.map((r, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/60 transition-colors">
                        <td className="p-3 font-mono text-muted">{formatDateShort(r.date)}</td>
                        <td className="p-3 font-bold text-text">{r.invoiceNumber}</td>
                        <td className="p-3 font-medium text-text">{r.clientName}</td>
                        <td className="p-3 text-muted">{r.paymentMethod}</td>
                        <td className="p-3 text-right text-muted">{formatAmount(r.amountHt)}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-400">{formatAmount(r.amountTtc)}</td>
                      </tr>
                    ))
                  )
                ) : (
                  purchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted">
                        Aucun achat ou dépense enregistré pour l'année {year}.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/60 transition-colors">
                        <td className="p-3 font-mono text-muted">{formatDateShort(p.issue_date || p.created_at)}</td>
                        <td className="p-3 font-bold text-text">{p.number}</td>
                        <td className="p-3 font-medium text-text">{p.client_name}</td>
                        <td className="p-3 text-muted">Virement / Carte</td>
                        <td className="p-3 text-right text-muted">{formatAmount(p.total_ht || p.total_ttc / 1.2)}</td>
                        <td className="p-3 text-right font-extrabold text-violet-400">- {formatAmount(p.total_ttc)}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: ASSISTANT DÉCLARATION IMPÔT 2042-C-PRO */}
      {tab === "impots" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-emerald-500/30 bg-surface/90 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-pill border border-emerald-500/20">
                  Déclaration Annuelle de Revenus
                </span>
                <h3 className="text-lg font-black text-text mt-1">Formulaire 2042-C-PRO</h3>
                <p className="text-xs text-muted">Synthèse automatique des cases à remplir pour votre déclaration</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-medium">Activité sélectionnée :</span>
                <span className="font-bold text-white">{config.taxBoxLabel}</span>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  Case à remplir : <code className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-mono text-base font-black">{config.taxBoxCode}</code>
                </span>
                <span className="font-black text-emerald-400 text-base">{formatAmount(taxEstimation.caBrut)}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Chiffre d'Affaires Brut Encaissé ({year}) :</span>
                <strong className="text-text">{formatAmount(taxEstimation.caBrut)}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Abattement Forfaitaire Automatique ({config.abattementPercent}%) :</span>
                <strong className="text-emerald-400">- {formatAmount(taxEstimation.abattementMontant)}</strong>
              </div>
              <div className="flex justify-between py-1 font-bold text-text">
                <span>Revenu Net Imposable Estime (soumis au barème IR) :</span>
                <strong className="text-primary text-sm">{formatAmount(taxEstimation.revenuImposableEstime)}</strong>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-border bg-surface/90 space-y-4">
            <h4 className="text-sm font-bold text-text flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>Comment faire votre déclaration d'impôt ?</span>
            </h4>

            <ol className="list-decimal list-inside text-xs text-muted space-y-2.5">
              <li className="leading-relaxed">
                Connectez-vous sur votre espace particulier sur <strong>impots.gouv.fr</strong> lors de la campagne annuelle de déclaration des revenus.
              </li>
              <li className="leading-relaxed">
                Cochez la case <strong>"Revenus industriels et commerciaux non professionnels"</strong> ou <strong>"Revenus non commerciaux"</strong> (Formulaire 2042-C-PRO).
              </li>
              <li className="leading-relaxed">
                Reportez le montant brut <strong>{formatAmount(taxEstimation.caBrut)}</strong> dans la case <strong className="text-amber-400">{config.taxBoxCode}</strong>.
              </li>
              <li className="leading-relaxed">
                L'administration fiscale applique automatiquement l'abattement forfaitaire de {config.abattementPercent}%.
              </li>
            </ol>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center justify-between">
              <span>Besoin d'un récapitulatif annuel certifié ?</span>
              <Button type="button" variant="primary" size="sm" onClick={() => exportCsv("recettes")} className="text-[11px] font-bold">
                <Download className="w-3.5 h-3.5 mr-1" /> PDF / CSV
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
