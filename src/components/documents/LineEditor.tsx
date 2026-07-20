import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Plus, Trash2, GripVertical, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CatalogItem, ItemNature } from "../../types/database";
import type { LineInput } from "../../lib/api";
import { formatAmount } from "../../lib/utils";

interface LineEditorProps {
  lines: LineInput[];
  onChange: (lines: LineInput[]) => void;
  catalog: CatalogItem[];
}

export function LineEditor({ lines, onChange, catalog }: LineEditorProps) {
  function update(idx: number, patch: Partial<LineInput>) {
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function remove(idx: number) {
    onChange(lines.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([
      ...lines,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        nature: "service",
        position: lines.length,
      },
    ]);
  }
  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= lines.length) return;
    const copy = [...lines];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy.map((l, i) => ({ ...l, position: i })));
  }

  return (
    <div className="flex flex-col">
      {/* Header row (desktop only, ≥1024px) */}
      <div className="hidden lg:grid w-full grid-cols-[20px_minmax(180px,1fr)_64px_100px_80px_96px_28px] gap-2 px-1 pb-2 text-xs font-semibold text-muted uppercase tracking-wide" style={{ letterSpacing: "0.04em" }}>
        <span />
        <span>Description</span>
        <span className="text-center">Qté</span>
        <span className="text-right">P.U. HT</span>
        <span className="text-center">Nature</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      {lines.map((line, idx) => (
        <LineRow
          key={idx}
          line={line}
          catalog={catalog}
          onChange={(patch) => update(idx, patch)}
          onRemove={() => remove(idx)}
          onUp={() => move(idx, -1)}
          onDown={() => move(idx, 1)}
          canUp={idx > 0}
          canDown={idx < lines.length - 1}
        />
      ))}

      <button
        type="button"
        onClick={add}
        className="mt-3 border-2 border-dashed border-border rounded-card py-3 text-sm text-muted hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter une ligne
      </button>
    </div>
  );
}

interface LineRowProps {
  line: LineInput;
  catalog: CatalogItem[];
  onChange: (patch: Partial<LineInput>) => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  canUp: boolean;
  canDown: boolean;
}

