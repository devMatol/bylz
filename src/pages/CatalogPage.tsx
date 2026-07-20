import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/shared/EmptyState";
import { SearchInput } from "../components/shared/SearchInput";
import { Amount } from "../components/shared/Amount";
import { CatalogModal } from "../components/documents/CatalogModal";
import { ConfirmModal } from "../components/documents/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useDebounce } from "../hooks/useDebounce";
import {
  fetchCatalog,
  deleteCatalogItem,
  catalogItemIsReferenced,
} from "../lib/api";
import type { CatalogItem } from "../types/database";

export function CatalogPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!company) return;
    try {
      setItems(await fetchCatalog(company.id, debounced));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
      setItems([]);
    }
  }, [company, debounced, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!company) return null;

  function openCreate() {
    setEditItem(null);
    setModalOpen(true);
  }
  function openEdit(item: CatalogItem) {
    setEditItem(item);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!company || !deleteItem) return;
    setDeleting(true);
    try {
      const referenced = await catalogItemIsReferenced(company.id, deleteItem.id);
      if (referenced) {
        toast("Cette prestation est utilisée dans des documents existants.", "danger");
        setDeleteItem(null);
        return;
      }
      await deleteCatalogItem(company.id, deleteItem.id);
      toast("Prestation supprimée", "success");
      setDeleteItem(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageContainer
      title="Catalogue"
      subtitle="Vos prestations et produits"
      actions={
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreate}
        >
          Nouvelle prestation
        </Button>
      }
    >
      <div className="max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une prestation…" />
      </div>

      {items === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="7rem" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Catalogue vide"
          description="Ajoutez vos prestations et produits pour réutiliser dans vos factures."
          ctaLabel="Ajouter un article"
          onCta={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group border border-border rounded-card p-4 flex flex-col gap-2 hover:border-primary/40 transition-all duration-200 relative"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-text flex-1">{item.description}</p>
                <Badge
                  variant={item.nature === "goods" ? "warning" : "primary"}
                >
                  {item.nature === "goods" ? "Marchandise" : "Service"}
                </Badge>
              </div>
              <Amount value={Number(item.unit_price)} size="lg" />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="p-1.5 rounded bg-surface-hover text-muted hover:text-text"
                  aria-label="Modifier"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteItem(item)}
                  className="p-1.5 rounded bg-surface-hover text-muted hover:text-danger"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CatalogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={company.id}
        item={editItem}
        onSaved={() => void load()}
      />
      <ConfirmModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Supprimer la prestation"
        message={`Supprimer « ${deleteItem?.description} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
      />
    </PageContainer>
  );
}
