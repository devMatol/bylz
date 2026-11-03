import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  User,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { BLOG_ARTICLES, type BlogArticle } from "../data/blogArticles";
import { supabase } from "../lib/supabase";

export function BlogListPage() {
  const [articles, setArticles] = useState<BlogArticle[]>(BLOG_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchRemoteArticles() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("blog_posts")
          .select("slug, title, excerpt, category, read_time, cover_image_url, author, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (error) {
          console.warn("Supabase blog fetch fallback:", error.message);
          return;
        }

        if (data && data.length > 0) {
          const remoteArticles: BlogArticle[] = data.map((p: any) => ({
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt || "",
            content: "",
            category: p.category || "Fiscalité & Gestion",
            date: new Date(p.published_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            readTime: p.read_time || "4 min",
            author: p.author || "Équipe Bylz",
            coverImageUrl: p.cover_image_url || "https://bylz.fr/og-image.png",
          }));

          const remoteSlugs = new Set(remoteArticles.map((a) => a.slug));
          const fallbackRemaining = BLOG_ARTICLES.filter((a) => !remoteSlugs.has(a.slug));
          setArticles([...remoteArticles, ...fallbackRemaining]);
        }
      } catch (err) {
        console.warn("Erreur chargement blog distant:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRemoteArticles();
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/blog"].title}
        description={SEO_METADATA["/blog"].description}
        canonical={SEO_METADATA["/blog"].canonical}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>Guides & Actualités Fiscales</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Le blog des indépendants et micro-entrepreneurs
            </h1>
            <p className="text-base text-slate-600 font-medium">
              Des conseils clairs, sans jargon, pour maîtriser votre facturation et votre fiscalité en toute sérénité.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un guide (ex: Factur-X, TVA, Devis...)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>

            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 min-h-[44px] inline-flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="p-16 text-center text-slate-500 font-medium">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Chargement des articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 text-center space-y-2 border border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-base font-bold text-slate-900">Aucun article trouvé</p>
              <p className="text-xs text-slate-500">Essayez avec d'autres mots-clés ou réinitialisez la recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredArticles.map((article) => {
                return (
                  <article
                    key={article.slug}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="p-6 sm:p-7 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {article.category}
                        </span>
                        <span className="flex items-center text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {article.readTime}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                        <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                      </h2>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center text-xs text-slate-500 font-medium space-x-3">
                        <span className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {article.author}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {article.date}
                        </span>
                      </div>

                      <Link
                        to={`/blog/${article.slug}`}
                        className="inline-flex items-center min-h-[44px] px-2 font-bold text-xs text-blue-700 hover:text-blue-900 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Lire</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
