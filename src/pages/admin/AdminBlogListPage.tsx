import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Tag,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { fetchAdminBlogPosts, deleteBlogPost } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import type { BlogPost } from "../../types/database";
import { BLOG_ARTICLES } from "../../data/blogArticles";

export function AdminBlogListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const handleForceSyncGoogleAndIndex = async () => {
    setSyncingGsc(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("fetch-gsc-data");
      if (error) throw error;

      const count = res?.indexing?.submittedCount || res?.indexing?.urlsCount || res?.indexing?.totalUrls || 0;
      toast(
        `⚡ Synchro Google Search réussie ! ${count > 0 ? `${count} pages soumises à l'indexation Google & Sitemaps pingés.` : "Sitemaps pingés et synchronisation effectuée."}`,
        "success"
      );
    } catch (err: any) {
      console.error("GSC Sync Error:", err);
      toast(err.message || "Erreur lors de la synchronisation Google", "danger");
    } finally {
      setSyncingGsc(false);
    }
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const dbPosts = await fetchAdminBlogPosts();
      if (dbPosts.length > 0) {
        setPosts(dbPosts);
      } else {
        // Map initial static articles for admin viewing if DB is empty
        const initialMapped: BlogPost[] = BLOG_ARTICLES.map((a, idx) => ({
          id: `static-${idx}`,
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          content: a.content,
          category: a.category,
          read_time: a.readTime,
          author: a.author,
          status: "published",
          keywords: [a.category],
          views: 0,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setPosts(initialMapped);
      }
    } catch (err: any) {
      toast(err.message || "Erreur de chargement des articles", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer définitivement l'article "${title}" ?`)) return;
    try {
      if (id.startsWith("static-")) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        await deleteBlogPost(id);
        void loadPosts();
      }
      toast("Article supprimé avec succès", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la suppression", "danger");
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ? true : statusFilter === "published" ? p.status === "published" : p.status === "draft";
    return matchSearch && matchStatus;
  });

  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-primary" />
            <span>Gestion du Blog & Contenu SEO</span>
          </h1>
          <p className="text-sm text-muted">
            Rédigez, générez avec l'IA et publiez des articles optimisés pour le référencement naturel (SEO).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleForceSyncGoogleAndIndex}
            disabled={syncingGsc}
            className="bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-bold"
            leftIcon={<RefreshCw className={cn("w-4 h-4 text-amber-400", syncingGsc && "animate-spin")} />}
          >
            {syncingGsc ? "Synchro & Indexation..." : "⚡ Synchro Google & Indexer"}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/admin/blog/editor")}
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="bylz-glow-cta"
          >
            Générer un article IA / SEO
          </Button>
        </div>
      </div>



      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Articles Publiés</p>
            <p className="text-2xl font-black text-text">{publishedCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Brouillons en Cours</p>
            <p className="text-2xl font-black text-text">{draftCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Vues Cumulées Blog</p>
            <p className="text-2xl font-black text-text">{totalViews.toLocaleString("fr-FR")}</p>
          </div>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            placeholder="Rechercher par titre, catégorie, mot-clé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={statusFilter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Tous ({posts.length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "published" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("published")}
          >
            Publiés ({publishedCount})
          </Button>
          <Button
            type="button"
            variant={statusFilter === "draft" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("draft")}
          >
            Brouillons ({draftCount})
          </Button>
        </div>
      </Card>

      {/* Articles Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Chargement des articles...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted mx-auto" />
            <p className="text-base font-bold text-text">Aucun article trouvé</p>
            <p className="text-xs text-muted">Ajustez vos filtres ou créez votre premier article SEO.</p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate("/admin/blog/editor")}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nouveau Article
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover text-[11px] font-bold text-muted uppercase tracking-wider">
                  <th className="px-6 py-3.5">Article & Titre</th>
                  <th className="px-6 py-3.5">Catégorie</th>
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5">Score SEO</th>
                  <th className="px-6 py-3.5">Vues</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text line-clamp-1">{post.title}</div>
                      <div className="text-[11px] text-muted font-mono mt-0.5">/blog/{post.slug}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-primary/10 text-brand-primary font-semibold">
                        <Tag className="w-3 h-3" /> {post.category}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {post.status === "published" ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Publié
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1">
                          <Clock className="w-3 h-3" /> Brouillon
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-border rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              (post.seo_score || 85) >= 80
                                ? "bg-emerald-500"
                                : (post.seo_score || 85) >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${post.seo_score || 85}%` }}
                          />
                        </div>
                        <span className="font-bold text-text text-[11px]">{post.seo_score || 85}/100</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-text">
                      <span className="flex items-center gap-1 text-muted">
                        <Eye className="w-3.5 h-3.5" /> {(post.views || 0).toLocaleString("fr-FR")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-border transition-colors"
                          title="Voir sur le site public"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/blog/editor?id=${post.id}`)}
                          className="p-1.5 text-brand-primary"
                          title="Éditer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
