import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ShippingEmailData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  trackingCarrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  currency: string;
  total: number;
}

function formatAmount(cents: number, currency: string): string {
  const val = (cents / 100).toFixed(2);
  const sym = currency.toUpperCase() === "EUR" ? "€" : currency.toUpperCase();
  return `${val} ${sym}`;
}

function buildShippingHtml(data: ShippingEmailData): string {
  const trackingBlock = data.trackingUrl
    ? `<a href="${data.trackingUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-family:Georgia,serif;">Suivre mon colis</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e8e4df;">
    <div style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #e8e4df;">
      <h1 style="margin:0;font-size:22px;font-weight:400;letter-spacing:0.1em;text-transform:uppercase;color:#1a1a1a;">Leona Blom</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:400;color:#1a1a1a;">Votre commande a été expédiée !</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
        Bonjour ${data.customerName},<br/>
        Votre commande <strong>#${data.orderId.slice(0, 8).toUpperCase()}</strong> a été confiée à <strong>${data.trackingCarrier}</strong>.
      </p>

      <div style="padding:20px;background:#fafafa;border:1px solid #eee;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;">Informations de suivi</p>
        <p style="margin:0 0 4px;font-size:14px;color:#555;">Transporteur : <strong>${data.trackingCarrier}</strong></p>
        <p style="margin:0;font-size:14px;color:#555;">N° de suivi : <strong>${data.trackingNumber}</strong></p>
        <div style="text-align:center;">
          ${trackingBlock}
        </div>
      </div>

      <p style="margin:32px 0 0;color:#888;font-size:13px;line-height:1.6;">
        Pour toute question, contactez-nous à <a href="mailto:contact@leonablom.com" style="color:#1a1a1a;">contact@leonablom.com</a>.
      </p>
    </div>
    <div style="padding:20px 32px;background:#fafafa;border-top:1px solid #e8e4df;text-align:center;">
      <p style="margin:0;color:#aaa;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Leona Blom — Maison de création</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("[SEND-SHIPPING-EMAIL] RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const data: ShippingEmailData = await req.json();
    console.log("[SEND-SHIPPING-EMAIL] Sending for order", data.orderId);

    const FROM = "Leona Blom <onboarding@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [data.customerEmail],
        subject: `Votre commande #${data.orderId.slice(0, 8).toUpperCase()} a été expédiée — Leona Blom`,
        html: buildShippingHtml(data),
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("[SEND-SHIPPING-EMAIL] Failed:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: result }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[SEND-SHIPPING-EMAIL] Sent:", result.id);
    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[SEND-SHIPPING-EMAIL] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
