import { sendDirectEmail } from "./resendClient";

export interface EmailDispatchOptions {
  to: string;
  subject: string;
  body: string;
  documentType:
    | "quote"
    | "invoice"
    | "quote_signed"
    | "payment_receipt"
    | "urssaf_reminder"
    | "vat_threshold"
    | "trial_ending"
    | "welcome"
    | "milestone"
    | "support";
  documentId?: string;
}

export async function dispatchEmail(options: EmailDispatchOptions): Promise<{ success: boolean; resend_id?: string; error?: string }> {
  const result = await sendDirectEmail({
    to: options.to,
    subject: options.subject,
    body: options.body,
    emailType: options.documentType,
    metadata: { document_id: options.documentId || "none" },
  });

  return {
    success: result.success,
    resend_id: result.resendId,
    error: result.error,
  };
}

/**
  1. Welcome Email on Signup
 */
export async function sendWelcomeEmail(userEmail: string, name?: string) {
  const displayName = name || userEmail.split("@")[0];
  const subject = `Bienvenue sur Bylz, ${displayName} ! 🎉`;
  const body = `Bonjour ${displayName},

Bienvenue sur Bylz, la plateforme de facturation et conformité conçue spécifiquement pour les micro-entrepreneurs !

Voici vos 3 étapes pour démarrer en toute sérénité :
1. Renseignez votre SIRET et vos informations dans les Paramètres.
2. Créez votre première fiche Client.
3. Émettez votre premier Devis ou Facture conforme Factur-X en moins de 2 minutes !

Une question ? Notre équipe support est disponible à tout moment.

L'équipe Bylz
https://bylz.fr`;

  return dispatchEmail({
    to: userEmail,
    subject,
    body,
    documentType: "welcome",
  });
}

/**
  2. Notification Devis Signé en ligne
 */
export async function sendQuoteSignedNotification(options: {
  vendorEmail: string;
  clientName: string;
  quoteNumber: string;
  publicUrl: string;
}) {
  const subject = `🎉 Devis N° ${options.quoteNumber} signé par ${options.clientName} !`;
  const body = `Excellente nouvelle !

Votre client ${options.clientName} vient de signer le devis N° ${options.quoteNumber} directement en ligne.

Vous pouvez consulter le devis signé et le transformer en facture en un clic :
${options.publicUrl}

L'équipe Bylz`;

  return dispatchEmail({
    to: options.vendorEmail,
    subject,
    body,
    documentType: "quote_signed",
  });
}

/**
  3. Reçu / Quittance de Paiement Client
 */
export async function sendPaymentReceiptEmail(options: {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amountTtc: number;
  companyName: string;
}) {
  const subject = `Reçu de paiement : Facture N° ${options.invoiceNumber} (${options.companyName})`;
  const body = `Bonjour ${options.clientName},

Nous vous confirmons la bonne réception de votre règlement de ${Number(options.amountTtc).toFixed(2)} € TTC concernant la facture N° ${options.invoiceNumber}.

Nous vous remercions pour votre confiance.

Cordialement,
${options.companyName}`;

  return dispatchEmail({
    to: options.clientEmail,
    subject,
    body,
    documentType: "payment_receipt",
  });
}

/**
  4. Rappel mensuel de Déclaration URSSAF
 */
export async function sendUrssafReminderEmail(options: {
  userEmail: string;
  monthName: string;
  revenue: number;
  estimatedTax: number;
}) {
  const subject = `⏰ Rappel URSSAF : Déclaration de ${options.monthName}`;
  const body = `Bonjour,

C'est le moment de déclarer votre chiffre d'affaires du mois de ${options.monthName} sur l'autoentrepreneur.urssaf.fr !

Voici vos chiffres calculés automatiquement par Bylz :
• Chiffre d'affaires encaissé : ${Number(options.revenue).toFixed(2)} €
• Estimation de vos cotisations sociales : ${Number(options.estimatedTax).toFixed(2)} €

Astuce : Effectuez votre déclaration avant la fin du mois pour éviter toute pénalité de retard.

L'équipe Bylz`;

  return dispatchEmail({
    to: options.userEmail,
    subject,
    body,
    documentType: "urssaf_reminder",
  });
}

/**
  5. Alerte Dépassement Seuil de Franchise de TVA (80% / 90%)
 */
export async function sendVatThresholdWarningEmail(options: {
  userEmail: string;
  currentRevenue: number;
  percentage: number;
  thresholdLimit: number;
}) {
  const subject = `⚠️ Alerte Seuil de Franchise de TVA (${options.percentage}% atteint)`;
  const body = `Attention,

Votre chiffre d'affaires cumulé sur l'année atteint actuellement ${Number(options.currentRevenue).toFixed(2)} €, soit ${options.percentage}% du plafond de franchise de TVA (${options.thresholdLimit} €).

Si vous dépassez ce plafond, vous devrez facturer la TVA sur vos prestations ultérieures.

Pour en savoir plus sur les démarches de passage à la TVA, consultez notre guide dédié sur https://bylz.fr/blog.

L'équipe Bylz`;

  return dispatchEmail({
    to: options.userEmail,
    subject,
    body,
    documentType: "vat_threshold",
  });
}

/**
  6. Rappel Fin d'Essai Pro (J-3 et J-1)
 */
export async function sendTrialEndingEmail(options: {
  userEmail: string;
  daysLeft: number;
}) {
  const subject = `⏳ Plus que ${options.daysLeft} jour${options.daysLeft > 1 ? "s" : ""} d'essai gratuit Bylz PRO`;
  const body = `Bonjour,

Votre période d'essai gratuit Bylz PRO arrive à échéance dans ${options.daysLeft} jour${options.daysLeft > 1 ? "s" : ""}.

Pour continuer à bénéficier des fonctionnalités avancées :
• Format officiel Factur-X 2026
• Paiement en ligne par carte bancaire Stripe
• Signature électronique sécurisée des devis

Rendez-vous dans vos Paramètres pour choisir votre formule : https://bylz.fr/settings

L'équipe Bylz`;

  return dispatchEmail({
    to: options.userEmail,
    subject,
    body,
    documentType: "trial_ending",
  });
}

/**
  7. Célébration de Milestone / Cap de CA
 */
export async function sendMilestoneCelebrationEmail(options: {
  userEmail: string;
  title: string;
  description: string;
}) {
  const subject = `🏆 Bravo ! ${options.title}`;
  const body = `Félicitations !

${options.description}

Toute l'équipe Bylz est fière de vous accompagner dans le développement et le succès de votre entreprise.

Continuez comme ça !
L'équipe Bylz`;

  return dispatchEmail({
    to: options.userEmail,
    subject,
    body,
    documentType: "milestone",
  });
}
