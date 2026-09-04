import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Sparkles,
  CheckCircle2,
  Building,
  User,
  Plus,
  Trash2,
  ShieldCheck,
  FileText,
  Palette,
  Loader2,
  ArrowRight,
  HelpCircle,
  Briefcase,
  Hammer,
  ShoppingBag,
  Laptop
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { supabase } from "../../lib/supabase";
import { downloadInvoicePdf, type InvoicePdfConfig } from "../../lib/generateInvoicePdf";

export type PresetKey = "auto_entrepreneur" | "artisan_btp" | "freelance_service" | "commerce";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const PRESETS: Record<PresetKey, {
  label: string;
  icon: any;
  companyName: string;
  siret: string;
  address: string;
  clientName: string;
  clientAddress: string;
  lines: LineItem[];
  vatRegime: "franchise" | "vat20" | "vat10";
  accentColor: string;
  footerNotes: string;
}> = {
  auto_entrepreneur: {
    label: "Auto-Entrepreneur (Prestation)",
    icon: Laptop,
    companyName: "Alexandre Dupont — Consultant Freelance",
    siret: "912 345 678 00014",
    address: "14 rue des Développeurs, 75011 Paris",
    clientName: "Société Nova SAS",
    clientAddress: "28 avenue des Champs-Élysées, 75008 Paris",
    lines: [
      { id: "1", description: "Conseil en stratégie digitale et cadrage de projet (3 jours)", quantity: 3, unitPrice: 500 },
      { id: "2", description: "Accompagnement et mise en place technique", quantity: 1, unitPrice: 450 },
    ],
    vatRegime: "franchise",
    accentColor: "#7C6FE0",
    footerNotes: "Auto-entrepreneur dispensé d'immatriculation au RCS.\nTVA non applicable, art. 293 B du CGI.\nRèglement à réception par virement bancaire.\nPénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.",
  },
  artisan_btp: {
    label: "Artisan & Travaux BTP",
    icon: Hammer,
    companyName: "Rénov'Artisan — Jean Bâtiment",
    siret: "834 567 890 00021",
    address: "5 impasse des Compagnons, 69003 Lyon",
    clientName: "M. et Mme Martin",
    clientAddress: "12 rue des Acacias, 69100 Villeurbanne",
    lines: [
      { id: "1", description: "Fourniture et pose de carrelage grès cérame (35 m²)", quantity: 35, unitPrice: 65 },
      { id: "2", description: "Préparation des sols et ragréage autolissant", quantity: 1, unitPrice: 420 },
    ],
    vatRegime: "franchise",
    accentColor: "#F59E0B",
    footerNotes: "Assurance décennale obligatoire souscrite auprès de AXA France (Contrat n°DEC-2026-991, zone France).\nTVA non applicable, art. 293 B du CGI.\nPénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.",
  },
  freelance_service: {
    label: "Société de Services / Agence",
    icon: Briefcase,
    companyName: "Studio Impact Conseil SASU",
    siret: "901 234 567 00019",
    address: "42 rue de la Paix, 33000 Bordeaux",
    clientName: "Groupe Horizon SA",
    clientAddress: "100 boulevard Haussmann, 75008 Paris",
    lines: [
      { id: "1", description: "Audit UX/UI et refonte de l'interface mobile", quantity: 1, unitPrice: 2800 },
      { id: "2", description: "Atelier de co-conception design system", quantity: 2, unitPrice: 600 },
    ],
    vatRegime: "vat20",
    accentColor: "#10B981",
    footerNotes: "Règlement par virement sous 30 jours fin de mois.\nIBAN : FR76 3000 4000 5000 6000 7000 899.\nPénalités de retard au taux légal en vigueur majoré de 10 points. Indemnité forfaitaire de 40 €.",
  },
  commerce: {
    label: "Commerce & Vente de Marchandises",
    icon: ShoppingBag,
    companyName: "Boutique Bio & Terroir",
    siret: "791 234 567 00035",
    address: "8 place du Marché, 44000 Nantes",
    clientName: "Épicerie Fine Le Local",
    clientAddress: "15 rue Centrale, 44100 Nantes",
    lines: [
      { id: "1", description: "Coffret Dégustation Huiles et Épices artisanales (Lot de 10)", quantity: 10, unitPrice: 85 },
      { id: "2", description: "Frais de livraison sécurisée et emballage isotherme", quantity: 1, unitPrice: 35 },
    ],
    vatRegime: "vat20",
    accentColor: "#6CB8F5",
    footerNotes: "Marchandises vendues sous réserve de propriété jusqu'au complet paiement.\nRèglement à réception.\nPénalités de retard : 3 fois le taux légal. Indemnité de recouvrement : 40 €.",
  },
};

