import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";

export function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO title="Mentions Légales | Bylz" canonical="/mentions-legales" />
      <MarketingNavbar />
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-4 space-y-8 text-xs sm:text-sm text-muted">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-text">Mentions Légales</h1>
          <p className="text-xs text-muted">Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN).</p>
        </div>
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">1. Éditeur de la plateforme</h2>
          <p>Le site internet et service en ligne <strong>Bylz.fr</strong> est édité par :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dénomination :</strong> Bylz (Lumis Web)</li>
            <li><strong>Responsable & Directeur de la publication :</strong> Matthias Ollivier</li>
            <li><strong>Siège social :</strong> 94120 Fontenay-sous-Bois, France</li>
            <li><strong>Téléphone :</strong> +33 9 39 20 24 35</li>
            <li><strong>Email de contact :</strong> <span className="font-mono text-text">contact@bylz.fr</span></li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">2. Hébergement de la plateforme</h2>
          <p>La plateforme Bylz.fr, ses interfaces et son infrastructure de données sont hébergées par des prestataires spécialisés certifiés ISO 27001 et SOC 2 :</p>
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <p className="font-bold text-text">Hébergement Applicatif & Interface Web :</p>
              <p><strong>Vercel Inc.</strong> — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
              <p className="text-[11px] text-muted">Réseau Edge CDN distribué au sein de l'Union Européenne (Paris / Francfort).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <p className="font-bold text-text">Base de données, Stockage & API :</p>
              <p><strong>Supabase Inc. / Amazon Web Services (AWS)</strong> — Datacenter situé dans l'Union Européenne (Région Europe / Francfort, Allemagne).</p>
              <p className="text-[11px] text-muted">Hébergement chiffré TLS 1.3, sauvegardes quotidiennes et conformité totale RGPD.</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">3. Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments constituant le site Bylz.fr (notamment les textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, architecture logicielle) ainsi que le site lui-même, relèvent des législations françaises et internationales sur le droit d'auteur et la propriété intellectuelle.
          </p>
          <p>
            Ces éléments sont la propriété exclusive de Bylz Technologies et de ses fondateurs. Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit et sur quelque support que ce soit, est strictement interdite sans autorisation écrite préalable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">4. Données personnelles & Cookies</h2>
          <p>
            Bylz s'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD n° 2016/679) et à la loi Informatique et Libertés.
          </p>
          <p>
            La navigation sur le site ne dépose aucun cookie publicitaire ou traceur invasif sur votre équipement sans votre consentement explicite.
          </p>
          <p>
            Pour plus d'informations sur la gestion de vos données et l'exercice de vos droits (accès, rectification, suppression), consultez notre <a href="/confidentialite" className="text-primary hover:underline font-semibold">Politique de Confidentialité</a> ou contactez notre délégué à la protection des données à <span className="font-mono text-text">dpo@bylz.fr</span>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">5. Conception & Développement Web</h2>
          <p>
            L'architecture logicielle, la conception UX/UI et le développement full-stack de la plateforme Bylz.fr ont été réalisés par le studio d'ingénierie web <a href="https://lumisweb.fr" target="_blank" rel="noopener" className="font-bold text-primary hover:underline">Lumisweb (lumisweb.fr)</a>.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
