import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";
import { useToast } from "../ui/Toast";
import { createCatalogItem, updateCatalogItem } from "../../lib/api";
import type { CatalogItem, ItemNature } from "../../types/database";

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  item?: CatalogItem | null;
  onSaved?: (item: CatalogItem) => void;
}

export function CatalogModal({
  open,
  onClose,
  companyId,
  item,
  onSaved,
}: CatalogModalProps) {
  const { toast } = useToast();
  const isEdit = !!item;
  const [description, setDescription] = useState(item?.description || "");
  const [unitPrice, setUnitPrice] = useState(
    item ? String(item.unit_price) : ""
  );
  const [nature, setNature] = useState<ItemNature>(item?.nature || "service");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDescription(item?.description || "");
    setUnitPrice(item ? String(item.unit_price) : "");
    setNature(item?.nature || "service");
    setErrors({});
  }, [open, item]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = "Description requise";
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price <= 0) e.unitPrice = "Prix > 0 requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setPending(true);
    try {
      const payload = {
        description: description.trim(),
        unit_price: parseFloat(unitPrice),
        nature,
      };
      const saved = isEdit
        ? await updateCatalogItem(companyId, item!.id, payload)
        : await createCatalogItem(companyId, payload);
      toast(isEdit ? "Prestation mise à jour" : "Prestation créée", "success");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "danger");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier la prestation" : "Nouvelle prestation"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          placeholder="Ex. Prestation de conseil"
          required
        />
        <Input
          label="Prix unitaire"
          type="number"
          step="0.01"
          min="0.01"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          error={errors.unitPrice}
          placeholder="0,00"
          required
          leftIcon={<span className="text-sm">€</span>}
        />
        <div>
          <label className="text-sm font-semibold text-text mb-2 block">
            Nature
          </label>
          <div className="flex gap-3">
            {(["service", "goods"] as ItemNature[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNature(n)}
                className={cn(
                  "flex-1 border rounded-pill py-2 px-4 text-sm font-semibold transition-all duration-200",
                  nature === n
                    ? n === "service"
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-warning/40 bg-warning/10 text-warning"
                    : "border-border text-muted hover:text-text"
                )}
              >
                {n === "service" ? "Service" : "Marchandise"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            Détermine votre abattement fiscal et vos plafonds
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