const SWATCHES = ["#7C6FE0", "#6CB8F5", "#10B981", "#F59E0B", "#F43F5E", "#64748B"];

interface InvoiceModelConfiguratorProps {
  initialPreset?: PresetKey;
  sourcePage?: string;
}

export function InvoiceModelConfigurator({
  initialPreset = "auto_entrepreneur",
  sourcePage = "/outils/modele-facture-gratuit"
}: InvoiceModelConfiguratorProps) {
  const [activePreset, setActivePreset] = useState<PresetKey>(initialPreset);
  const currentDef = PRESETS[activePreset];

  // Config State
  const [companyName, setCompanyName] = useState(currentDef.companyName);
  const [siret, setSiret] = useState(currentDef.siret);
  const [address, setAddress] = useState(currentDef.address);
  const [clientName, setClientName] = useState(currentDef.clientName);
  const [clientAddress, setClientAddress] = useState(currentDef.clientAddress);
  const [invoiceNumber, setInvoiceNumber] = useState("FAC-2026-001");
  const [vatRegime, setVatRegime] = useState<"franchise" | "vat20" | "vat10">(currentDef.vatRegime);
  const [accentColor, setAccentColor] = useState(currentDef.accentColor);
  const [footerNotes, setFooterNotes] = useState(currentDef.footerNotes);
  const [lines, setLines] = useState<LineItem[]>(currentDef.lines);

  // Modal / Lead State
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch preset
  const handleSelectPreset = (key: PresetKey) => {
    setActivePreset(key);
    const def = PRESETS[key];
    setCompanyName(def.companyName);
    setSiret(def.siret);
    setAddress(def.address);
    setClientName(def.clientName);
    setClientAddress(def.clientAddress);
    setLines(def.lines);
    setVatRegime(def.vatRegime);
    setAccentColor(def.accentColor);
    setFooterNotes(def.footerNotes);
  };

  // Line item handlers
  const handleLineChange = (id: string, field: keyof LineItem, val: any) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: val } : l))
    );
  };

  const handleAddLine = () => {
    const newId = String(Date.now());
    setLines((prev) => [
      ...prev,
      { id: newId, description: "Nouvelle prestation ou article", quantity: 1, unitPrice: 150 },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  // Calculations
  const totalHt = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 1) * (Number(l.unitPrice) || 0),
    0
  );
  const vatRate = vatRegime === "vat20" ? 0.20 : vatRegime === "vat10" ? 0.10 : 0;
  const totalVat = vatRegime === "franchise" ? 0 : totalHt * vatRate;
  const totalTtc = totalHt + totalVat;

  const pdfConfig: InvoicePdfConfig = {
    companyName,
    siret,
    address,
    clientName,
    clientAddress,
    invoiceNumber,
    issueDate: new Date().toISOString(),
    lines: lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity) || 1,
      unitPrice: Number(l.unitPrice) || 0,
    })),
    vatRegime,
    accentColor,
    footerNotes,
  };

  // Lead Submission & PDF Generation
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Veuillez saisir une adresse email valide.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Submit lead to Supabase RPC
      await supabase.rpc("submit_invoice_lead", {
        p_email: email,
        p_name: name || companyName,
        p_source_url: sourcePage,
        p_template_type: activePreset,
        p_invoice_data: {
          totalHt,
          totalTtc,
          companyName,
          clientName,
          vatRegime,
        },
      });

      // 2. Generate and download PDF instantly in browser
      await downloadInvoicePdf(pdfConfig, `${invoiceNumber.toLowerCase()}-${(companyName || "facture").toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`);

      // 3. Save draft to localStorage so user can seamlessly import into Bylz
      try {
        localStorage.setItem("bylz_guest_draft", JSON.stringify({
          clientName,
          lines: lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            nature: "service"
          })),
          issueDate: new Date().toISOString().slice(0, 10),
          paymentTerms: "30d"
        }));
      } catch {
        // Ignored
      }

      setLeadSuccess(true);
    } catch (err: any) {
      console.error("Lead submission error:", err);
      // Even if network fails, download the PDF so the user is never stuck
      await downloadInvoicePdf(pdfConfig, "facture-conforme.pdf");
      setLeadSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Presets Toolbar */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <span>Sélectionnez un modèle adapté à votre métier :</span>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
            const p = PRESETS[key];
            const Icon = p.icon;
            const isSelected = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 shadow-sm ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/30"
                    : "bg-surface border-border text-muted hover:text-text hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-xl ${isSelected ? "bg-primary text-white" : "bg-surface-hover text-muted"}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-text leading-tight">{p.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Configurator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Fast Inputs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card: Informations Émetteur */}
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2.5">
              <Building className="w-3.5 h-3.5 text-brand-primary" />
              <span>1. Vos informations (Émetteur)</span>
            </h4>
            <div className="space-y-3">
              <Input
                label="Nom de votre entreprise ou Nom Propre"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ex: Jean Dupont Conseil"
                className="text-xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Numéro SIRET (14 chiffres)"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  className="text-xs font-mono"
                />
                <Input
                  label="Numéro de facture"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="FAC-2026-001"
                  className="text-xs font-mono"
                />
              </div>
              <Input
                label="Adresse professionnelle complète"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="10 rue de la République, 75001 Paris"
                className="text-xs"
              />
            </div>
          </Card>

          {/* Card: Client Destinataire */}
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2.5">
              <User className="w-3.5 h-3.5 text-brand-primary" />
              <span>2. Votre Client (Destinataire)</span>
            </h4>
            <div className="space-y-3">
              <Input
                label="Nom du client ou de la société"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ex: Entreprise Client SAS"
                className="text-xs"
              />
              <Input
                label="Adresse du client"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="42 avenue des Entreprises, 69002 Lyon"
                className="text-xs"
              />
            </div>
          </Card>

          {/* Card: Prestations & Articles */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                <span>3. Prestations ou Marchandises</span>
              </h4>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((l, index) => (
                <div key={l.id} className="p-3 rounded-xl bg-surface-hover/60 border border-border space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-muted">Ligne #{index + 1}</span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(l.id)}
                        className="text-muted hover:text-danger p-1 transition-colors"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Description de la prestation..."
                    value={l.description}
                    onChange={(e) => handleLineChange(l.id, "description", e.target.value)}
                    className="text-xs"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Quantité"
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => handleLineChange(l.id, "quantity", Number(e.target.value))}
                      className="text-xs font-mono"
                    />
                    <Input
                      label="Prix Unitaire HT (€)"
                      type="number"
                      min={0}
                      value={l.unitPrice}
                      onChange={(e) => handleLineChange(l.id, "unitPrice", Number(e.target.value))}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card: TVA & Couleur */}
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2.5">
              <Palette className="w-3.5 h-3.5 text-brand-primary" />
              <span>4. Régime TVA & Couleur d'accentuation</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1.5">Régime de TVA</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "franchise", label: "Franchise (Art. 293 B)" },
                    { id: "vat20", label: "TVA 20% (Standard)" },
                    { id: "vat10", label: "TVA 10% (BTP/Rénov)" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setVatRegime(r.id as any)}
                      className={`p-2 text-xs font-bold rounded-xl border transition-all ${
                        vatRegime === r.id
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-surface border-border text-muted hover:text-text"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase mb-1.5">Couleur d'accent</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform border-2 ${
                        accentColor.toLowerCase() === c.toLowerCase()
                          ? "scale-110 border-white ring-2 ring-primary shadow-sm"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    title="Couleur personnalisée"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Printable Preview & Download Card */}
        <div className="lg:col-span-6 space-y-5 lg:sticky lg:top-24">
          {/* Download CTA Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/15 border border-emerald-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Modèle 100% Conforme DGFiP 2026
              </span>
              <span className="text-xs font-mono font-black text-text">Gratuit & Sans CB</span>
            </div>
            <p className="text-xs text-muted">
              Générez votre facture au format officiel Factur-X avec calculs automatiques et mentions légales obligatoires.
            </p>
            <div className="pt-1">
              <Button
                type="button"
                variant="primary"
                onClick={() => setLeadModalOpen(true)}
                className="w-full py-4 bylz-glow-cta text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger mon modèle de facture (PDF Gratuit)</span>
              </Button>
            </div>
          </div>

          {/* Live Preview Paper Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted font-semibold px-1">
              <span>Aperçu en direct (Format A4 conforme)</span>
              <span className="text-[11px] font-mono">{lines.length} prestation{lines.length > 1 ? "s" : ""}</span>
            </div>

            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border border-border shadow-2xl space-y-6 text-xs select-none">
              {/* Header Preview */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div className="space-y-1 max-w-[200px] sm:max-w-xs">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold font-mono mb-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    {(companyName || "B").slice(0, 2).toUpperCase()}
                  </div>
                  <p className="font-bold text-sm text-slate-900 leading-tight">{companyName || "Votre Entreprise"}</p>
                  <p className="text-[11px] text-slate-500">{address || "Votre adresse"}</p>
                  {siret && <p className="text-[10px] text-slate-400 font-mono">SIRET : {siret}</p>}
                </div>

                <div className="text-right space-y-1">
                  <span
                    className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider text-white shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    FACTURE
                  </span>
                  <p className="font-mono font-bold text-slate-800 text-xs mt-1">{invoiceNumber}</p>
                  <p className="text-[10px] text-slate-400">Date : {new Date().toLocaleDateString("fr-FR")}</p>
                </div>
              </div>

              {/* Client Box Preview */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturé à</p>
                <p className="font-bold text-slate-900">{clientName || "Nom du client"}</p>
                <p className="text-[11px] text-slate-600">{clientAddress || "Adresse du client"}</p>
              </div>

              {/* Lines Table Preview */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-200">
                  <span className="flex-1">Description</span>
                  <span className="w-12 text-center">Qté</span>
                  <span className="w-20 text-right">P.U. HT</span>
                  <span className="w-24 text-right">Total HT</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {lines.map((l) => (
                    <div key={l.id} className="flex justify-between py-2 text-slate-800">
                      <span className="flex-1 font-medium pr-2 truncate">{l.description}</span>
                      <span className="w-12 text-center text-slate-500 font-mono">{l.quantity}</span>
                      <span className="w-20 text-right text-slate-500 font-mono">{Number(l.unitPrice).toFixed(2)} €</span>
                      <span className="w-24 text-right font-bold text-slate-900 font-mono">
                        {(Number(l.quantity) * Number(l.unitPrice)).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Preview */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 max-w-xs ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Total HT</span>
                  <span className="font-mono font-semibold">{totalHt.toFixed(2)} €</span>
                </div>
                {vatRegime === "franchise" ? (
                  <p className="text-[10px] text-slate-400 italic text-right">TVA non applicable — Art. 293 B du CGI</p>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>TVA ({(vatRate * 100).toFixed(0)}%)</span>
                    <span className="font-mono">{totalVat.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black">
                  <span className="text-slate-900">Net à payer (TTC)</span>
                  <span className="font-mono text-base" style={{ color: accentColor }}>
                    {totalTtc.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Legal Footer Preview */}
              <div className="border-t border-slate-100 pt-3 text-[9px] text-slate-400 space-y-0.5 leading-tight">
                <p className="line-clamp-2">{footerNotes}</p>
                <p className="text-slate-300 pt-1">Généré avec Bylz — Conforme Factur-X 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lead Capture Modal */}
      <Modal open={leadModalOpen} onClose={() => setLeadModalOpen(false)}>
        <div className="p-6 space-y-5">
          {!leadSuccess ? (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-text">Votre facture est prête à être générée !</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Renseignez votre email pour télécharger votre PDF personnalisé immédiatement et retrouver vos modèles gratuits.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <Input
                  label="Votre adresse email professionnelle *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexandre@mon-entreprise.fr"
                  required
                  autoFocus
                  className="text-xs"
                />
                <Input
                  label="Votre prénom ou nom commercial (optionnel)"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alexandre"
                  className="text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full py-3.5 text-xs font-black bylz-glow-cta bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Génération du PDF conforme...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger mon PDF immédiatement
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted">
                🔒 Vos informations sont confidentielles. Conformité RGPD garantie. Zéro spam.
              </p>
            </form>
          ) : (
            <div className="text-center space-y-5 py-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-text">Facture téléchargée avec succès ! 🎉</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Votre modèle de facture officiel Factur-X a été téléchargé sur votre appareil.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-primary/30 space-y-3 text-left">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-text">Sauvegardez vos données sans ressaisir</p>
                    <p className="text-[11px] text-muted">
                      Créez votre compte gratuit Bylz en 30 secondes pour retrouver cette facture, gérer vos devis et suivre vos plafonds de TVA en direct.
                    </p>
                  </div>
                </div>

                <Link to="/guest-editor" className="block w-full">
                  <Button variant="primary" className="w-full py-3 text-xs font-black bylz-glow-cta flex items-center justify-center gap-1.5">
                    <span>Ouvrir mon compte gratuit Bylz (Brouillon pré-chargé)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLeadModalOpen(false);
                  setLeadSuccess(false);
                }}
                className="text-xs text-muted hover:text-text font-medium underline"
              >
                Fermer et continuer à modifier
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
