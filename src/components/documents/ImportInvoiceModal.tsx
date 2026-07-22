import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Building,
  Check,
  X
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { supabase } from "../../lib/supabase";
import { saveInvoice, fetchClients } from "../../lib/api";
import { todayISO } from "../../lib/date";
import type { Client } from "../../types/database";

interface ImportInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to dynamically load PDF.js from cdnjs
async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Convert DD/MM/YYYY or similar to YYYY-MM-DD
function parseFrenchDate(dateStr: string): string {
  const parts = dateStr.split(/[/\-.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      // DD/MM/YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    } else if (parts[0].length === 4) {
      // YYYY/MM/DD -> YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  return "";
}

export function ImportInvoiceModal({ open, onClose, onSuccess }: ImportInvoiceModalProps) {
  const { company } = useAuth();
  const { toast } = useToast();
  
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalHt, setTotalHt] = useState("0");
  const [totalTtc, setTotalTtc] = useState("0");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  // New Client creation variables (if SIRET lookup succeeds)
  const [detectedSiret, setDetectedSiret] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [shouldCreateClient, setShouldCreateClient] = useState(false);
  const [lookingUpSiret, setLookingUpSiret] = useState(false);

  useEffect(() => {
    if (open && company) {
      void loadClients();
    }
  }, [open, company]);

  const loadClients = async () => {
    if (!company) return;
    try {
      const cls = await fetchClients(company.id);
      setClients(cls as Client[]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast("Veuillez déposer un fichier PDF valide.", "danger");
      return;
    }

    setAnalyzing(true);
    setPdfUrl(URL.createObjectURL(file));

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map((item: any) => item.str);
        fullText += strings.join(" ") + "\n";
      }

      console.log("Extracted PDF Text:", fullText);
      parseInvoiceText(fullText);
    } catch (err: any) {
      console.error(err);
      toast("Erreur lors de la lecture du fichier PDF.", "danger");
      setAnalyzing(false);
    }
  };

  const parseInvoiceText = (text: string) => {
    // 1. Detect SIRET
    const siretMatch = text.replace(/[\s\-_]/g, "").match(/\b\d{14}\b/);
    if (siretMatch) {
      const siret = siretMatch[0];
      setDetectedSiret(siret);
      void lookupClientSiret(siret);
    }

    // 2. Detect Invoice Number
    const numMatch = text.match(/(?:facture|invoice|n°|numéro)\s*[:#\-]?\s*([A-Z0-9\-_]{3,20})/i);
    if (numMatch && numMatch[1]) {
      setInvoiceNumber(numMatch[1]);
    }

    // 3. Detect Dates
    const dateMatches = text.match(/\b\d{2}[/\-.]\d{2}[/\-.]\d{4}\b/g);
    if (dateMatches && dateMatches.length >= 1) {
      const firstDate = parseFrenchDate(dateMatches[0]);
      setIssueDate(firstDate);
      if (dateMatches.length >= 2) {
        const secondDate = parseFrenchDate(dateMatches[1]);
        setDueDate(secondDate);
      }
    }

    // 4. Detect Amounts (TTC / HT)
    // Find all decimal numbers
    const amtMatches = text.match(/\b\d+[\.,]\d{2}\b/g);
    if (amtMatches) {
      const numbers = amtMatches
        .map((m) => parseFloat(m.replace(",", ".")))
        .filter((n) => n > 0 && n < 1000000); // Filter out ZIP codes or phone numbers disguised as decimals

      if (numbers.length > 0) {
        const maxAmt = Math.max(...numbers);
        setTotalTtc(maxAmt.toFixed(2));
        
        // Find if there is a second largest amount for HT, or calculate default (HT = TTC)
        const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => b - a);
        if (uniqueNumbers.length > 1) {
          setTotalHt(uniqueNumbers[1].toFixed(2));
        } else {
          setTotalHt(maxAmt.toFixed(2));
        }
      }
    }

    setAnalyzing(false);
  };

  const lookupClientSiret = async (siret: string) => {
    setLookingUpSiret(true);
    try {
      // First, check if a client with this SIRET already exists in base
      const existing = clients.find((c) => c.siret === siret);
      if (existing) {
        setClientId(existing.id);
        setShouldCreateClient(false);
        setLookingUpSiret(false);
        return;
      }

      // If not, perform API lookup
      const { data: json, error } = await supabase.functions.invoke("siret-lookup", {
        body: { siret },
      });
      if (error || !json) throw new Error(error?.message || "SIRET introuvable.");

      setNewClientName(json.legal_name || "");
      setNewClientAddress(json.address || "");
      setShouldCreateClient(true);
    } catch (e) {
      console.error("Siret lookup failed:", e);
    } finally {
      setLookingUpSiret(false);
    }
  };

  const handleSaveImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    try {
      let finalClientId = clientId;

      // Create new client if selected/suggested
      if (shouldCreateClient && newClientName) {
        const { data: created, error } = await supabase
          .from("clients")
          .insert({
            company_id: company.id,
            name: newClientName,
            type: "b2b",
            siret: detectedSiret || null,
            siren: detectedSiret ? detectedSiret.slice(0, 9) : null,
            address: newClientAddress || null,
          })
          .select("*")
          .single();

        if (error) throw error;
        finalClientId = created.id;
      }

      if (!finalClientId) {
        toast("Veuillez sélectionner ou créer un client.", "warning");
        setSaving(false);
        return;
      }

      const amtHt = parseFloat(totalHt) || 0;
      const amtTtc = parseFloat(totalTtc) || 0;

      // Save imported invoice to Supabase
      const saved = await saveInvoice(company.id, {
        client_id: finalClientId,
        issue_date: issueDate || todayISO(),
        due_date: dueDate || issueDate || todayISO(),
        payment_terms: "30d",
        note: "Facture historique importée",
        lines: [
          {
            description: `Importation Facture historique ${invoiceNumber || ""}`,
            quantity: 1,
            unit_price: amtHt,
            nature: "service",
            position: 0,
          },
        ],
      });

      // Automatically transition imported invoice to "paid" status with full paid amount and the correct invoice number
      await supabase
        .from("invoices")
        .update({
          number: invoiceNumber || `IMP-${Date.now().toString().slice(-6)}`,
          status: "paid",
          paid_at: issueDate || todayISO(),
          paid_amount: amtTtc,
          payment_method: "transfer",
        })
        .eq("id", saved.id);

      toast("Facture importée et marquée comme payée !", "success");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast(err.message || "Erreur lors de l'enregistrement de la facture", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Clear states
    setPdfUrl(null);
    setInvoiceNumber("");
    setIssueDate("");
    setDueDate("");
    setTotalHt("0");
    setTotalTtc("0");
    setClientId("");
    setDetectedSiret("");
    setNewClientName("");
    setNewClientAddress("");
    setShouldCreateClient(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importer des factures historiques"
      className={pdfUrl ? "max-w-4xl h-[85vh] flex flex-col p-6" : "max-w-md p-6"}
    >
      {!pdfUrl ? (
        /* Drag & Drop Step */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors min-h-[220px] ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/55 bg-surface-hover/30"
          }`}
          onClick={() => document.getElementById("file-import-input")?.click()}
        >
          <input
            id="file-import-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {analyzing ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-semibold text-text">Lecture et analyse locale du PDF...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text">Glissez-déposez votre facture PDF ici</p>
                <p className="text-xs text-muted">Ou cliquez pour parcourir vos fichiers (Max 10Mo)</p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Split Screen Editor Step */
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden mt-2">
          {/* Left panel: PDF viewer */}
          <div className="flex-1 border border-border rounded-card bg-surface-hover/50 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b border-border bg-surface text-xs text-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5" /> Aperçu du document
              </span>
              <button
                onClick={() => setPdfUrl(null)}
                className="hover:text-text p-1 rounded hover:bg-surface"
                title="Remplacer le fichier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe src={pdfUrl} className="flex-1 w-full border-none h-full" />
          </div>

          {/* Right panel: Validation Form */}
          <div className="w-full md:w-[380px] flex flex-col h-full justify-between">
            <form onSubmit={handleSaveImport} className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="border border-border bg-surface-hover/20 rounded-card p-3.5 space-y-3">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Client</h4>
                
                {lookingUpSiret ? (
                  <div className="flex items-center gap-2 text-xs text-muted py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Recherche des informations du SIRET...</span>
                  </div>
                ) : shouldCreateClient ? (
                  /* Create new client card */
                  <div className="p-3 border border-primary/20 bg-primary/5 rounded space-y-2">
                    <div className="flex items-start gap-2">
                      <Building className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-text">Nouveau client détecté</p>
                        <p className="text-[11px] text-muted">{newClientName}</p>
                        {detectedSiret && (
                          <p className="text-[10px] text-muted">SIRET: {detectedSiret}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
                      <input
                        type="checkbox"
                        id="create-client-check"
                        checked={shouldCreateClient}
                        onChange={(e) => setShouldCreateClient(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <label htmlFor="create-client-check" className="text-[11px] text-text font-semibold cursor-pointer">
                        Créer le client automatiquement
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Standard Client Select */
                  <Select
                    label="Associer à un client existant"
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setShouldCreateClient(false);
                    }}
                    required={!shouldCreateClient}
                  >
                    <option value="">Sélectionner un client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider border-b border-border pb-1">Facture</h4>

                <Input
                  label="Numéro de facture"
                  placeholder="ex: FAC-2026-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Date d'émission"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                  <Input
                    label="Échéance"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Total HT (€)"
                    type="number"
                    step="0.01"
                    value={totalHt}
                    onChange={(e) => setTotalHt(e.target.value)}
                    required
                  />
                  <Input
                    label="Total TTC (€)"
                    type="number"
                    step="0.01"
                    value={totalTtc}
                    onChange={(e) => setTotalTtc(e.target.value)}
                    required
                  />
                </div>
              </div>
            </form>

            {/* Actions panel */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-2 mt-4 bg-bg">
              <Button variant="outline" size="md" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={(e) => void handleSaveImport(e)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Importer la facture
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
