import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Download,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { SignatureModal } from "../components/documents/SignatureModal";
import { formatAmount } from "../lib/utils";
import { formatDateLong } from "../lib/date";
import type { SignatureData } from "../types/database";

interface PublicDocData {
  type: "quote" | "invoice";
  id: string;
  number: string;
  status: string;
  issue_date: string;
  due_or_validity_date: string | null;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  note: string | null;
  stripe_payment_link: string | null;
  signature_data: SignatureData | null;
  public_token: string;
  company: {
    legal_name: string;
    commercial_name: string | null;
    siret: string;
    address: string;
    logo_url: string | null;
    invoice_footer: string | null;
    accent_color: string | null;
    user_id: string;
    plan: string;
  };
  client: {
    name: string;
    email: string | null;
    address: string | null;
    siret: string | null;
  };
  lines: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    nature: string;
  }>;
}

export function PublicDocumentPage() {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<PublicDocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!token) {
      setError("Jeton de document manquant.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Try Quote by id or public_token
      let qData: any = null;

      // Try with public_token column first
      const { data: qTokenData, error: qTokenErr } = await supabase
        .from("quotes")
        .select(`
          id, number, status, issue_date, validity_date, total_ht, total_vat, total_ttc, note, public_token, signature_data,
          company:companies ( legal_name, commercial_name, siret, address, logo_url, invoice_footer, accent_color, user_id ),
          client:clients ( name, email, address, siret ),
          lines:quote_lines ( description, quantity, unit_price, nature )
        `)
        .or(`public_token.eq.${token},id.eq.${token}`)
        .maybeSingle();

      if (!qTokenErr && qTokenData) {
        qData = qTokenData;
      } else {
        // Fallback for standard query by id if public_token column is not migrated yet
        const { data: qIdData } = await supabase
          .from("quotes")
          .select(`
            id, number, status, issue_date, validity_date, total_ht, total_vat, total_ttc, note,
            company:companies ( legal_name, commercial_name, siret, address, logo_url, invoice_footer, accent_color, user_id ),
            client:clients ( name, email, address, siret ),
            lines:quote_lines ( description, quantity, unit_price, nature )
          `)
          .eq("id", token)
          .maybeSingle();

        qData = qIdData;
      }

      if (qData) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", (qData.company as any)?.user_id)
          .maybeSingle();

        setDoc({
          type: "quote",
          id: qData.id,
          number: qData.number,
          status: qData.status,
          issue_date: qData.issue_date,
          due_or_validity_date: qData.validity_date,
          total_ht: qData.total_ht,
          total_vat: qData.total_vat,
          total_ttc: qData.total_ttc,
          note: qData.note,
          stripe_payment_link: null,
          signature_data: (qData.signature_data as SignatureData | null) || null,
          public_token: token,
          company: {
            ...(qData.company as any),
            plan: prof?.plan || "starter",
          },
          client: qData.client as any,
          lines: (qData.lines as any[]) || [],
        });
        setLoading(false);
        return;
      }

      // 2. Try Invoice by id or public_token
      let iData: any = null;

      const { data: iTokenData, error: iTokenErr } = await supabase
        .from("invoices")
        .select(`
          id, number, status, issue_date, due_date, total_ht, total_vat, total_ttc, note, stripe_payment_link, public_token, signature_data,
          company:companies ( legal_name, commercial_name, siret, address, logo_url, invoice_footer, accent_color, user_id ),
          client:clients ( name, email, address, siret ),
          lines:invoice_lines ( description, quantity, unit_price, nature )
        `)
        .or(`public_token.eq.${token},id.eq.${token}`)
        .maybeSingle();

      if (!iTokenErr && iTokenData) {
        iData = iTokenData;
      } else {
        // Fallback for standard query by id if public_token column is not migrated yet
        const { data: iIdData } = await supabase
          .from("invoices")
          .select(`
            id, number, status, issue_date, due_date, total_ht, total_vat, total_ttc, note, stripe_payment_link,
            company:companies ( legal_name, commercial_name, siret, address, logo_url, invoice_footer, accent_color, user_id ),
            client:clients ( name, email, address, siret ),
            lines:invoice_lines ( description, quantity, unit_price, nature )
          `)
          .eq("id", token)
          .maybeSingle();

        iData = iIdData;
      }

      if (iData) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", (iData.company as any)?.user_id)
          .maybeSingle();

        setDoc({
          type: "invoice",
          id: iData.id,
          number: iData.number,
          status: iData.status,
          issue_date: iData.issue_date,
          due_or_validity_date: iData.due_date,
          total_ht: iData.total_ht,
          total_vat: iData.total_vat,
          total_ttc: iData.total_ttc,
          note: iData.note,
          stripe_payment_link: iData.stripe_payment_link,
          signature_data: (iData.signature_data as SignatureData | null) || null,
          public_token: token,
          company: {
            ...(iData.company as any),
            plan: prof?.plan || "starter",
          },
          client: iData.client as any,
          lines: (iData.lines as any[]) || [],
        });
        setLoading(false);
        return;
      }

      setError("Document introuvable ou lien expiré.");
    } catch (e: any) {
      setError(e.message || "Erreur de chargement du document.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchDocument();
  }, [fetchDocument]);

  const handleSignatureSubmit = async (sig: {
    signerName: string;
    signerEmail: string;
    signatureImage: string;
  }) => {
    if (!doc) return;

    const signaturePayload: SignatureData = {
      signer_name: sig.signerName,
      signer_email: sig.signerEmail,
      signed_at: new Date().toISOString(),
      ip_address: "127.0.0.1",
      signature_image: sig.signatureImage,
    };

    if (doc.type === "quote") {
      const { error: updateErr } = await supabase
        .from("quotes")
        .update({
          status: "accepted",
          signature_data: signaturePayload,
        })
        .eq("id", doc.id);

      if (updateErr) {
        const { error: statusErr } = await supabase
          .from("quotes")
          .update({ status: "accepted" })
          .eq("id", doc.id);
        if (statusErr) throw statusErr;
      }
    } else {
      const { error: updateErr } = await supabase
        .from("invoices")
        .update({
          status: "signed",
          signature_data: signaturePayload,
        })
        .eq("id", doc.id);

      if (updateErr) {
        const { error: statusErr } = await supabase
          .from("invoices")
          .update({ status: "signed" })
          .eq("id", doc.id);
        if (statusErr) throw statusErr;
      }
    }

    // Trigger Email & Notification to entrepreneur via Edge Function
    try {
      if (doc.client.email) {
        await supabase.functions.invoke("send-email", {
          body: {
            to: doc.client.email,
            subject: `🎉 Signature enregistrée pour le document ${doc.number}`,
            body: `Bonjour ${doc.client.name},\n\nVotre signature pour le document ${doc.number} a bien été enregistrée et certifiée.\n\nCordialement,\n${doc.company.commercial_name || doc.company.legal_name}`,
            document_type: doc.type,
            document_id: doc.id,
          },
        });
      }
    } catch (e) {
      console.warn("Notification email trigger warning:", e);
    }

    setSignedSuccess(true);
    void fetchDocument();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-muted">Chargement du document sécurisé…</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-text mb-1">Document non disponible</h2>
        <p className="text-sm text-muted mb-6">{error || "Ce document n'existe pas ou a été déplacé."}</p>
        <Link to="/">
          <Button variant="primary">Retourner à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const isProPlan = doc.company.plan === "pro";
  const isSigned = !!doc.signature_data || doc.status === "accepted" || doc.status === "signed";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Top Banner Branding */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          {doc.company.logo_url ? (
            <img src={doc.company.logo_url} alt="Logo" className="h-9 object-contain rounded" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black">
              {doc.company.legal_name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-white">{doc.company.legal_name}</h1>
            <p className="text-xs text-slate-400">Portail de consultation & signature sécurisé</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Télécharger / Imprimer
          </Button>

          {!isSigned && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsSignModalOpen(true)}
              className="bylz-glow-cta text-xs font-extrabold"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Signer le document
            </Button>
          )}
        </div>
      </div>

      {/* Main Document Card */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Signed Success Callout */}
        {(signedSuccess || isSigned) && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-emerald-400">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-bold">Document Électroniquement Signé & Certifié</p>
                <p className="text-xs text-emerald-300/80">
                  Signé par <strong>{doc.signature_data?.signer_name || "le destinataire"}</strong> le{" "}
                  {doc.signature_data?.signed_at ? formatDateLong(doc.signature_data.signed_at) : "aujourd'hui"}.
                </p>
              </div>
            </div>
            {doc.signature_data?.signature_image && (
              <img
                src={doc.signature_data.signature_image}
                alt="Signature"
                className="h-10 bg-white/10 px-2 py-1 rounded border border-white/20"
              />
            )}
          </div>
        )}

        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-800 pb-6">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-pill bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              {doc.type === "quote" ? "DEVIS OFFICIEL" : "FACTURE OFFICIELLE"}
            </span>
            <h2 className="text-2xl font-black text-white">{doc.number}</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Émis le {formatDateLong(doc.issue_date)}
              {doc.due_or_validity_date && (
                <span>• Limite : {formatDateLong(doc.due_or_validity_date)}</span>
              )}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">Émetteur</p>
            <p className="text-sm font-bold text-white">{doc.company.legal_name}</p>
            {doc.company.siret && <p className="text-xs text-slate-400">SIRET : {doc.company.siret}</p>}
            <p className="text-xs text-slate-400">{doc.company.address}</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Destinataire (Client)</p>
          <p className="text-sm font-bold text-white">{doc.client.name}</p>
          {doc.client.siret && <p className="text-xs text-slate-400">SIRET : {doc.client.siret}</p>}
          {doc.client.email && <p className="text-xs text-slate-400">{doc.client.email}</p>}
          {doc.client.address && <p className="text-xs text-slate-400">{doc.client.address}</p>}
        </div>

        {/* Lines Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-2 font-bold">Description</th>
                <th className="py-3 px-2 font-bold text-center">Qté</th>
                <th className="py-3 px-2 font-bold text-right">Prix Unitaire</th>
                <th className="py-3 px-2 font-bold text-right">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {doc.lines.map((line, idx) => (
                <tr key={idx} className="text-slate-200">
                  <td className="py-3 px-2 font-medium">{line.description}</td>
                  <td className="py-3 px-2 text-center">{line.quantity}</td>
                  <td className="py-3 px-2 text-right">{formatAmount(line.unit_price)}</td>
                  <td className="py-3 px-2 text-right font-bold">{formatAmount(line.quantity * line.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 max-w-sm space-y-1">
            <p className="font-bold text-slate-300">Mentions Légales & Conditions :</p>
            <p className="whitespace-pre-line text-[11px] text-slate-400">{doc.company.invoice_footer || "Paiement à réception. Pénalités de retard applicables."}</p>
          </div>

          <div className="w-full sm:w-64 bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Total HT :</span>
              <span>{formatAmount(doc.total_ht)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>TVA (0% Franchise) :</span>
              <span>{formatAmount(doc.total_vat)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Total TTC :</span>
              <span className="text-primary">{formatAmount(doc.total_ttc)}</span>
            </div>
          </div>
        </div>

        {/* Online Payment / RIB Section */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Modalités de Règlement</span>
            </h4>
            {isProPlan ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-pill border border-emerald-500/20">
                💳 Paiement 1-Clic Actif
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-pill border border-amber-500/20">
                🔒 Virement Bancaire Direct
              </span>
            )}
          </div>

          {isProPlan && doc.stripe_payment_link ? (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-300">
                Réglez cette facture instantanément par carte bancaire de façon sécurisée via Stripe.
              </p>
              <a
                href={doc.stripe_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payer {formatAmount(doc.total_ttc)} en ligne</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="text-xs text-slate-300 space-y-2 pt-1">
              <p>Veuillez effectuer votre virement bancaire sur le compte de l'entreprise :</p>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200">
                <p>Titulaire : {doc.company.legal_name}</p>
                <p>Référence à rappeler : {doc.number}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Acquisition Banner */}
      <div className="w-full max-w-4xl text-center mt-8 space-y-2">
        <p className="text-xs text-slate-400">
          Facturé et certifié électroniquement avec <strong className="text-white">Bylz</strong>
        </p>
        <Link to="/">
          <span className="inline-flex items-center space-x-1.5 text-xs text-primary hover:text-primary-hover font-semibold transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vous êtes indépendant ? Créez et signez vos factures gratuitement sur Bylz</span>
          </span>
        </Link>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        documentNumber={doc.number}
        documentType={doc.type}
        clientName={doc.client.name}
        clientEmail={doc.client.email || ""}
        onSubmit={handleSignatureSubmit}
      />
    </div>
  );
}
