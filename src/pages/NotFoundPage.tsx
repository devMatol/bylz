import { Link } from "react-router-dom";
import { Home, FileQuestion } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/20 selection:text-primary flex flex-col justify-between">
      <SEO
        title="Page introuvable (404) | Bylz"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        noindex
      />

      <MarketingNavbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-primary">Erreur 404</span>
            <h1 className="text-3xl sm:text-4xl font-black text-text">Page Introuvable</h1>
            <p className="text-sm text-muted">
              L'URL demandée n'existe pas, a été renommée ou a été temporairement déplacée.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" leftIcon={<Home className="w-4 h-4" />} className="w-full sm:w-auto font-bold bylz-glow-cta">
                Retour à l'accueil
              </Button>
            </Link>
            <Link to="/blog" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-bold">
                Consulter le blog
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
