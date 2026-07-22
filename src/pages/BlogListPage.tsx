import { Link } from "react-router-dom";
import { BookOpen, Calendar, Clock, ArrowRight } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { BLOG_ARTICLES } from "../data/blogArticles";

export function BlogListPage() {
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Blog Bylz — Guides Fiscaux et Facturation pour Auto-Entrepreneurs"
        description="Retrouvez nos articles, conseils et guides pratiques pour gérer votre micro-entreprise : réforme Factur-X 2026, plafonds de TVA et cotisations URSSAF."
        canonical="/blog"
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guides & Actualités Fiscales</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text">
              Le blog des indépendants et micro-entrepreneurs
            </h1>
            <p className="text-base text-muted">
              Des conseils clairs, sans jargon, pour maîtriser votre facturation et votre fiscalité en toute sérénité.
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_ARTICLES.map((article) => (
              <article
                key={article.slug}
                className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="px-2.5 py-1 rounded-md bg-brand-primary/10 text-brand-primary font-bold">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {article.readTime}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-text group-hover:text-brand-primary transition-colors leading-snug">
                    <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                  </h2>

                  <p className="text-xs text-muted leading-relaxed">{article.excerpt}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="flex items-center text-muted">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> {article.date}
                  </span>
                  <Link
                    to={`/blog/${article.slug}`}
                    className="font-bold text-brand-primary flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    <span>Lire l'article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
