import { formatAmount } from "../../lib/utils";
import { formatDateLong } from "../../lib/date";
import type {
  Company,
  Client,
  QuoteLine,
  InvoiceLine,
  PaymentTerms,
  ItemNature,
} from "../../types/database";

type AnyLine = {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  nature: ItemNature;
};

interface DocumentPreviewProps {
  company: Company;
  client: Client | null;
  documentType: "quote" | "invoice";
  number: string;
  issueDate: string;
  dueDate?: string | null;
  validityDate?: string | null;
  paymentTerms: PaymentTerms;
  note?: string | null;
  lines: AnyLine[];
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  isCreditNote?: boolean;
}

const TERMS_LABELS: Record<PaymentTerms, string> = {
  on_receipt: "À réception",
  "30d": "30 jours",
  "60d": "60 jours",
};

export function DocumentPreview({
  company,
  client,
  documentType,
  number,
  issueDate,
  dueDate,
  validityDate,
  paymentTerms,
  note,
  lines,
  totalHt,
  totalVat,
  totalTtc,
  isCreditNote,
}: DocumentPreviewProps) {
  const isFranchise = company.vat_regime === "franchise";
  const title = isCreditNote
    ? "AVOIR"
    : documentType === "quote"
    ? "DEVIS"
    : "FACTURE";
  const displayName = company.commercial_name || company.legal_name;
  const isDraft = number.startsWith("DRAFT-");

  return (
    <div
      className="bg-white rounded-card shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.22)] w-full text-gray-900"
      style={{ minHeight: "600px" }}
    >
      {/* Header (60/40 grid) */}
      <div className="grid grid-cols-[60fr_40fr] gap-4 p-6 pb-5">
        {/* Left: logo + company */}
        <div className="flex items-start gap-3 min-w-0">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt="Logo"
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
              {displayName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate" style={{ maxWidth: "240px" }}>
              {company.address}
            </p>
            {company.siret && (
              <p className="text-xs text-gray-400 mt-0.5">
                SIRET {company.siret}
              </p>
            )}
          </div>
        </div>
        {/* Right: title + number + dates */}
        <div className="text-right flex flex-col items-end min-w-0">
          <p
            className="text-xl font-bold tracking-tight leading-none"
            style={{ color: company.accent_color }}
          >
            {title}
          </p>
          {isDraft ? (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 align-middle mt-2 px-2.5 py-1 rounded-pill bg-gray-100 text-gray-500 text-xs font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              Brouillon
            </span>
          ) : (
            <p className="text-sm font-semibold text-gray-700 mt-1.5">
              {number}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2 whitespace-nowrap">
            Émise le {formatDateLong(issueDate)}
          </p>
          {documentType === "invoice" && dueDate && (
            <p className="text-xs text-gray-400 whitespace-nowrap">
              Échéance {formatDateLong(dueDate)}
            </p>
          )}
          {documentType === "quote" && validityDate && (
            <p className="text-xs text-gray-400 whitespace-nowrap">
              Valide jusqu'au {formatDateLong(validityDate)}
            </p>
          )}
        </div>
      </div>

      {/* Client block */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
          {documentType === "quote" ? "Client" : "Facturé à"}
        </p>
        <p className="font-bold text-gray-900">
          {client?.name || "-"}
        </p>
        {client?.address && (
          <p className="text-xs text-gray-500 whitespace-pre-line">
            {client.address}
          </p>
        )}
        {client?.siret && (
          <p className="text-xs text-gray-500">SIRET {client.siret}</p>
        )}
        {client?.email && (
          <p className="text-xs text-gray-500">{client.email}</p>
        )}
      </div>

      {/* Lines table */}
      <div className="px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 font-semibold text-right w-16">Qté</th>
              <th className="py-2 font-semibold text-right w-24">P.U. HT</th>
              <th className="py-2 font-semibold text-right w-28">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400 text-xs">
                  Aucune ligne
                </td>
              </tr>
            ) : (
              lines.map((l, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700">
                    {l.description}
                    <span className="block text-xs text-gray-400">
                      {l.nature === "service" ? "Service" : "Marchandise"}
                    </span>
                  </td>
                  <td className="py-2 text-right text-gray-700 tabular-nums">
                    {Number(l.quantity)}
                  </td>
                  <td className="py-2 text-right text-gray-700 tabular-nums">
                    {formatAmount(Number(l.unit_price), { currency: false })}
                  </td>
                  <td className="py-2 text-right text-gray-900 font-semibold tabular-nums">
                    {formatAmount(Number(l.quantity) * Number(l.unit_price))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 py-4 flex justify-end">
        <div className="w-full max-w-xs flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span className="font-normal">Total HT</span>
            <span className="tabular-nums">{formatAmount(totalHt)}</span>
          </div>
          {!isFranchise && (
            <div className="flex justify-between text-gray-600">
              <span className="font-normal">TVA</span>
              <span className="tabular-nums">{formatAmount(totalVat)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t-2 border-gray-200 pt-2 mt-1">
            <span className="font-bold text-gray-900">Total TTC</span>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: company.accent_color }}
            >
              {formatAmount(totalTtc)}
            </span>
          </div>
          {isFranchise && (
            <p className="text-xs text-gray-400 mt-1">
              TVA non applicable, art. 293 B du CGI
            </p>
          )}
        </div>
      </div>

      {/* Note */}
      {note && (
        <div className="px-6 pb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
            Note
          </p>
          <p className="text-xs text-gray-600 whitespace-pre-line">{note}</p>
        </div>
      )}

      {/* Payment terms */}
      <div className="px-6 pb-3">
        <p className="text-xs text-gray-500">
          Conditions de règlement : {TERMS_LABELS[paymentTerms]}
        </p>
      </div>

      {/* Footer */}
      {company.invoice_footer && (
        <div className="px-6 pb-6 pt-3 border-t border-gray-100">
          <p
            className="text-xs text-gray-400"
            title={company.invoice_footer}
            style={{
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {company.invoice_footer}
          </p>
        </div>
      )}
      {isFranchise && (
        <div className="px-6 pb-6">
          <p className="text-[10px] text-gray-400">
            Auto-entrepreneur : TVA non applicable, art. 293 B du CGI
          </p>
        </div>
      )}
    </div>
  );
}
