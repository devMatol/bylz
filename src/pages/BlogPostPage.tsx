import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Sparkles, ArrowRight, Eye } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { BLOG_ARTICLES } from "../data/blogArticles";
import { fetchBlogPostBySlug, incrementBlogPostViews } from "../lib/api";
import { sanitizeHtml } from "../lib/sanitizeHtml";
import { InvoiceModelConfigurator } from "../components/tools/InvoiceModelConfigurator";
import { BLOG_SLUG_REDIRECTS, getCanonicalBlogSlug, getDbBlogSlug } from "../lib/blogSlugs";

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  if (slug && BLOG_SLUG_REDIRECTS[slug]) {
    return <Navigate to={`/blog/${BLOG_SLUG_REDIRECTS[slug]}`} replace />;
  }
  const [article, setArticle] = useState<{
    id?: string;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    content: string;
    metaDescription?: string;
    views?: number;
    coverImageUrl?: string;
    publishedAt?: string;
    createdAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const querySlug = getDbBlogSlug(slug);
        const dbPost = await fetchBlogPostBySlug(querySlug);
        if (dbPost) {
          setArticle({
            id: dbPost.id,
            slug: getCanonicalBlogSlug(dbPost.slug),
            title: dbPost.title,
            excerpt: dbPost.excerpt,
            category: dbPost.category,
            author: dbPost.author,
            date: dbPost.published_at
              ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dbPost.published_at))
              : "Récemment",
            readTime: dbPost.read_time,
            content: dbPost.content,
            metaDescription: dbPost.meta_description || dbPost.excerpt,
            views: dbPost.views || 0,
            coverImageUrl: dbPost.cover_image_url || "",
            publishedAt: dbPost.published_at || "",
            createdAt: dbPost.created_at || "",
          });
          if (dbPost.id) {
            void incrementBlogPostViews(dbPost.id);
          }
        } else {
          const staticMatch = BLOG_ARTICLES.find((a) => a.slug === slug);
          if (staticMatch) {
            setArticle({
              slug: staticMatch.slug,
              title: staticMatch.title,
              excerpt: staticMatch.excerpt,
              category: staticMatch.category,
              author: staticMatch.author,
              date: staticMatch.date,
              readTime: staticMatch.readTime,
              content: staticMatch.content,
              metaDescription: staticMatch.excerpt,
              coverImageUrl: "",
              publishedAt: "",
              createdAt: "",
            });
          }
        }
      } catch {
        const staticMatch = BLOG_ARTICLES.find((a) => a.slug === slug);
        if (staticMatch) {
          setArticle({
            slug: staticMatch.slug,
            title: staticMatch.title,
            excerpt: staticMatch.excerpt,
            category: staticMatch.category,
            author: staticMatch.author,
            date: staticMatch.date,
            readTime: staticMatch.readTime,
            content: staticMatch.content,
            metaDescription: staticMatch.excerpt,
            coverImageUrl: "",
            publishedAt: "",
            createdAt: "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const extractFaqsFromHtml = (html: string) => {
    const faqs: { question: string; answer: string }[] = [];
    try {
      const headingRegex = /<(h[23])>([^<]*\?[^<]*)<\/\1>/gi;
      const matches = Array.from(html.matchAll(headingRegex));

      for (const match of matches) {
        const question = match[2].trim();
        const startIdx = match.index! + match[0].length;
        const remaining = html.slice(startIdx);
        const pMatch = remaining.match(/<p>([\s\S]*?)<\/p>/i);
        if (pMatch) {
          const answer = pMatch[1].replace(/<[^>]+>/g, "").trim();
          if (answer.length > 15) {
            faqs.push({ question, answer });
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
    return faqs;
  };

  const extractedFaqs = extractFaqsFromHtml(article.content);

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: article.coverImageUrl || "https://bylz.fr/og-image.png",
    datePublished: article.publishedAt || "2026-07-15T10:00:00.000Z",
    dateModified: article.publishedAt || "2026-07-15T10:00:00.000Z",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://bylz.fr/blog/${article.slug}`,
    },
    author: {
      "@type": "Person",
      name: article.author || "Équipe Bylz",
    },
    publisher: {
      "@type": "Organization",
      name: "Bylz",
      logo: {
        "@type": "ImageObject",
        url: "https://bylz.fr/og-image.png",
      },
    },
  };

  const faqSchema = extractedFaqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: extractedFaqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  } : null;

  const schemas = faqSchema ? [blogPostingSchema, faqSchema] : [blogPostingSchema];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={`${article.title} | Blog Bylz`}
        description={article.metaDescription || article.excerpt}
        canonical={`/blog/${article.slug}`}
        ogType="article"
        jsonLd={schemas}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Back link */}
          <Link
            to="/blog"
            className="min-h-[44px] inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour au blog
          </Link>

          {/* Article Header */}
          <div className="space-y-4 border-b border-slate-200 pb-8">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
              {article.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-2">
              <span className="flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-blue-700" /> {article.author}
              </span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" /> {article.date}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" /> {article.readTime}
              </span>
              {article.views != null && (
                <span className="flex items-center">
                  <Eye className="w-3.5 h-3.5 mr-1 text-emerald-700" /> {article.views} lectures
                </span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div
            className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4 font-normal text-slate-800"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          {/* Embedded Configurator if article relates to invoice templates */}
          {(article.slug.includes("modele") ||
            article.title.toLowerCase().includes("modèle") ||
            article.category.toLowerCase().includes("facturation")) && (
            <div className="mt-12 pt-8 border-t border-slate-200 space-y-6">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Configurateur Express Embarqué
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Personnalisez et téléchargez votre modèle de facture avec mentions légales
                </h3>
                <p className="text-xs text-slate-600 max-w-lg mx-auto">
                  Modifiez vos coordonnées et téléchargez directement votre facture officielle en PDF gratuit.
                </p>
              </div>
              <InvoiceModelConfigurator
                initialPreset={
                  article.slug.includes("artisan") || article.slug.includes("batiment")
                    ? "artisan_btp"
                    : article.slug.includes("commerce")
                    ? "commerce"
                    : article.slug.includes("freelance") || article.slug.includes("service")
                    ? "freelance_service"
                    : "auto_entrepreneur"
                }
                sourcePage={`/blog/${article.slug}`}
              />
            </div>
          )}

          {/* CTA Banner inside Article */}
          <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="inline-flex items-center space-x-1.5 text-blue-800 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Mentions légales & URSSAF 2026</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Prêt à automatiser la facturation de votre micro-entreprise ?
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Bylz simplifie vos factures PDF avec mentions légales obligatoires, la signature électronique et le suivi URSSAF en 2 minutes par jour.
            </p>
            <div>
              <Link
                to="/signup"
                className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 min-h-[44px] rounded-full shadow-md transition-colors"
              >
                <span>Créer mon compte gratuit Bylz</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </article>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
