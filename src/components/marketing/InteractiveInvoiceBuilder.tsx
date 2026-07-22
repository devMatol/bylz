import { useState } from "react";
import { Plus, Trash2, Check, FileText, Sparkles, Building2 } from "lucide-react";

export function InteractiveInvoiceBuilder() {
  const [items, setItems] = useState([
    { id: 1, label: "Développement Front-End", qty: 2, price: 450 },
    { id: 2, label: "Design Système & UI Kit", qty: 1, price: 600 },
  ]);

  const [clientSiret, setClientSiret] = useState("892 419 203 00018");
  const [clientFound, setClientFound] = useState(true);

  const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);

  const addItem = () => {
    const newId = Date.now();
    setItems((prev) => [
      ...prev,
      { id: newId, label: "Option Audit & Intégration", qty: 1, price: 300 },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="bg-surface/90 backdrop-blur-xl border border-white/10 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 glow-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-text text-sm sm:text-base">Générateur Factur-X en direct</h3>
            <p className="text-xs text-text/70">Ajoutez des prestations pour calculer le total instantanément</p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 hidden sm:inline-block">
          Interactif
        </span>
      </div>

      {/* Siret Lookup Simulation */}
      <div className="p-3.5 rounded-2xl bg-surface-hover/80 border border-border space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-text flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-brand-primary" /> Recherche Client SIRET
          </span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> API Insee Connecté
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={clientSiret}
            onChange={(e) => setClientSiret(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 font-mono text-xs text-text font-semibold focus:outline-none focus:border-brand-primary"
            placeholder="Entrez un SIRET..."
          />
          <span className="bg-brand-primary/15 text-brand-primary font-bold px-3 py-2 rounded-xl text-[11px]">
            Acme France SAS
          </span>
        </div>
      </div>

      {/* Dynamic Line Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-text/70 px-1">
          <span>Articles / Prestations</span>
          <span>Montant HT</span>
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border/80 shadow-sm gap-2 text-xs"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text truncate">{item.label}</p>
              <p className="text-[11px] text-text/60 font-mono">
                {item.qty} × {item.price} €
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-text text-sm">
                {(item.qty * item.price).toLocaleString("fr-FR")} €
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-lg text-text/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full py-2.5 rounded-xl border border-dashed border-brand-primary/50 text-brand-primary text-xs font-bold hover:bg-brand-primary/10 transition-colors flex items-center justify-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une ligne de prestation</span>
        </button>
      </div>

      {/* Total Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-primary/15 via-indigo-500/15 to-brand-accent/15 border border-brand-primary/30 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-text">Total Net à Payer (Factur-X)</p>
          <p className="text-[11px] text-emerald-500 font-semibold">Mention 293 B du CGI appliquée</p>
        </div>
        <p className="text-2xl font-black text-brand-primary font-mono tracking-tight">
          {total.toLocaleString("fr-FR")} €
        </p>
      </div>
    </div>
  );
}
