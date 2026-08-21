import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  RefreshCw,
  Link2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Check,
  XCircle,
  Search,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { formatAmount } from "../../lib/utils";
import { formatDateShort } from "../../lib/date";
import { canUseFeature } from "../../lib/planLimits";
import { UpgradeModal } from "../shared/UpgradeModal";
import {
  fetchBankConnections,
  fetchBankTransactions,
  createBridgeConnectSession,
  createGoCardlessConnectSession,
  triggerBankSync,
  manualMatchBankTransaction,
  ignoreBankTransaction,
  undoBankMatch,
  disconnectBankConnection,
  fetchInvoices,
} from "../../lib/api";
import type { BankConnection, BankTransaction, Invoice } from "../../types/database";

export function BankSyncSection() {
  const { profile, company } = useAuth();
  const { toast } = useToast();

  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [transactions, setTransactions] = useState<Array<BankTransaction & { matched_invoice_number?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Manual Match Modal State
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [matchingBusy, setMatchingBusy] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showAutoMatched, setShowAutoMatched] = useState(false);

  const canUseBankSync = canUseFeature(profile?.plan, "paymentLinks"); // Pro plan feature

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [conns, txData] = await Promise.all([
        fetchBankConnections(company.id),
        fetchBankTransactions(company.id),
      ]);
      setConnections(conns);
      setTransactions(txData.transactions);
    } catch (err: any) {
      console.warn("Error loading bank sync data:", err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleConnectBank = async () => {
    if (!canUseBankSync) {
      setUpgradeModalOpen(true);
      return;
    }
    setConnecting(true);
    try {
      const url = await createBridgeConnectSession();
      if (url.includes("mock_bank=")) {
        toast("Compte bancaire pro connecté avec succès (Bridge API Open Banking) !", "success");
        void loadData();
      } else {
        window.location.href = url;
      }
    } catch (err: any) {
      toast(err.message || "Erreur lors de la connexion à la banque.", "danger");
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectBridgeAlternative = async () => {
    if (!canUseBankSync) {
      setUpgradeModalOpen(true);
      return;
    }
    setConnecting(true);
    try {
      const url = await createBridgeConnectSession();
      if (url.includes("mock_bank=")) {
        toast("Compte bancaire connecté avec succès (Mode Alternative Bridge) !", "success");
        void loadData();
      } else {
        window.location.href = url;
      }
    } catch (err: any) {
      toast(err.message || "Erreur lors de la connexion via Bridge API.", "danger");
    } finally {
      setConnecting(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!company) return;
    setSyncing(true);
    try {
      const res = await triggerBankSync(company.id);
      toast(
        `Synchronisation terminée : ${res.totalSyncedTransactions} transaction(s) analysée(s), ${res.autoMatchedCount} facture(s) rapprochée(s) !`,
        "success"
      );
      void loadData();
    } catch (err: any) {
      toast(err.message || "Erreur de synchronisation", "danger");
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenManualMatch = async (tx: BankTransaction) => {
    if (!company) return;
    setSelectedTx(tx);
    setMatchModalOpen(true);
    try {
      const invs = await fetchInvoices(company.id, "pending");
      setPendingInvoices(invs);
    } catch (err: any) {
      toast(err.message || "Erreur lors de la récupération des factures", "danger");
    }
  };

  const handleConfirmManualMatch = async (invoiceId: string) => {
    if (!company || !selectedTx) return;
    setMatchingBusy(true);
    try {
      await manualMatchBankTransaction(company.id, selectedTx.id, invoiceId);
      toast("Facture rapprochée manuellement avec succès !", "success");
      setMatchModalOpen(false);
      setSelectedTx(null);
      void loadData();
    } catch (err: any) {
      toast(err.message || "Erreur de rapprochement", "danger");
    } finally {
      setMatchingBusy(false);
    }
  };

  const handleIgnoreTx = async (txId: string) => {
    try {
      await ignoreBankTransaction(txId);
      toast("Transaction ignorée", "info");
      void loadData();
    } catch (err: any) {
      toast(err.message || "Erreur", "danger");
    }
  };

  const handleUndoMatch = async (txId: string) => {
    try {
      await undoBankMatch(txId);
      toast("Rapprochement annulé. La facture repasse en attente.", "success");
      void loadData();
    } catch (err: any) {
      toast(err.message || "Erreur lors de l'annulation", "danger");
    }
  };

  const handleDisconnect = async (connId: string) => {
    if (!company) return;
    try {
      await disconnectBankConnection(company.id, connId);
      toast("Compte bancaire déconnecté.", "success");
      void loadData();
    } catch (err: any) {
      toast(err.message || "Erreur de déconnexion", "danger");
    }
  };

  const unmatchedTransactions = transactions.filter((t) => t.match_status === "unmatched");
  const matchedTransactions = transactions.filter(
    (t) => t.match_status === "auto_matched" || t.match_status === "manual_matched"
  );

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-black text-text tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Rapprochement Bancaire Automatique (Open Banking DSP2)</span>
          </h3>
          <p className="text-xs text-muted mt-1">
            Connectez votre compte professionnel pour que vos factures soient automatiquement marquées payées dès la réception du virement (technologie certifiée Bridge API).
          </p>
        </div>

        {connections.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTriggerSync}
            loading={syncing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Synchroniser maintenant
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConnectBank}
            loading={connecting}
            className="bylz-glow-cta text-xs font-bold whitespace-nowrap"
          >
            Connecter ma banque
          </Button>
        )}
      </div>

      {/* Visual Workflow Steps & Security Guarantee */}
      <div className="p-4 rounded-card bg-surface-hover/40 border border-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-surface border border-border flex flex-col items-center">
            <span className="text-xs font-bold text-muted uppercase">1. Émission</span>
            <p className="text-xs font-bold text-text mt-1">Facture envoyée au client</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border flex flex-col items-center">
            <span className="text-xs font-bold text-muted uppercase">2. Virement bancaire</span>
            <p className="text-xs font-bold text-text mt-1">Détection auto via Bridge API</p>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border flex flex-col items-center">
            <span className="text-xs font-bold text-emerald-500 uppercase">3. Payée</span>
            <p className="text-xs font-bold text-text mt-1">Rapprochement sans effort</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>
            <strong>Sécurité 100% garantie :</strong> Vos identifiants bancaires ne transitent jamais par Bylz. La connexion est chiffrée via la technologie certifiée Bridge API (Bankin' / Régulation ACPR & Banque de France).
          </span>
        </div>
      </div>

      {/* Pro Plan Tease Banner if not Pro */}
      {!canUseBankSync && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-text">Fonctionnalité exclusive au Plan PRO</p>
              <p className="text-xs text-muted">
                Passez au Plan Pro pour débloquer la synchronisation bancaire automatique et les paiements Stripe.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setUpgradeModalOpen(true)}
            className="text-xs font-bold whitespace-nowrap"
          >
            Débloquer avec le Plan Pro
          </Button>
        </div>
      )}

      {/* Connected Bank Accounts */}
      {connections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
            Comptes Bancaires Connectés ({connections.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {connections.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-card border border-border bg-surface flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    🏛️
                  </div>
                  <div>
                    <p className="font-bold text-sm text-text">{c.bank_name}</p>
                    <p className="text-[11px] text-muted">
                      Synchro : {c.last_synced_at ? formatDateShort(c.last_synced_at) : "À l'instant"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Actif
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDisconnect(c.id)}
                    className="text-xs text-muted hover:text-danger font-medium transition-colors"
                  >
                    Déconnecter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched Transactions Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
            Transactions à rapprocher ({unmatchedTransactions.length})
          </h4>
          {matchedTransactions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAutoMatched(!showAutoMatched)}
              className="text-xs text-primary hover:underline font-bold"
            >
              {showAutoMatched ? "Masquer les factures rapprochées" : `Voir les rapprochées (${matchedTransactions.length})`}
            </button>
          )}
        </div>

        {unmatchedTransactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted bg-surface-hover/20 rounded-card border border-border">
            Toutes vos transactions de virement ont été rapprochées !
          </div>
        ) : (
          <div className="space-y-2">
            {unmatchedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-card border border-border bg-surface hover:bg-surface-hover/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-400">
                      + {formatAmount(tx.amount)}
                    </span>
                    <span className="text-xs text-muted">
                      • {formatDateShort(tx.transaction_date)}
                    </span>
                  </div>
                  <p className="text-xs text-text font-medium truncate">{tx.label}</p>
                  {tx.counterparty_name && (
                    <p className="text-[11px] text-muted truncate">Émetteur : {tx.counterparty_name}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenManualMatch(tx)}
                    className="text-xs font-bold"
                  >
                    <Link2 className="w-3.5 h-3.5 mr-1" /> Rapprocher
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleIgnoreTx(tx.id)}
                    className="text-xs text-muted hover:text-text px-2 py-1 font-medium transition-colors"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Matched History Section */}
      {showAutoMatched && matchedTransactions.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
            Rapprochements Récents (7 Derniers Jours)
          </h4>
          <div className="space-y-2">
            {matchedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-card border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-text">
                      {tx.matched_invoice_number ? `Facture ${tx.matched_invoice_number}` : "Facture"}
                    </span>
                    <span className="text-muted ml-2">
                      ({formatAmount(tx.amount)} le {formatDateShort(tx.transaction_date)})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUndoMatch(tx.id)}
                  className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Annuler
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Matching Modal */}
      <Modal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        className="max-w-lg p-6 space-y-4"
      >
        <h3 className="text-lg font-extrabold text-text">
          Rapprocher la transaction
        </h3>

        {selectedTx && (
          <div className="p-3 rounded-card bg-surface-hover/50 border border-border text-xs space-y-1">
            <p className="font-extrabold text-emerald-400 text-sm">
              + {formatAmount(selectedTx.amount)}
            </p>
            <p className="text-text font-medium">{selectedTx.label}</p>
            <p className="text-muted">Date : {formatDateShort(selectedTx.transaction_date)}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-muted uppercase">
            Sélectionnez la facture correspondante :
          </label>

          {pendingInvoices.length === 0 ? (
            <p className="text-xs text-muted py-4">Aucune facture en attente disponible.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pendingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => handleConfirmManualMatch(inv.id)}
                  className="p-3 rounded-card border border-border hover:border-primary bg-surface hover:bg-primary/5 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-text">{inv.number}</p>
                    <p className="text-[11px] text-muted">Échéance : {formatDateShort(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-text">{formatAmount(inv.total_ttc)}</p>
                    <span className="text-[10px] font-bold text-primary">Associer ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="paymentLinks"
      />
    </Card>
  );
}
