import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Building,
  Check,
  X,
  Plus,
  Sparkles,
  Search
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

// Dynamically load PDF.js from cdnjs
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

// Helper: Convert any French / English / ISO date string to YYYY-MM-DD
function parseSmartDate(rawStr: string): string {
  if (!rawStr) return "";
  const cleaned = rawStr.trim().toLowerCase();

  // Month dictionary for French and English
  const monthMap: Record<string, string> = {
    janvier: "01", jan: "01", january: "01",
    février: "02", fevrier: "02", fev: "02", february: "02",
    mars: "03", mar: "03", march: "03",
    avril: "04", avr: "04", april: "04",
    mai: "05", may: "05",
    juin: "06", jun: "06", june: "06",
    juillet: "07", juil: "07", jul: "07", july: "07",
    août: "08", aout: "08", aug: "08", august: "08",
    septembre: "09", sep: "09", september: "09",
    octobre: "10", oct: "10", october: "10",
    novembre: "11", nov: "11", november: "11",
    décembre: "12", decembre: "12", dec: "12", december: "12"
  };

  // 1. Text date like "30 juin 2026" or "1er mai 2026" or "June 30, 2026"
  const textDateMatch = cleaned.match(/(\d{1,2})(?:er)?\s+([a-zàâäéèêëîïôöùûüç]+)\s+(\d{4})/i);
  if (textDateMatch) {
    const day = textDateMatch[1].padStart(2, "0");
    const month = monthMap[textDateMatch[2]] || "01";
    const year = textDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Standard DD/MM/YYYY or YYYY-MM-DD or DD.MM.YYYY
  const numericMatch = cleaned.match(/(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (numericMatch) {
    const p1 = numericMatch[1];
    const p2 = numericMatch[2].padStart(2, "0");
    const p3 = numericMatch[3].padStart(2, "0");

    if (p1.length === 4) {
      // YYYY-MM-DD
      return `${p1}-${p2}-${p3}`;
    } else if (p3.length === 4) {
      // DD/MM/YYYY
      return `${p3}-${p2}-${p1.padStart(2, "0")}`;
    }
  }

  return "";
}

// Clean money strings like "1 250,50 €" -> 1250.50
function parseFrenchAmount(amtStr: string): number {
  if (!amtStr) return 0;
  // Remove non-breaking spaces, spaces, currency symbols
  const sanitized = amtStr
    .replace(/[\s\u00a0\xa0€$£EUR]/g, "")
    .replace(/,/g, ".");
  const val = parseFloat(sanitized);
  return isNaN(val) ? 0 : val;
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
  const [totalHt, setTotalHt] = useState("0.00");
  const [totalTtc, setTotalTtc] = useState("0.00");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  // Client creation mode
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [detectedSiret, setDetectedSiret] = useState("");
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
      console.error("Error loading clients:", e);
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
      const textLines: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Sort text items by vertical Y coordinate then horizontal X coordinate for exact visual lines
        const items = textContent.items.map((item: any) => ({
          str: item.str,
          y: Math.round(item.transform[5]),
          x: Math.round(item.transform[4]),
        }));

        // Group by Y coordinate (lines)
        const lineGroups: Record<number, string[]> = {};
        for (const item of items) {
          if (!item.str.trim()) continue;
          // Find existing Y within 4px tolerance
          const existingY = Object.keys(lineGroups).find((y) => Math.abs(Number(y) - item.y) <= 4);
          const targetY = existingY ? Number(existingY) : item.y;
          if (!lineGroups[targetY]) lineGroups[targetY] = [];
          lineGroups[targetY].push(item.str);
        }

        // Sort lines from top to bottom
        const sortedY = Object.keys(lineGroups)
          .map(Number)
          .sort((a, b) => b - a);

        for (const y of sortedY) {
          const lineStr = lineGroups[y].join(" ");
          textLines.push(lineStr);
          fullText += lineStr + "\n";
        }
      }

      console.log("PDF Extracted Lines:", textLines);
      parseInvoiceText(fullText, textLines);
    } catch (err: any) {
      console.error("PDF Parsing Error:", err);
      toast("Erreur lors de la lecture du fichier PDF.", "danger");
      setAnalyzing(false);
    }
  };

  const parseInvoiceText = (fullText: string, lines: string[]) => {
    // Reset defaults
    let foundInvoiceNum = "";
    let foundIssueDate = "";
    let foundDueDate = "";
    let foundTotalTtc = 0;
    let foundTotalHt = 0;
    let matchedClientId = "";
    let detectedClientName = "";
    let siret = "";

    // 1. Detect SIRET
    const siretMatch = fullText.replace(/[\s\-_]/g, "").match(/\b\d{14}\b/);
    if (siretMatch) {
      siret = siretMatch[0];
      setDetectedSiret(siret);
      void lookupClientSiret(siret);
    }

    // 2. Client Auto-Matching against existing client list
    for (const c of clients) {
      if (c.name && c.name.length > 2 && fullText.toLowerCase().includes(c.name.toLowerCase())) {
        matchedClientId = c.id;
        break;
      }
    }

    // If no client matched in database, attempt extracting client name from text blocks
    if (!matchedClientId) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(?:client|facturé à|destinataire|doit|bill to)\s*[:]?/i.test(line)) {
          const cleanLine = line.replace(/(?:client|facturé à|destinataire|doit|bill to)\s*[:]?/i, "").trim();
          if (cleanLine.length > 2) {
            detectedClientName = cleanLine;
            break;
          } else if (i + 1 < lines.length && lines[i + 1].trim().length > 2) {
            detectedClientName = lines[i + 1].trim();
            break;
          }
        }
      }
    }

    // 3. Invoice Number Extraction (Multi-Pattern)
    const numPatterns = [
      /(?:facture|invoice|n°|numéro|réf|référence|document)\s*[:#\-]?\s*([A-Z0-9\-_]{3,25})/i,
      /\b([A-Z]{2,4}[-_\s]?\d{4}[-_\s]?\d{2,6})\b/i,
      /\b(FAC[-_\s]?\d{4}[-_\s]?\d{2,6})\b/i,
      /\b(INV[-_\s]?\d{4}[-_\s]?\d{2,6})\b/i,
      /\bN°\s*[:]?\s*([A-Z0-9\-_]{3,20})\b/i,
    ];

    for (const pattern of numPatterns) {
      const m = fullText.match(pattern);
      if (m && m[1] && m[1].length >= 3) {
        foundInvoiceNum = m[1].trim();
        break;
      }
    }

    // 4. Date Extraction (Issue & Due Date)
    // Find dates preceded by keywords
    for (const line of lines) {
      if (/(?:date|émission|émise|facturée|du)\s*[:]?/i.test(line) && !foundIssueDate) {
        const d = parseSmartDate(line);
        if (d) foundIssueDate = d;
      }
      if (/(?:échéance|payable|au|règlement)\s*[:]?/i.test(line) && !foundDueDate) {
        const d = parseSmartDate(line);
        if (d) foundDueDate = d;
      }
    }

    // Fallback date scan across entire text
    if (!foundIssueDate) {
      const allDates = fullText.match(/\b(?:\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}|\d{1,2}\s+[a-zàâäéèêëîïôöùûüç]+\s+\d{4})\b/gi);
      if (allDates && allDates.length >= 1) {
        foundIssueDate = parseSmartDate(allDates[0]);
        if (allDates.length >= 2 && !foundDueDate) {
          foundDueDate = parseSmartDate(allDates[1]);
        }
      }
    }

    // 5. Amount Extraction (Total TTC & Total HT)
    // Context-aware regex scanning for Total TTC
    const ttcPatterns = [
      /(?:total\s*ttc|net\s*à\s*payer|total\s*à\s*payer|montant\s*ttc|total\s*général\s*ttc|total\s*du)\s*[:]?\s*([\d\s\u00a0.,]+(?:\s*€|\s*eur)?)/i,
      /(?:total|net\s*payer)\s*[:]?\s*([\d\s\u00a0.,]+(?:\s*€|\s*eur)?)/i,
    ];

    for (const p of ttcPatterns) {
      const m = fullText.match(p);
      if (m && m[1]) {
        const parsed = parseFrenchAmount(m[1]);
        if (parsed > 0) {
          foundTotalTtc = parsed;
          break;
        }
      }
    }

    // Context-aware regex scanning for Total HT
    const htPatterns = [
      /(?:total\s*ht|montant\s*ht|sous-total\s*ht|net\s*ht|hors\s*taxe|total\s*hors\s*taxe)\s*[:]?\s*([\d\s\u00a0.,]+(?:\s*€|\s*eur)?)/i,
    ];

    for (const p of htPatterns) {
      const m = fullText.match(p);
      if (m && m[1]) {
        const parsed = parseFrenchAmount(m[1]);
        if (parsed > 0) {
          foundTotalHt = parsed;
          break;
        }
      }
    }

    // Fallback: If amounts not captured by label keywords, find all decimal numbers
    if (foundTotalTtc === 0) {
      const decimalMatches = fullText.match(/\b\d+(?:[\s\u00a0]\d{3})*(?:[.,]\d{2})\b/g);
      if (decimalMatches) {
        const nums = decimalMatches
          .map(parseFrenchAmount)
          .filter((n) => n > 0 && n < 1000000);
        if (nums.length > 0) {
          foundTotalTtc = Math.max(...nums);
          const sorted = Array.from(new Set(nums)).sort((a, b) => b - a);
          if (sorted.length > 1 && foundTotalHt === 0) {
            foundTotalHt = sorted[1];
          }
        }
      }
    }

    if (foundTotalHt === 0 && foundTotalTtc > 0) {
      foundTotalHt = foundTotalTtc;
    }

    // 6. Apply extracted values to state
    if (foundInvoiceNum) setInvoiceNumber(foundInvoiceNum);
    if (foundIssueDate) setIssueDate(foundIssueDate);
    if (foundDueDate) setDueDate(foundDueDate);
    else if (foundIssueDate) setDueDate(foundIssueDate);

    setTotalHt(foundTotalHt.toFixed(2));
    setTotalTtc(foundTotalTtc.toFixed(2));

    if (matchedClientId) {
      setClientId(matchedClientId);
      setIsCreatingNewClient(false);
    } else if (detectedClientName) {
      setIsCreatingNewClient(true);
      setNewClientName(detectedClientName);
    }

    setAnalyzing(false);
  };

  const lookupClientSiret = async (siret: string) => {
    setLookingUpSiret(true);
    try {
      const existing = clients.find((c) => c.siret === siret);
      if (existing) {
        setClientId(existing.id);
        setIsCreatingNewClient(false);
        setLookingUpSiret(false);
        return;
      }

      const { data: json, error } = await supabase.functions.invoke("siret-lookup", {
        body: { siret },
      });
      if (error || !json) throw new Error(error?.message || "SIRET introuvable.");

      setNewClientName(json.legal_name || "");
      setNewClientAddress(json.address || "");
      setIsCreatingNewClient(true);
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

      // Create new client automatically if creation mode is active
      if (isCreatingNewClient && newClientName.trim()) {
        const { data: created, error } = await supabase
          .from("clients")
          .insert({
            company_id: company.id,
            name: newClientName.trim(),
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
        toast("Veuillez sélectionner ou saisir un client.", "warning");
        setSaving(false);
        return;
      }

      const amtHt = parseFloat(totalHt) || 0;
      const amtTtc = parseFloat(totalTtc) || 0;

      // Save imported invoice to database
      const saved = await saveInvoice(company.id, {
        client_id: finalClientId,
        issue_date: issueDate || todayISO(),
        due_date: dueDate || issueDate || todayISO(),
        payment_terms: "30d",
        note: "Facture historique importée",
        lines: [
          {
            description: `Importation Facture historique ${invoiceNumber || ""}`.trim(),
            quantity: 1,
            unit_price: amtHt,
            nature: "service",
            position: 0,
          },
        ],
      });

      // Update imported invoice status to paid
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
    setPdfUrl(null);
    setInvoiceNumber("");
    setIssueDate("");
    setDueDate("");
    setTotalHt("0.00");
    setTotalTtc("0.00");
    setClientId("");
    setDetectedSiret("");
    setNewClientName("");
    setNewClientAddress("");
    setIsCreatingNewClient(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importer des factures historiques"
      className={pdfUrl ? "max-w-5xl h-[88vh] flex flex-col p-6" : "max-w-md p-6"}
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
              <p className="text-sm font-semibold text-text">Analyse IA et extraction du PDF en cours...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text">Glissez-déposez n'importe quelle facture PDF ici</p>
                <p className="text-xs text-muted">
                  Lecture intelligente automatique : numéro, dates, montants et client
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Split Screen Editor Step */
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden mt-2">
          {/* Left panel: PDF viewer */}
          <div className="flex-1 border border-border rounded-card bg-surface-hover/50 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-2.5 border-b border-border bg-surface text-xs text-muted">
              <span className="flex items-center gap-1.5 font-bold text-text">
                <FileText className="w-4 h-4 text-primary" /> Aperçu du document PDF
              </span>
              <button
                type="button"
                onClick={() => setPdfUrl(null)}
                className="hover:text-text p-1 rounded hover:bg-surface-hover transition-colors"
                title="Remplacer le fichier PDF"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe src={pdfUrl} className="flex-1 w-full border-none h-full" />
          </div>

          {/* Right panel: Validation Form */}
          <div className="w-full md:w-[400px] flex flex-col h-full justify-between">
            <form onSubmit={handleSaveImport} className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Client Selection / Creation Section */}
              <div className="border border-border bg-surface-hover/20 rounded-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Client Destinataire</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewClient(!isCreatingNewClient);
                      if (!isCreatingNewClient) setClientId("");
                    }}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    {isCreatingNewClient ? "Choisir un client existant" : "+ Nouveau client"}
                  </button>
                </div>

                {lookingUpSiret ? (
                  <div className="flex items-center gap-2 text-xs text-muted py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Recherche SIRET en cours...</span>
                  </div>
                ) : isCreatingNewClient ? (
                  /* Create New Client Inline Form */
                  <div className="p-3 border border-primary/30 bg-primary/5 rounded-card space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Building className="w-4 h-4" />
                      <span>Créer un nouveau client</span>
                    </div>
                    <Input
                      label="Nom ou Raison Sociale"
                      placeholder="ex: ACME Corp"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      required
                    />
                    <Input
                      label="Adresse (optionnelle)"
                      placeholder="ex: 10 Rue de la Paix, 75002 Paris"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                    />
                  </div>
                ) : (
                  /* Existing Client Select Dropdown */
                  <Select
                    label="Sélectionner le client"
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setIsCreatingNewClient(false);
                    }}
                    required={!isCreatingNewClient}
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

              {/* Invoice Details Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider border-b border-border pb-1">
                  Données Extraintes de la Facture
                </h4>

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
                className="bylz-glow-cta font-bold"
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
