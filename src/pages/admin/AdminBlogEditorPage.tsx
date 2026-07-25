import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Globe,
  Eye,
  CheckCircle2,
  AlertCircle,
  Key,
  Layers,
  Image as ImageIcon,
  BookOpen,
  Send,
  HelpCircle,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import {
  SUGGESTED_KEYWORDS,
  analyzeArticleSeo,
  generateAiArticle,
  type KeywordIdea,
} from "../../lib/blogGenerator";
import { saveBlogPost, fetchAdminBlogPosts } from "../../lib/api";
import type { BlogPost, BlogPostStatus } from "../../types/database";

export function AdminBlogEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "ai">("ai");

  // Form states
  const [id, setId] = useState<string | null>(editId);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [category, setCategory] = useState("Législation & Conformité");
  const [readTime, setReadTime] = useState("5 min de lecture");
  const [author, setAuthor] = useState("Équipe Bylz");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState<BlogPostStatus>("draft");
  const [keywords, setKeywords] = useState<string[]>(["Factur-X 2026"]);
  const [content, setContent] = useState("");

  // AI Generator prompt state
  const [aiTopic, setAiTopic] = useState("");
  const [aiSelectedKw, setAiSelectedKw] = useState<KeywordIdea | null>(SUGGESTED_KEYWORDS[0]);

  // Load existing article if editing
  const loadArticle = useCallback(async () => {
    if (!editId) return;
    try {
      const posts = await fetchAdminBlogPosts();
      const match = posts.find((p) => p.id === editId);
      if (match) {
        setId(match.id);
        setTitle(match.title);
        setSlug(match.slug);
        setExcerpt(match.excerpt);
        setMetaDescription(match.meta_description || match.excerpt);
        setCategory(match.category);
        setReadTime(match.read_time);
        setAuthor(match.author);
        setCoverImageUrl(match.cover_image_url || "");
        setStatus(match.status);
        setKeywords(match.keywords || []);
        setContent(match.content);
        setActiveTab("edit");
      }
    } catch (err: any) {
      toast(err.message || "Impossible de charger l'article", "danger");
    }
  }, [editId, toast]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  // Real-time SEO analysis
  const seoAnalysis = analyzeArticleSeo({
    title,
    metaDescription,
    slug,
    content,
    keywords,
  });

  const handleSlugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!id && !slug) {
      setSlug(handleSlugify(val));
    }
  };

  const handleGenerateAi = () => {
    const targetTopic = aiTopic || aiSelectedKw?.keyword || "facturation électronique";
    const targetKw = aiSelectedKw?.keyword || "facturation";
    const targetCat = aiSelectedKw?.category || category;

    setGenerating(true);
    setTimeout(() => {
      const generated = generateAiArticle({
        topic: targetTopic,
        keyword: targetKw,
        category: targetCat,
      });

      setTitle(generated.title);
      setSlug(generated.slug);
      setExcerpt(generated.excerpt);
      setMetaDescription(generated.metaDescription);
      setCategory(generated.category);
      setReadTime(generated.readTime);
      setKeywords(generated.keywords);
      setContent(generated.content);

      setGenerating(false);
      setActiveTab("edit");
      toast("Article SEO généré avec succès par l'IA !", "success");
    }, 600);
  };

  const handleSave = async (targetStatus?: BlogPostStatus) => {
    const finalStatus = targetStatus || status;
    if (!title || !slug || !content) {
      toast("Veuillez remplir au moins le titre, le slug et le contenu.", "warning");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveBlogPost({
        ...(id ? { id } : {}),
        title,
        slug,
        excerpt: excerpt || title,
        content,
        category,
        read_time: readTime,
        author,
        cover_image_url: coverImageUrl || null,
        status: finalStatus,
        keywords,
        meta_description: metaDescription || excerpt,
        seo_score: seoAnalysis.score,
      });

      setId(saved.id);
      setStatus(saved.status);
      toast(finalStatus === "published" ? "Article publié sur le site public !" : "Brouillon sauvegardé !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la sauvegarde", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/blog")}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Retour
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-text flex items-center gap-2">
              <span>{id ? "Éditer l'Article SEO" : "Créateur & Générateur d'Articles SEO"}</span>
            </h1>
            <p className="text-xs text-muted">Optimisez vos mots-clés et générez des articles haute conversion.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave("draft")}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Sauvegarder Brouillon
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => handleSave("published")}
            loading={saving}
            leftIcon={<Globe className="w-4 h-4" />}
            className="bylz-glow-cta"
          >
            Publier sur le Blog
          </Button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>1. Générateur IA & Mots-clés SEO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "edit"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Éditeur de Contenu & Meta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>3. Aperçu en Direct</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-muted pr-2">
          <span>Score SEO :</span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-black text-white ${
              seoAnalysis.score >= 80 ? "bg-emerald-600" : seoAnalysis.score >= 50 ? "bg-amber-600" : "bg-rose-600"
            }`}
          >
            {seoAnalysis.score}/100
          </span>
        </div>
      </div>

      {/* TAB 1: AI Generator & Keyword Explorer */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Keyword Explorer Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-extrabold text-text flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <span>Opportunités de Mots-Clés SEO (Micro-Entreprise & Facturation)</span>
                </h3>
              </div>
              <p className="text-xs text-muted">
                Sélectionnez un mot-clé ci-dessous pour pré-configurer le sujet et générer un article ciblé.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_KEYWORDS.map((kwItem) => {
                  const isSelected = aiSelectedKw?.keyword === kwItem.keyword;
                  return (
                    <div
                      key={kwItem.keyword}
                      onClick={() => {
                        setAiSelectedKw(kwItem);
                        setCategory(kwItem.category);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-brand-primary bg-brand-primary/10 shadow-sm"
                          : "border-border hover:border-brand-primary/50 bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-text">{kwItem.keyword}</span>
                        <Badge variant={kwItem.difficulty === "Faible" ? "success" : "warning"}>
                          {kwItem.difficulty}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2">{kwItem.suggestedTitle}</p>
                      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted font-mono">
                        <span>Recherches: {kwItem.volume}</span>
                        <span>{kwItem.intent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Custom Prompt Box */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <span>Personnaliser le Sujet de l'Article par IA</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Sujet ou Question spécifique à traiter :
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Comment facturer la TVA au-delà des plafonds de 2026 ?"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleGenerateAi}
                  loading={generating}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  className="w-full bylz-glow-cta py-3 font-black text-sm"
                >
                  Générer l'Article Complet (Titre, Contenu, TOC, Meta tags & CTA)
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Sidebar: SEO Checklist Preview */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4 bg-surface-hover/30">
              <h4 className="text-xs font-extrabold text-text uppercase tracking-wider">
                Analyseur SEO & Recommandations
              </h4>

              <div className="space-y-2.5">
                {seoAnalysis.checks.map((chk, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-surface text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className={chk.passed ? "text-emerald-500" : "text-amber-500"}>{chk.label}</span>
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    {chk.recommendation && <p className="text-[11px] text-muted">{chk.recommendation}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Content & Meta Editor */}
      {activeTab === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Article Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-text">Informations de l'Article</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Titre de l'Article (H1 / SEO)</label>
                  <Input
                    type="text"
                    placeholder="Ex: Réforme Factur-X 2026 : Ce qui change pour les auto-entrepreneurs"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">Slug URL (Lien public)</label>
                    <Input
                      type="text"
                      placeholder="reforme-factur-x-2026"
                      value={slug}
                      onChange={(e) => setSlug(handleSlugify(e.target.value))}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">Catégorie</label>
                    <Select value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs">
                      <option value="Législation & Conformité">Législation & Conformité</option>
                      <option value="Fiscalité Micro-entreprise">Fiscalité Micro-entreprise</option>
                      <option value="Gestion & Cotisations">Gestion & Cotisations</option>
                      <option value="Facturation & Devis">Facturation & Devis</option>
                      <option value="Productivité & Outils">Productivité & Outils</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Extrait (Résumé de carte)</label>
                  <textarea
                    rows={2}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Bref résumé accrocheur affiché sur la liste du blog..."
                    className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Meta Description (Pour Google)
                  </label>
                  <textarea
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Description optimisée pour les résultats de recherche Google..."
                    className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono"
                  />
                  <p className="text-[10px] text-muted mt-1">Recommandé : entre 120 et 165 caractères.</p>
                </div>
              </div>
            </Card>

            {/* HTML / Markdown Content Editor */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-text">Corps de l'Article (HTML / Structured Content)</h3>
                <span className="text-xs text-muted font-mono">{seoAnalysis.wordCount} mots</span>
              </div>

              <textarea
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez ou éditez le contenu HTML de l'article (titres <h2>, balises <p>, <ul>, etc.)..."
                className="w-full p-4 text-xs font-mono bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-1 focus:ring-brand-primary leading-relaxed"
              />
            </Card>
          </div>

          {/* Right Sidebar Controls */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-text uppercase tracking-wider">Paramètres de Publication</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Statut</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                    className="text-xs"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Auteur</label>
                  <Input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Temps de lecture estimé</label>
                  <Input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">URL de l'image de couverture</label>
                  <Input
                    type="text"
                    placeholder="https://..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: Live Article Preview */}
      {activeTab === "preview" && (
        <Card className="p-8 max-w-4xl mx-auto space-y-8 bg-surface">
          {/* Header Preview */}
          <div className="space-y-4 border-b border-border pb-6">
            <div className="flex items-center space-x-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-bold">
                {category}
              </span>
              <span className="text-muted">{readTime}</span>
              <span className="text-muted">• Par {author}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-text leading-tight">{title || "Titre de l'article"}</h1>

            <p className="text-base text-muted italic">{excerpt || "Résumé de l'article..."}</p>
          </div>

          {/* Body Preview */}
          <div
            className="prose prose-invert max-w-none text-sm text-text leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted'>Aucun contenu rédigé...</p>" }}
          />
        </Card>
      )}
    </div>
  );
}
