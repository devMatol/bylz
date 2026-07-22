import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { TrustBadgesRow } from "../components/marketing/TrustBadgesRow";

export function PricingPage() {
  const productSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Bylz Starter",
      description: "Plan gratuit de démarrage pour créer des factures conformes Factur-X.",
      offers: {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "EUR",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Bylz Solo",
      description: "Plan complet pour indépendant avec facturation illimitée et pilotage fiscal.",
      offers: {
        "@type": "Offer",
        price: "9.00",
        priceCurrency: "EUR",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Bylz Pro",
      description: "Plan premium avec paiement en ligne Stripe Connect et télétransmission DGFiP.",
      offers: {
        "@type": "Offer",
        price: "19.00",
        priceCurrency: "EUR",
      },
    },
  ];

  const featureMatrix = [
    {
      category: "Facturation & Devis",
      features: [
        { name: "Factures & Devis mensuels", starter: "10 / mois", solo: "Illimités", pro: "Illimités" },
        { name: "Nombre de clients actifs", starter: "3 max", solo: "Illimités", pro: "Illimités" },
        { name: "Format hybride Factur-X conforme 2026", starter: true, solo: true, pro: true },
        { name: "Recherche SIRET automatique client", starter: true, solo: true, pro: true },
        { name: "Personnalisation du logo & couleurs", starter: false, solo: true, pro: true },
        { name: "Avoirs & Notes de crédit", starter: true, solo: true, pro: true },
      ],
    },
    {
      category: "Pilotage Fiscal & Cotisations",
      features: [
        { name: "Tableau de bord fiscal en temps réel", starter: false, solo: true, pro: true },
        { name: "Alertes seuils de franchise de TVA (39k€)", starter: false, solo: true, pro: true },
        { name: "Calcul des cotisations URSSAF", starter: false, solo: true, pro: true },
        { name: "Simulation de l'Impôt sur le Revenu", starter: false, solo: true, pro: true },
        { name: "Saisie du Chiffre d'Affaires antérieur", starter: true, solo: true, pro: true },
      ],
    },
    {
      category: "Automatisations & Télétransmission",
      features: [
        { name: "Relances automatiques par e-mail", starter: false, solo: true, pro: true },
        { name: "Importation de factures PDF historiques", starter: true, solo: true, pro: true },
        { name: "Paiement en ligne Stripe Connect", starter: false, solo: false, pro: true },
        { name: "Télétransmission directe DGFiP (E-Reporting)", starter: false, solo: false, pro: true },
        { name: "Support client prioritaire", starter: false, solo: false, pro: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Tarifs Bylz — Logiciel de Facturation et Pilotage Fiscal pour Micro-Entrepreneurs"
        description="Découvrez nos tarifs simples et sans engagement pour auto-entrepreneurs : Starter 0€, Solo 9€/mois et Pro 19€/mois. 14 jours d'essai offerts."
        canonical="/tarifs"
        jsonLd={productSchemas}
      />

      <MarketingNavbar />

      <main className="pt-28 sm:pt-32 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold border border-brand-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparence Totale — Sans engagement</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text">
              Des tarifs simples pour booster votre activité
            </h1>
            <p className="text-sm sm:text-base text-text/80">
              Démarrez gratuitement avec le plan Starter ou libérez tout le potentiel de votre entreprise avec 14 jours d'essai offerts.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Starter */}
            <div className="bg-surface border border-border/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text">Starter</h2>
                  <p className="text-xs text-text/70 mt-1 font-medium">Pour lancer votre activité</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">0 €</span>
                    <span className="text-xs text-text/70">/ mois</span>
                  </div>
                </div>
                <p className="text-xs text-text/80 leading-relaxed border-t border-border/80 pt-4 font-normal">
                  Le plan idéal pour tester Bylz et émettre vos premières factures légales gratuitement.
                </p>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup?plan=starter"
                  className="block w-full text-center text-sm font-bold text-text bg-surface-hover hover:bg-border/80 border border-border/80 py-3.5 rounded-xl transition-all shadow-sm hover:text-brand-primary"
                >
                  Créer un compte gratuit
                </Link>
              </div>
            </div>

            {/* Solo */}
            <div className="relative bg-surface border-2 border-brand-primary rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl scale-100 md:scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                ★ LE PLUS POPULAIRE
              </div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text">Solo</h2>
                  <p className="text-xs text-text/70 mt-1 font-medium">Pour les indépendants actifs</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-brand-primary font-mono">9 €</span>
                    <span className="text-xs text-text/70">/ mois HT</span>
                  </div>
                </div>
                <p className="text-xs text-text/80 leading-relaxed border-t border-border/80 pt-4 font-normal">
                  Factures illimitées, tableau de bord fiscal en temps réel et alertes automatiques de seuils de TVA.
                </p>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup?plan=solo"
                  className="block w-full text-center text-sm font-black text-white bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-primary hover:from-indigo-600 hover:to-brand-primary py-3.5 rounded-xl shadow-lg shadow-brand-primary/30 transition-all duration-300"
                >
                  Essayer Solo — 14 jours offerts
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-surface border border-border/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text">Pro</h2>
                  <p className="text-xs text-text/70 mt-1 font-medium">Pour une automatisation complète</p>
                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black text-text font-mono">19 €</span>
                    <span className="text-xs text-text/70">/ mois HT</span>
                  </div>
                </div>
                <p className="text-xs text-text/80 leading-relaxed border-t border-border/80 pt-4 font-normal">
                  Paiement en ligne par carte via Stripe Connect et télétransmission e-reporting en 1 clic.
                </p>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup?plan=pro"
                  className="block w-full text-center text-sm font-bold text-text bg-surface-hover hover:bg-border/80 border border-border/80 py-3.5 rounded-xl transition-all shadow-sm hover:text-brand-primary"
                >
                  Essayer Pro — 14 jours offerts
                </Link>
              </div>
            </div>
          </div>

          {/* Full Comparison Table with Touch Scroll */}
          <div className="pt-8 sm:pt-12 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-text">Comparatif détaillé des fonctionnalités</h2>
              <p className="text-xs text-text/80 font-medium">Glissez horizontalement pour comparer tous les plans</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto touch-pan-x">
                <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-hover/80 border-b border-border text-text font-bold">
                      <th className="p-4">Fonctionnalité</th>
                      <th className="p-4 text-center w-28">Starter</th>
                      <th className="p-4 text-center w-28 text-brand-primary font-extrabold">Solo</th>
                      <th className="p-4 text-center w-28 text-brand-accent font-extrabold">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {featureMatrix.map((cat, idx) => (
                      <tr key={idx} className="contents">
                        <tr className="bg-surface-hover/40">
                          <td colSpan={4} className="p-3.5 font-bold text-brand-primary uppercase text-[11px] tracking-wider">
                            {cat.category}
                          </td>
                        </tr>
                        {cat.features.map((feat, fIdx) => (
                          <tr key={fIdx} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="p-4 font-medium text-text">{feat.name}</td>
                            <td className="p-4 text-center">
                              {typeof feat.starter === "boolean" ? (
                                feat.starter ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-text/30 mx-auto" />
                              ) : (
                                <span className="font-bold text-text">{feat.starter}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feat.solo === "boolean" ? (
                                feat.solo ? <Check className="w-4 h-4 text-brand-primary mx-auto" /> : <X className="w-4 h-4 text-text/30 mx-auto" />
                              ) : (
                                <span className="font-bold text-brand-primary">{feat.solo}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feat.pro === "boolean" ? (
                                feat.pro ? <Check className="w-4 h-4 text-brand-accent mx-auto" /> : <X className="w-4 h-4 text-text/30 mx-auto" />
                              ) : (
                                <span className="font-bold text-brand-accent">{feat.pro}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <TrustBadgesRow />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
