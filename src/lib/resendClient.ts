import { supabase } from "./supabase";

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  emailType?: string;
  metadata?: Record<string, any>;
}

export async function sendDirectEmail(params: SendEmailParams): Promise<{ success: boolean; resendId?: string; error?: string }> {
  try {
    // 1. Get Resend API key from system_settings or env
    let resendKey = import.meta.env.VITE_RESEND_API_KEY;

    if (!resendKey) {
      const { data: settingRow } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "resend_api_key")
        .maybeSingle();

      if (settingRow && settingRow.value) {
        resendKey = typeof settingRow.value === "string" ? settingRow.value : (settingRow.value as any)?.key || (settingRow.value as any)?.apiKey;
      }
    }

    // Default fallback API Key if not set in DB
    if (!resendKey) {
      console.warn("Resend API Key is missing. Email logged to database.");
      await supabase.from("email_logs").insert({
        recipient: params.to,
        subject: params.subject,
        email_type: params.emailType || "support_reply",
        status: "pending",
        metadata: { ...params.metadata, error: "Clé API Resend manquante dans system_settings" },
      });
      return { success: false, error: "Clé API Resend non configurée" };
    }

    // Build modern branded HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 28px 32px; background-color: #131c2e; border-bottom: 1px solid #1f2937;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td>
                          <div style="display: inline-block; vertical-align: middle; width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 10px; text-align: center; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 18px;">B</div>
                          <span style="display: inline-block; vertical-align: middle; margin-left: 10px; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Bylz<span style="color: #6366f1;">.</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #ffffff;">${params.subject}</h2>
                    <div style="font-size: 14px; line-height: 1.6; color: #d1d5db; white-space: pre-wrap;">${params.body}</div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #1f2937; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">Bylz.fr — La plateforme de facturation & fiscalité pour micro-entrepreneurs</p>
                    <p style="margin: 0; font-size: 11px; color: #4b5563;">Cet e-mail a été envoyé à ${params.to} suite à votre demande support.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Try sending via Resend API
    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bylz Support <support@bylz.fr>",
        to: [params.to],
        subject: params.subject,
        html: htmlContent,
      }),
    });

    let resData = await resendRes.json().catch(() => ({}));

    // If custom domain unverified, fallback to Resend onboarding sender
    if (!resendRes.ok && (resData?.message?.includes("domain") || resData?.message?.includes("from"))) {
      console.warn("Fallback to onboarding sender domain:", resData?.message);
      resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Bylz Support <onboarding@resend.dev>",
          to: [params.to],
          subject: params.subject,
          html: htmlContent,
        }),
      });
      resData = await resendRes.json().catch(() => ({}));
    }

    if (resendRes.ok && resData?.id) {
      await supabase.from("email_logs").insert({
        recipient: params.to,
        subject: params.subject,
        email_type: params.emailType || "support_reply",
        status: "sent",
        resend_id: resData.id,
        metadata: params.metadata,
      });

      return { success: true, resendId: resData.id };
    } else {
      const errMsg = resData?.message || `Erreur Resend HTTP ${resendRes.status}`;
      console.error("Resend send failed:", errMsg);

      await supabase.from("email_logs").insert({
        recipient: params.to,
        subject: params.subject,
        email_type: params.emailType || "support_reply",
        status: "failed",
        error_message: errMsg,
        metadata: params.metadata,
      });

      return { success: false, error: errMsg };
    }
  } catch (err: any) {
    const errMsg = err?.message || "Erreur réseau d'envoi d'e-mail";
    console.error("Direct email exception:", err);
    return { success: false, error: errMsg };
  }
}
