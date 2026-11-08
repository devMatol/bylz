import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { callFactPulseApi } from "../_shared/factpulse-client.ts";
import {
  validateFactPulseAddress,
  isFactPulseTransmissionAllowed,
  verifyInvoiceTotalsConcordance,
  recoverStaleSubmittingStatus,
  attemptAtomicReservation,
  decideSubmissionSuccess,
  restorePreviousStatus,
  extractAndValidateCompanyIban,
} from "../_shared/factpulse-helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  let previousPaStatus = "none";
  let invoiceId = "";
  let isReserved = false;
  let isCompletedSuccessfully = false;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentification requise." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, authHeader.replace(/^Bearer /i, ""));
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData } = await anonClient.auth.getUser(jwt);
    const authUser = userData?.user;

    if (!authUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentification requise." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { invoice_id, retry = false } = await req.json().catch(() => ({}));
    if (!invoice_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Paramètre invoice_id obligatoire." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    invoiceId = invoice_id;

    // 1. Récupération des transmissions orphelines bloquées au statut 'submitting' (> 10 minutes)
    await recoverStaleSubmittingStatus(adminClient, invoiceId, 10);

    // 2. Vérification du quota / plan côté serveur (abonnements Solo ou Pro requis)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, plan")
      .eq("id", authUser.id)
      .single();

    if (!profile || profile.plan === "starter") {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "plan_upgrade_required",
          error: "La transmission à la facturation électronique nécessite un abonnement Solo ou Pro.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Récupération de la facture
    const { data: invoice, error: invErr } = await adminClient
      .from("invoices")
      .select("*, company:companies(*)")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ success: false, error: "Facture introuvable." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Contrôle d'appartenance
    if (!invoice.company || invoice.company.user_id !== authUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Facture introuvable." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Règle métier : interdire la transmission d'un brouillon
    if (invoice.status === "draft") {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "invoice_is_draft",
          error: "Seule une facture émise peut être transmise à la facturation électronique.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Retry autorisé UNIQUEMENT si pa_status = 'rejected'
    previousPaStatus = invoice.pa_status || "none";
    if (retry && previousPaStatus !== "rejected") {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "retry_not_allowed",
          error: "La relance n'est autorisée que pour une facture précédemment rejetée.",
          pa_status: previousPaStatus,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!retry && previousPaStatus !== "none") {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "already_submitted",
          error: `Cette facture a déjà fait l'objet d'une transmission (statut: ${previousPaStatus}).`,
          pa_status: previousPaStatus,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Réservation atomique avant tout appel payant
    const reservation = await attemptAtomicReservation(adminClient, invoice.id);
    if (!reservation.reserved) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "concurrency_conflict",
          error: reservation.error || "Une transmission pour cette facture est déjà en cours ou a été validée simultanément.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    isReserved = true;

    // 7. Extraction stricte depuis legal_snapshot (pas de mélange avec les tables vivantes)
    const snapshot = invoice.legal_snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "missing_legal_snapshot",
          error: "L'instantané légal (legal_snapshot) est absent sur cette facture émise.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sellerSnap = snapshot.seller || {};
    const buyerSnap = snapshot.buyer || {};

    const sellerAddrCheck = validateFactPulseAddress(
      {
        address: sellerSnap.address,
        postal_code: sellerSnap.postal_code,
        city: sellerSnap.city,
      },
      "émetteur"
    );
    if (!sellerAddrCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "snapshot_seller_address_incomplete",
          error: sellerAddrCheck.error,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buyerAddrCheck = validateFactPulseAddress(
      {
        address: buyerSnap.address,
        postal_code: buyerSnap.postal_code,
        city: buyerSnap.city,
      },
      "client"
    );
    if (!buyerAddrCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "snapshot_buyer_address_incomplete",
          error: buyerAddrCheck.error,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supplierSiret = (sellerSnap.siret || "").replace(/\s+/g, "");
    const supplierSiren = sellerSnap.siren || (supplierSiret.length >= 9 ? supplierSiret.slice(0, 9) : supplierSiret);
    const recipientSiret = (buyerSnap.siret || buyerSnap.siren || "").replace(/\s+/g, "");

    if (!supplierSiret || supplierSiret === "00000000000000") {
      return new Response(
        JSON.stringify({ success: false, error: "Le SIRET de l'émetteur dans le snapshot est obligatoire." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipientSiret || recipientSiret === "00000000000000") {
      return new Response(
        JSON.stringify({ success: false, error: "Le SIRET du client B2B dans le snapshot est obligatoire." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Contrôle strict de l'IBAN émetteur avant tout appel FactPulse (P0.1 mandatory)
    const ibanCheck = extractAndValidateCompanyIban(invoice.company, sellerSnap);
    if (!ibanCheck.valid || !ibanCheck.iban) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "missing_company_iban",
          error: ibanCheck.error || "Renseignez votre IBAN dans Paramètres avant la transmission à la facturation électronique.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. vat_rate depuis invoice_lines apparié par ID de ligne avec le snapshot
    const { data: dbLines } = await adminClient
      .from("invoice_lines")
      .select("id, description, quantity, unit_price, vat_rate")
      .eq("invoice_id", invoice.id);

    const snapshotLines = Array.isArray(snapshot.lines) ? snapshot.lines : [];
    const vatRegime = sellerSnap.vat_regime || "franchise";
    const isFranchise = vatRegime === "franchise";

    const compliantLines = snapshotLines.map((sLine: any) => {
      const dbLine = (dbLines || []).find((l) => l.id === sLine.id);
      const lineVatRate = isFranchise ? 0 : Number(dbLine?.vat_rate ?? sLine.vat_rate ?? 20);
      return {
        description: sLine.description || dbLine?.description || "Prestation de service",
        quantity: Number(sLine.quantity ?? dbLine?.quantity ?? 1),
        unitPrice: Number(sLine.unit_price ?? dbLine?.unit_price ?? 0),
        vatRate: lineVatRate,
        vatCategory: isFranchise ? "E" : (lineVatRate === 0 ? "Z" : "S"),
        ...(isFranchise
          ? {
              vatexCode: "VATEX-FR-FRANCHISE",
              vatExemptionReason: "TVA non applicable, art. 293 B du CGI",
            }
          : {}),
      };
    });

    // Contrôle d'égalité des totaux
    const totalsCheck = verifyInvoiceTotalsConcordance(
      compliantLines,
      Number(invoice.total_ht),
      Number(invoice.total_vat),
      Number(invoice.total_ttc),
      vatRegime
    );

    if (!totalsCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "totals_mismatch",
          error: totalsCheck.error,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Récupération ou génération du PDF officiel via JWT utilisateur
    const safeDocNumber = String(invoice.number).replace(/[^a-zA-Z0-9_-]/g, "_");
    const existingPdfPath = `${invoice.company_id}/invoice-${safeDocNumber}.pdf`;

    let sourcePdfBlob = await adminClient.storage.from("documents").download(existingPdfPath);

    if (sourcePdfBlob.error || !sourcePdfBlob.data) {
      const genPdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_type: "invoice", document_id: invoice.id }),
      });

      if (genPdfRes.ok) {
        sourcePdfBlob = await adminClient.storage.from("documents").download(existingPdfPath);
      }
    }

    if (sourcePdfBlob.error || !sourcePdfBlob.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: "pdf_generation_required",
          error: "Impossible de récupérer ou générer le PDF de la facture pour la transmission FactPulse.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourcePdfBytes = new Uint8Array(await sourcePdfBlob.data.arrayBuffer());
    const sourcePdfBase64 = base64Encode(sourcePdfBytes);

    // 10. Garde-fou strict fail-closed (FACTPULSE_ALLOW_PRODUCTION)
    // Comme l'URL FactPulse est unique (https://factpulse.fr/api/v1), tout envoi sans validation explicite est bloqué
    const allowCheck = isFactPulseTransmissionAllowed(
      Deno.env.get("FACTPULSE_ALLOW_PRODUCTION"),
      invoice.company_id,
      Deno.env.get("FACTPULSE_ALLOWED_COMPANY_IDS")
    );
    if (!allowCheck.allowed) {
      console.warn("⚠️ Transmission FactPulse bloquée par FACTPULSE_ALLOW_PRODUCTION !== 'true'");
      return new Response(
        JSON.stringify({
          success: false,
          error_code: allowCheck.errorCode,
          error: allowCheck.error,
        }),
        { status: allowCheck.status || 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 11. Préparation du payload FactPulse
    const payload = {
      sourcePdf: sourcePdfBase64,
      destination: {
        type: "afnor",
      },
      invoiceData: {
        number: invoice.number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        operationNature: "S1",
        currency: "EUR",
        supplier: {
          name: sellerSnap.legal_name || invoice.company.legal_name,
          siret: supplierSiret,
          taxRegistrationId: supplierSiren,
          routingAddress: supplierSiret,
          iban: ibanCheck.iban,
          postalAddress: {
            street: sellerAddrCheck.street,
            postalCode: sellerAddrCheck.postalCode,
            city: sellerAddrCheck.city,
            countryCode: "FR",
          },
        },
        recipient: {
          name: buyerSnap.name,
          siret: recipientSiret,
          routingAddress: recipientSiret,
          postalAddress: {
            street: buyerAddrCheck.street,
            postalCode: buyerAddrCheck.postalCode,
            city: buyerAddrCheck.city,
            countryCode: "FR",
          },
        },
        lines: compliantLines,
      },
      options: {
        facturxProfile: "EN16931",
        autoEnrich: true,
        validateXml: true,
      },
    };

    // 12. Appel à l'API officielle FactPulse via le client partagé
    let resData: any = null;
    try {
      const webhookCallbackUrl = "https://sbwbjkzustnlnnilkogm.supabase.co/functions/v1/factpulse-webhook";
      const submitEndpoint = `/processing/invoices/submit-complete?callback_url=${encodeURIComponent(webhookCallbackUrl)}&webhook_mode=inline`;
      resData = await callFactPulseApi(submitEndpoint, "POST", payload);
    } catch (err: any) {
      await adminClient.from("pa_submission_errors").insert({
        invoice_id: invoice.id,
        error: err.message || "Erreur réseau FactPulse",
        error_code: "submission_error",
      });

      return new Response(
        JSON.stringify({
          success: false,
          error_code: "submission_error",
          message: "Échec de la transmission à la plateforme agréée. L'incident a été consigné.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 13. Décision de succès stricte (afnorResult.flowId obligatoire)
    const decision = decideSubmissionSuccess(resData);
    if (!decision.success || !decision.flowId) {
      const rejectReason = decision.rejectionReason || "Rejet FactPulse : aucun flowId AFNOR attribué";
      await adminClient.from("pa_submission_errors").insert({
        invoice_id: invoice.id,
        error: rejectReason,
        error_code: "AFNOR_REJECTED",
      });

      return new Response(
        JSON.stringify({
          success: false,
          error_code: "AFNOR_REJECTED",
          message: "La plateforme n'a pas confirmé le dépôt de la facture (aucun identifiant de flux AFNOR attribué).",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flowId = decision.flowId;

    // 14. Enregistrement Factur-X dans storage
    let relativeStoragePath: string | null = null;
    const base64Content = resData?.contentB64 || resData?.pdfBase64 || null;

    if (base64Content) {
      try {
        const facturxBytes = base64Decode(base64Content);
        relativeStoragePath = `${invoice.company_id}/facturx/${invoice.id}.pdf`;
        await adminClient.storage
          .from("documents")
          .upload(relativeStoragePath, facturxBytes, {
            contentType: "application/pdf",
            upsert: true,
          });
      } catch (storageErr) {
        console.warn("Storage upload warning for Factur-X:", storageErr);
      }
    }

    // 15. Validation finale et mise à jour
    const updateFields: Record<string, any> = {
      factpulse_ref: flowId,
      pa_status: "submitted",
      pa_rejection_reason: null,
      pa_lifecycle_code: 200,
    };
    if (relativeStoragePath) {
      updateFields.facturx_pdf_url = relativeStoragePath;
    }

    await adminClient.from("invoices").update(updateFields).eq("id", invoice.id);
    isCompletedSuccessfully = true;

    return new Response(
      JSON.stringify({
        success: true,
        factpulse_ref: flowId,
        facturx_pdf_url: relativeStoragePath,
        pa_status: "submitted",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in submit-to-pa Edge Function:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error_code: "INTERNAL_ERROR",
        message: "Une erreur interne est survenue lors de la transmission.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    // Restitution systématique du statut précédent en cas d'échec ou d'exception après réservation
    if (isReserved && !isCompletedSuccessfully && invoiceId) {
      try {
        await restorePreviousStatus(adminClient, invoiceId, previousPaStatus);
      } catch (restoreErr) {
        console.error("Erreur lors de la restauration du statut précédent :", restoreErr);
      }
    }
  }
});
