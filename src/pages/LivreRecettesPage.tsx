import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { PageContainer } from "../components/layout/PageContainer";
import { Skeleton } from "../components/ui/Skeleton";
import { supabase } from "../lib/supabase";
import { LivreRecettesSection } from "../components/fiscal/LivreRecettesSection";
import { UpgradeModal } from "../components/shared/UpgradeModal";
import type { Payment } from "../types/database";

export function LivreRecettesPage() {
  const { company, profile } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      // 1. Fetch invoices
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, number, type, status, ereporting_status, pa_status, facturx_pdf_url, total_ht, total_vat, total_ttc, paid_at, issue_date, created_at, clients(name)")
        .eq("company_id", company.id);
      
      if (error) throw error;

      const eligibleInvoices = invoices || [];
      const invoiceIds = eligibleInvoices.map((i: any) => i.id);
      
      let pmtList: Payment[] = [];
      if (invoiceIds.length > 0) {
        const { data: pmt, error: pErr } = await supabase
          .from("payments")
          .select("*, invoices:invoices(number, clients(name))")
          .in("invoice_id", invoiceIds);
        if (pErr) throw pErr;
        pmtList = (pmt || []) as any[];
      }

      const purchaseList = eligibleInvoices.filter(
        (i: any) => i.type === "purchase" || i.pa_status === "received"
      );

      setPayments(pmtList);
      setPurchases(purchaseList);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur de chargement du livre des recettes",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  }, [company, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!company) return null;

  return (
    <PageContainer
      title="Livre des recettes & Achats"
      subtitle="Vos journaux comptables obligatoires et préparation fiscale"
    >
      {loading ? (
        <Skeleton height="20rem" />
      ) : (
        <LivreRecettesSection
          activityType={company.activity_type}
          payments={payments}
          purchases={purchases}
          year={new Date().getFullYear()}
          isPro={profile?.plan === "pro"}
          onUpgradeClick={() => setUpgradeModalOpen(true)}
        />
      )}

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature="paymentLinks" // links to Pro features
      />
    </PageContainer>
  );
}

export default LivreRecettesPage;
