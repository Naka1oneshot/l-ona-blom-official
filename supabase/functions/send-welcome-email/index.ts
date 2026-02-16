import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeRequest {
  user_id: string;
  email: string;
  locale?: string;
  first_name?: string;
  test_mode?: boolean; // for admin test sends
  test_email?: string;
}

function replaceVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

function buildHtml(opts: {
  subject: string;
  preheader: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  headerImageUrl: string;
}): string {
  const bodyHtml = opts.body
    .split("\n")
    .map((line) => {
      if (line.startsWith("• ")) {
        return `<tr><td style="padding:2px 0 2px 16px;font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#333;">${line}</td></tr>`;
      }
      if (line.trim() === "") return `<tr><td style="height:16px;"></td></tr>`;
      return `<tr><td style="padding:2px 0;font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#333;">${line}</td></tr>`;
    })
    .join("");

  const headerImg = opts.headerImageUrl
    ? `<img src="${opts.headerImageUrl}" alt="LÉONA BLOM" style="max-width:180px;height:auto;margin-bottom:8px;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<!--[if !mso]><!--><style>body{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}</style><!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f7f5f2;font-family:Georgia,serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e4df;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #e8e4df;">
          ${headerImg}
          <h1 style="margin:0;font-size:22px;font-weight:400;letter-spacing:0.15em;text-transform:uppercase;color:#1a1a1a;font-family:Georgia,serif;">LÉONA BLOM</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${bodyHtml}
          </table>
          <!-- CTA -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 16px;">
            <tr><td align="center">
              <a href="${opts.ctaUrl}" target="_blank" style="display:inline-block;background-color:#981D70;color:#ffffff;font-family:Georgia,serif;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:0;">${opts.ctaLabel}</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Separator -->
        <tr><td style="padding:0 32px;"><div style="border-top:1px solid #e8e4df;"></div></td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;text-align:center;">
          <p style="margin:0 0 4px;color:#aaa;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-family:Georgia,serif;">LÉONA BLOM — Maison de création</p>
          <p style="margin:0;color:#bbb;font-size:11px;font-family:Georgia,serif;">
            <a href="mailto:contact@leonablom.com" style="color:#981D70;text-decoration:none;">contact@leonablom.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("[WELCOME-EMAIL] RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body: WelcomeRequest = await req.json();
    const { user_id, email, locale = "fr", first_name, test_mode, test_email } = body;

    console.log(`[WELCOME-EMAIL] Processing for ${email} (locale=${locale}, test=${!!test_mode})`);

    // 1. Load template
    const { data: tpl, error: tplErr } = await supabase
      .from("site_emails_templates")
      .select("*")
      .eq("key", "welcome")
      .maybeSingle();

    if (tplErr || !tpl) {
      console.error("[WELCOME-EMAIL] Template not found:", tplErr);
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tpl.enabled && !test_mode) {
      console.log("[WELCOME-EMAIL] Template disabled, skipping");
      return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Anti-duplicate check (skip in test mode)
    if (!test_mode) {
      const { data: logEntry } = await supabase
        .from("user_emails_log")
        .select("welcome_sent_at")
        .eq("user_id", user_id)
        .maybeSingle();

      if (logEntry?.welcome_sent_at) {
        console.log("[WELCOME-EMAIL] Already sent, skipping");
        return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Build email
    const isEn = locale === "en";
    const subject = isEn ? (tpl.subject_en || tpl.subject_fr) : tpl.subject_fr;
    const preheader = isEn ? (tpl.preheader_en || tpl.preheader_fr) : tpl.preheader_fr;
    const bodyText = isEn ? (tpl.body_en || tpl.body_fr) : tpl.body_fr;
    const ctaLabel = isEn ? (tpl.cta_label_en || tpl.cta_label_fr) : tpl.cta_label_fr;
    const siteUrl = req.headers.get("origin") || "https://leona-blom.lovable.app";
    const ctaUrl = tpl.cta_url.startsWith("http") ? tpl.cta_url : `${siteUrl}${tpl.cta_url}`;

    const vars: Record<string, string> = {
      first_name_or_cher_tresor: first_name || "Cher Trésor",
      first_name_or_dear: first_name || "Dear",
      cta_url: ctaUrl,
      account_url: `${siteUrl}/compte`,
    };

    const finalBody = replaceVars(bodyText, vars);
    const finalSubject = replaceVars(subject, vars);

    const html = buildHtml({
      subject: finalSubject,
      preheader,
      body: finalBody,
      ctaLabel,
      ctaUrl,
      headerImageUrl: tpl.header_image_url || "",
    });

    // 4. Send via Resend
    const recipientEmail = test_mode && test_email ? test_email : email;
    const FROM = "LÉONA BLOM <onboarding@resend.dev>";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [recipientEmail],
        reply_to: "contact@leonablom.com",
        subject: test_mode ? `[TEST] ${finalSubject}` : finalSubject,
        html,
      }),
    });

    const resendResult = await resendRes.json();
    if (!resendRes.ok) {
      console.error("[WELCOME-EMAIL] Resend error:", JSON.stringify(resendResult));

      // If sandbox/domain validation error, mark as attempted to prevent infinite retries
      const isSandboxError = resendResult?.name === "validation_error" || resendResult?.statusCode === 403;
      if (isSandboxError && !test_mode) {
        console.log("[WELCOME-EMAIL] Sandbox limitation — marking as attempted to stop retries");
        await supabase
          .from("user_emails_log")
          .upsert(
            { user_id, welcome_sent_at: new Date().toISOString(), locale },
            { onConflict: "user_id" }
          );
      }

      return new Response(JSON.stringify({ error: "Failed to send email", details: resendResult }), {
        status: isSandboxError ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[WELCOME-EMAIL] Sent:", resendResult.id);

    // 5. Update log (skip in test mode)
    if (!test_mode) {
      await supabase
        .from("user_emails_log")
        .upsert(
          { user_id, welcome_sent_at: new Date().toISOString(), locale },
          { onConflict: "user_id" }
        );
    }

    return new Response(JSON.stringify({ success: true, id: resendResult.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error(`[WELCOME-EMAIL] Error ${errorId}:`, err);
    return new Response(JSON.stringify({ error: "Internal error", errorId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
