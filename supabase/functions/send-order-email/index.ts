import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderEmailData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; unit_amount: number; currency: string }[];
  total: number;
  currency: string;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
}

function formatAmount(cents: number, currency: string): string {
  const val = (cents / 100).toFixed(2);
  const sym = currency.toUpperCase() === "EUR" ? "€" : currency.toUpperCase();
  return `${val} ${sym}`;
}

function buildCustomerHtml(data: OrderEmailData): string {
  const itemsRows = data.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Georgia,serif;">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatAmount(i.unit_amount * i.quantity, i.currency)}</td>
        </tr>`
    )
    .join("");

  const addressBlock = data.shippingAddress
    ? `<div style="margin-top:24px;padding:16px;background:#fafafa;border:1px solid #eee;">
        <p style="margin:0 0 4px;font-weight:600;font-family:Georgia,serif;">Adresse de livraison</p>
        <p style="margin:0;font-family:Georgia,serif;color:#555;font-size:14px;">
          ${data.shippingAddress.name || ""}<br/>
          ${data.shippingAddress.line1 || ""}${data.shippingAddress.line2 ? "<br/>" + data.shippingAddress.line2 : ""}<br/>
          ${data.shippingAddress.postal_code || ""} ${data.shippingAddress.city || ""}<br/>
          ${data.shippingAddress.country || ""}
        </p>
      </div>`
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
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:400;color:#1a1a1a;">Merci pour votre commande !</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.6;">
        Bonjour ${data.customerName},<br/>
        Votre commande <strong>#${data.orderId.slice(0, 8).toUpperCase()}</strong> a bien été confirmée. Voici le récapitulatif :
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid #e8e4df;">Article</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;border-bottom:2px solid #e8e4df;">Qté</th>
            <th style="padding:8px 12px;text-align:right;font-weight:600;border-bottom:2px solid #e8e4df;">Prix</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;text-align:right;font-weight:600;font-size:15px;">Total</td>
            <td style="padding:12px;text-align:right;font-weight:600;font-size:15px;">${formatAmount(data.total, data.currency)}</td>
          </tr>
        </tfoot>
      </table>
      ${addressBlock}
      <p style="margin:32px 0 0;color:#888;font-size:13px;line-height:1.6;">
        Nous vous tiendrons informé(e) de l'avancement de votre commande par email.<br/>
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

function buildAdminHtml(data: OrderEmailData): string {
  const itemsList = data.items
    .map((i) => `• ${i.name} × ${i.quantity} — ${formatAmount(i.unit_amount * i.quantity, i.currency)}`)
    .join("<br/>");

  const addr = data.shippingAddress
    ? `${data.shippingAddress.name || ""}, ${data.shippingAddress.line1 || ""}, ${data.shippingAddress.postal_code || ""} ${data.shippingAddress.city || ""}, ${data.shippingAddress.country || ""}`
    : "Non renseignée";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:24px;border:1px solid #ddd;">
    <h2 style="margin:0 0 16px;font-size:16px;">🛒 Nouvelle commande #${data.orderId.slice(0, 8).toUpperCase()}</h2>
    <p style="margin:0 0 4px;font-size:14px;"><strong>Client :</strong> ${data.customerName} (${data.customerEmail})</p>
    <p style="margin:0 0 4px;font-size:14px;"><strong>Total :</strong> ${formatAmount(data.total, data.currency)}</p>
    <p style="margin:0 0 4px;font-size:14px;"><strong>Livraison :</strong> ${addr}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;">Articles :</p>
    <p style="margin:0;font-size:13px;color:#333;line-height:1.8;">${itemsList}</p>
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
    console.error("[SEND-ORDER-EMAIL] RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const data: OrderEmailData = await req.json();
    console.log("[SEND-ORDER-EMAIL] Sending for order", data.orderId);

    const ADMIN_EMAIL = "contact@leonablom.com";
    // Use onboarding@resend.dev if domain not verified, otherwise use your domain
    const FROM = "Leona Blom <onboarding@resend.dev>";

    // Send customer confirmation
    const customerRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [data.customerEmail],
        subject: `Confirmation de commande #${data.orderId.slice(0, 8).toUpperCase()} — Leona Blom`,
        html: buildCustomerHtml(data),
      }),
    });

    const customerResult = await customerRes.json();
    if (!customerRes.ok) {
      console.error("[SEND-ORDER-EMAIL] Customer email failed:", JSON.stringify(customerResult));
    } else {
      console.log("[SEND-ORDER-EMAIL] Customer email sent:", customerResult.id);
    }

    // Send admin notification
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: `🛒 Nouvelle commande #${data.orderId.slice(0, 8).toUpperCase()}`,
        html: buildAdminHtml(data),
      }),
    });

    const adminResult = await adminRes.json();
    if (!adminRes.ok) {
      console.error("[SEND-ORDER-EMAIL] Admin email failed:", JSON.stringify(adminResult));
    } else {
      console.log("[SEND-ORDER-EMAIL] Admin email sent:", adminResult.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error(`[SEND-ORDER-EMAIL] Error ${errorId}:`, err);
    return new Response(JSON.stringify({ error: "An error occurred processing your request", errorId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
