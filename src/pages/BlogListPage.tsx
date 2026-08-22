import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Clock, ArrowRight, Search, Tag } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { BLOG_ARTICLES } from "../data/blogArticles";
import { fetchPublishedBlogPosts } from "../lib/api";
import type { BlogPost } from "../types/database";

export function BlogListPage() {
  const [articles, setArticles] = useState<
    { slug: string; title: string; excerpt: string; date: string; readTime: string; category: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const dbPosts = await fetchPublishedBlogPosts();
        if (dbPosts.length > 0) {
          const mapped = dbPosts.map((p) => ({
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            date: p.published_at
              ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(p.published_at))
              : "Récemment",
            readTime: p.read_time,
            category: p.category,
          }));
          setArticles(mapped);
        } else {
          setArticles(
            BLOG_ARTICLES.map((a) => ({
              slug: a.slug,
              title: a.title,
              excerpt: a.excerpt,
              date: a.date,
              readTime: a.readTime,
              category: a.category,
            }))
          );
        }
      } catch {
        setArticles(
          BLOG_ARTICLES.map((a) => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            date: a.date,
            readTime: a.readTime,
            category: a.category,
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const categories = ["Tous", ...Array.from(new Set(articles.map((a) => a.category)))];

  const filteredArticles = articles.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "Tous" || a.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Blog Bylz : Guides Fiscaux, Factur-X & Gestion pour Auto-Entrepreneurs"
        description="Retrouvez nos articles, conseils et guides pratiques pour gérer votre micro-entreprise : réforme Factur-X 2026, plafonds de TVA, signature de devis et cotisations URSSAF."
        canonical="/blog"
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
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

          {/* Search & Category Filter Bar */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Rechercher un guide (ex: Factur-X, TVA, Devis...)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>

            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-surface border border-border text-muted hover:text-text hover:border-brand-primary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="p-16 text-center text-muted">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Chargement des articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 text-center space-y-2 border border-border rounded-2xl bg-surface">
              <p className="text-base font-bold text-text">Aucun article trouvé</p>
              <p className="text-xs text-muted">Essayez avec d'autres mots-clés ou réinitialisez la recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredArticles.map((article, idx) => {
                const colors = [
                  "from-brand-primary/20 via-brand-primary/10 to-surface",
                  "from-accent/20 via-accent/10 to-surface",
                  "from-emerald-500/20 via-emerald-500/10 to-surface",
                ];
                const bgGradient = colors[idx % colors.length];

                return (
                  <article
                    key={article.slug}
                    className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-brand-primary/50 transition-all duration-300 group"
                  >
                    {/* Visual Card Top Header */}
                    <div className={`p-6 bg-gradient-to-br ${bgGradient} border-b border-border/50 relative overflow-hidden`}>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary font-black text-[11px] uppercase tracking-wider">
                          {article.category}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-muted text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-brand-primary" /> {article.readTime}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-text group-hover:text-brand-primary transition-colors leading-snug line-clamp-2">
                        <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                      </h2>
                    </div>

                    {/* Body Excerpt */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-muted leading-relaxed line-clamp-3">{article.excerpt}</p>

                      <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary font-black text-[10px] flex items-center justify-center">
                            BZ
                          </div>
                          <span className="text-[11px] font-bold text-muted">Équipe Bylz • {article.date}</span>
                        </div>

                        <Link
                          to={`/blog/${article.slug}`}
                          className="inline-flex items-center font-extrabold text-brand-primary hover:text-brand-primary-hover group-hover:translate-x-0.5 transition-transform"
                        >
                          Lire <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
