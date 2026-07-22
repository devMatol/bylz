import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Sparkles, ArrowRight } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { BLOG_ARTICLES } from "../data/blogArticles";

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: "2026-07-15",
    author: {
      "@type": "Organization",
      name: "Bylz",
    },
    publisher: {
      "@type": "Organization",
      name: "Bylz",
      logo: {
        "@type": "ImageObject",
        url: "https://bylz.fr/logo.png",
      },
    },
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title={`${article.title} — Blog Bylz`}
        description={article.excerpt}
        canonical={`/blog/${article.slug}`}
        ogType="article"
        jsonLd={blogPostingSchema}
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center text-xs font-semibold text-muted hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour au blog
          </Link>

          {/* Article Header */}
          <div className="space-y-4 border-b border-border pb-8">
            <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              {article.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-text">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted font-medium pt-2">
              <span className="flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-brand-primary" /> {article.author}
              </span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" /> {article.date}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" /> {article.readTime}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 font-normal"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* CTA Banner inside Article */}
          <div className="mt-12 bg-gradient-to-r from-brand-primary/10 via-indigo-500/10 to-brand-accent/10 border border-brand-primary/20 rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex items-center space-x-1.5 text-brand-primary text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Conformité 2026 Garantie</span>
            </div>
            <h3 className="text-xl font-bold text-text">
              Prêt à automatiser la facturation de votre micro-entreprise ?
            </h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              Bylz prend en charge le format Factur-X et les calculs de cotisations en 2 minutes par jour.
            </p>
            <div>
              <Link
                to="/essai"
                className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 px-5 py-2.5 rounded-full shadow-md"
              >
                <span>Tester en mode invité</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
