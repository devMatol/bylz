import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/mentions-legales"].title}
        description={SEO_METADATA["/mentions-legales"].description}
        canonical={SEO_METADATA["/mentions-legales"].canonical}
      />
      <MarketingNavbar theme="light" />
      <main id="main-content" className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-8 text-xs sm:text-sm text-slate-700">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Mentions Légales</h1>
          <p className="text-xs text-slate-500">Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN).</p>
        </div>
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Éditeur de la plateforme</h2>
          <p>Le site internet et service en ligne <strong>Bylz.fr</strong> est édité par :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dénomination sociale :</strong> ARABACI HOLDING</li>
            <li><strong>Forme juridique :</strong> Société par Actions Simplifiée Unipersonnelle (SASU) au capital de 1 000 €</li>
            <li><strong>Numéro SIREN :</strong> 908 662 950</li>
            <li><strong>Numéro SIRET (siège) :</strong> 908 662 950 00017</li>
            <li><strong>Immatriculation :</strong> RCS Bordeaux 908 662 950</li>
            <li><strong>Siège social :</strong> 21 B rue Général de Castelnau, 33700 Mérignac, France</li>
            <li><strong>Directeur de la publication :</strong> Irfan Arabaci, représentant légal</li>
            <li><strong>Numéro de TVA intracommunautaire :</strong> FR93908662950</li>
            <li><strong>Contact électronique :</strong> <span className="font-mono text-slate-900 font-bold">contact@bylz.fr</span></li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Hébergement de la plateforme</h2>
          <p>La plateforme Bylz.fr, ses interfaces et son infrastructure de données sont hébergées par des prestataires spécialisés :</p>
          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-900">Hébergement Applicatif & Interface Web :</p>
              <p><strong>Netlify, Inc.</strong> (512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis).</p>
              <p className="text-[11px] text-slate-500 pt-1">Page légale : <a href="https://www.netlify.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">netlify.com/legal/privacy</a></p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-900">Base de données, Stockage & API :</p>
              <p><strong>Supabase Inc. / Amazon Web Services (AWS)</strong> — Datacenter situé dans l'Union Européenne (Région Europe).</p>
              <p className="text-[11px] text-slate-500 pt-1">Hébergement chiffré TLS 1.3, sauvegardes quotidiennes et conformité totale RGPD.</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments constituant le site Bylz.fr (notamment les textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, architecture logicielle) ainsi que le site lui-même, relèvent des législations françaises et internationales sur le droit d'auteur et la propriété intellectuelle.
          </p>
          <p>
            Ces éléments sont la propriété exclusive d'ARABACI HOLDING et de ses partenaires. Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit et sur quelque support que ce soit, est strictement interdite sans autorisation écrite préalable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">4. Données personnelles & Cookies</h2>
          <p>
            Le traitement de vos données personnelles est effectué dans le strict respect du Règlement Général sur la Protection des Données (RGPD 2016/679) et de la loi Informatique et Libertés. Pour plus d'informations, veuillez consulter notre <a href="/confidentialite" className="underline text-blue-700 font-semibold">Politique de Confidentialité</a>.
          </p>
        </section>
      </main>
      <MarketingFooter theme="light" />
    </div>
  );
}