function LineRow({
  line,
  catalog,
  onChange,
  onRemove,
  onUp,
  onDown,
  canUp,
  canDown,
}: LineRowProps) {
  const [showCombo, setShowCombo] = useState(false);
  const [query, setQuery] = useState("");
  const comboRef = useRef<HTMLDivElement>(null);
  const total = line.quantity * line.unit_price;

  useEffect(() => {
    if (!showCombo) return;
    function onClick(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setShowCombo(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showCombo]);

  const filtered = query
    ? catalog.filter((c) =>
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : catalog;

  function selectCatalogItem(c: CatalogItem) {
    onChange({
      catalog_item_id: c.id,
      description: c.description,
      unit_price: Number(c.unit_price),
      nature: c.nature,
    });
    setShowCombo(false);
    setQuery("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && showCombo && filtered.length > 0) {
      e.preventDefault();
      selectCatalogItem(filtered[0]);
    }
  }

  return (
    <>
      {/* Desktop: single-row grid (≥1024px) */}
      <div className="hidden lg:grid w-full grid-cols-[20px_minmax(180px,1fr)_64px_100px_80px_96px_28px] gap-2 items-center py-4 border-t border-border">
        {/* Drag handle */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={onUp}
            disabled={!canUp}
            className="text-muted hover:text-text disabled:opacity-30 transition-colors"
            aria-label="Monter"
          >
            <GripVertical className="w-3.5 h-3.5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={onDown}
            disabled={!canDown}
            className="text-muted hover:text-text disabled:opacity-30 transition-colors"
            aria-label="Descendre"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Description combobox */}
        <div ref={comboRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={line.description}
              onChange={(e) => {
                onChange({ description: e.target.value, catalog_item_id: null });
                setQuery(e.target.value);
                setShowCombo(true);
              }}
              onFocus={() => setShowCombo(true)}
              onKeyDown={onKeyDown}
              placeholder="Description ou rechercher…"
              className="w-full h-9 rounded bg-bg border border-border pl-8 pr-3 text-sm text-text placeholder:text-muted input-focus"
            />
          </div>
          {showCombo && (
            <div className="absolute z-30 mt-1 w-full bg-surface border border-border rounded-card shadow-lg max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted">
                  Aucune prestation trouvée
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCatalogItem(c)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-hover flex justify-between items-center"
                  >
                    <span className="text-sm text-text truncate">
                      {c.description}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      {formatAmount(Number(c.unit_price))}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Qté */}
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={line.quantity}
          onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
          className="w-full h-9 rounded bg-bg border border-border px-2 text-sm text-text text-right tabular-nums input-focus"
        />

        {/* P.U. HT */}
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            value={line.unit_price}
            onChange={(e) => onChange({ unit_price: parseFloat(e.target.value) || 0 })}
            className="w-full h-9 rounded bg-bg border border-border px-2 pr-5 text-sm text-text text-right tabular-nums input-focus"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">€</span>
        </div>

        {/* Nature badge */}
        <NatureBadge nature={line.nature} locked={!!line.catalog_item_id} onChange={(n) => onChange({ nature: n })} />

        {/* Total */}
        <span
          className={cn(
            "text-sm tabular-nums text-right font-semibold overflow-hidden text-ellipsis whitespace-nowrap",
            total > 0 ? "text-text" : "text-muted"
          )}
        >
          {formatAmount(total)}
        </span>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="text-muted hover:text-danger transition-colors flex items-center justify-center"
          aria-label="Supprimer la ligne"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile: card layout (<1024px) */}
      <div className="lg:hidden border-t border-border py-4 flex flex-col gap-3">
        <div ref={comboRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={line.description}
              onChange={(e) => {
                onChange({ description: e.target.value, catalog_item_id: null });
                setQuery(e.target.value);
                setShowCombo(true);
              }}
              onFocus={() => setShowCombo(true)}
              onKeyDown={onKeyDown}
              placeholder="Description ou rechercher…"
              className="w-full h-9 rounded bg-bg border border-border pl-8 pr-3 text-sm text-text placeholder:text-muted input-focus"
            />
          </div>
          {showCombo && (
            <div className="absolute z-30 mt-1 w-full bg-surface border border-border rounded-card shadow-lg max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted">
                  Aucune prestation trouvée
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCatalogItem(c)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-hover flex justify-between items-center"
                  >
                    <span className="text-sm text-text truncate">
                      {c.description}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      {formatAmount(Number(c.unit_price))}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MobileField label="Qté">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={line.quantity}
              onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
              className="w-full h-9 rounded bg-bg border border-border px-2 text-sm text-text text-right tabular-nums input-focus"
            />
          </MobileField>
          <MobileField label="P.U. HT">
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={line.unit_price}
                onChange={(e) => onChange({ unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full h-9 rounded bg-bg border border-border px-2 pr-5 text-sm text-text text-right tabular-nums input-focus"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">€</span>
            </div>
          </MobileField>
          <MobileField label="Nature">
            <NatureBadge nature={line.nature} locked={!!line.catalog_item_id} onChange={(n) => onChange({ nature: n })} />
          </MobileField>
          <MobileField label="Total">
            <span
              className={cn(
                "h-9 flex items-center justify-end text-sm tabular-nums font-semibold",
                total > 0 ? "text-text" : "text-muted"
              )}
            >
              {formatAmount(total)}
            </span>
          </MobileField>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onUp}
              disabled={!canUp}
              className="p-1.5 rounded bg-surface-hover text-muted hover:text-text disabled:opacity-30 transition-colors"
              aria-label="Monter"
            >
              <GripVertical className="w-3.5 h-3.5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={onDown}
              disabled={!canDown}
              className="p-1.5 rounded bg-surface-hover text-muted hover:text-text disabled:opacity-30 transition-colors"
              aria-label="Descendre"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded bg-surface-hover text-muted hover:text-danger transition-colors"
            aria-label="Supprimer la ligne"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function MobileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

function NatureBadge({
  nature,
  locked,
  onChange,
}: {
  nature: ItemNature;
  locked: boolean;
  onChange: (n: ItemNature) => void;
}) {
  const isService = nature === "service";
  const base = "rounded-full h-7 px-3 text-xs font-medium flex items-center justify-center transition-colors";
  const color = isService
    ? "text-[var(--accent)]"
    : "text-[var(--warning)]";
  const bg = isService
    ? "color-mix(in srgb, var(--accent) 15%, transparent)"
    : "color-mix(in srgb, var(--warning) 15%, transparent)";
  const label = isService ? "Service" : "March.";
  if (locked) {
    return (
      <span className={cn(base, color)} style={{ backgroundColor: bg }}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onChange(isService ? "goods" : "service")}
      title="Cliquer pour changer : Service ↔ Marchandise"
      className={cn(base, color, "cursor-pointer hover:opacity-80")}
      style={{ backgroundColor: bg }}
    >
      {label}
    </button>
  );
}
