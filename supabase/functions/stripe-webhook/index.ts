import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

async function sendOrderEmail(
  orderId: string,
  items: any[],
  session: any,
  shippingAddress: any
) {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerEmail: session.customer_details?.email || "",
        customerName: session.customer_details?.name || "Client",
        orderId,
        items,
        total: session.amount_total || 0,
        currency: (session.currency || "eur").toUpperCase(),
        shippingAddress,
      }),
    });
    const result = await res.json();
    logStep("Email function response", { status: res.status, result });
  } catch (err) {
    logStep("Email sending failed (non-blocking)", { error: err instanceof Error ? err.message : String(err) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("ERROR", { message: "No stripe-signature header" });
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400, headers: corsHeaders });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Signature verification failed", { message: msg });
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${msg}` }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  logStep("Event received", { type: event.type, id: event.id });

  // Use service role to bypass RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_details?.email,
        });

        if (session.payment_status === "paid") {
          // Retrieve line items for order storage
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

          const itemsJson = lineItems.data.map((li) => ({
            name: li.description,
            quantity: li.quantity,
            unit_amount: li.price?.unit_amount,
            currency: li.currency,
          }));

          const shippingAddress = session.shipping_details?.address
            ? {
                name: session.shipping_details.name,
                line1: session.shipping_details.address.line1,
                line2: session.shipping_details.address.line2,
                city: session.shipping_details.address.city,
                postal_code: session.shipping_details.address.postal_code,
                country: session.shipping_details.address.country,
              }
            : null;

          // Check if an order already exists for this session
          const { data: existingOrder } = await supabase
            .from("orders")
            .select("id")
            .eq("stripe_session_id", session.id)
            .maybeSingle();

          if (existingOrder) {
            // Update existing order
            const { error } = await supabase
              .from("orders")
              .update({ status: "PAID", updated_at: new Date().toISOString() })
              .eq("id", existingOrder.id);

            if (error) logStep("Error updating order", { error: error.message });
            else logStep("Order updated to PAID", { orderId: existingOrder.id });

            // Send confirmation emails
            await sendOrderEmail(existingOrder.id, itemsJson, session, shippingAddress);
          } else {
            // Create a new order
            const { data: newOrder, error } = await supabase.from("orders").insert({
              stripe_session_id: session.id,
              status: "PAID",
              currency: (session.currency || "eur").toUpperCase(),
              subtotal: session.amount_subtotal || 0,
              total: session.amount_total || 0,
              shipping_fee: session.total_details?.amount_shipping || 0,
              discount_total: session.total_details?.amount_discount || 0,
              items_json: itemsJson,
              shipping_address_json: shippingAddress,
              notes: `Stripe session ${session.id}`,
            }).select("id").single();

            if (error) logStep("Error creating order", { error: error.message });
            else {
              logStep("Order created", { orderId: newOrder.id });
              await sendOrderEmail(newOrder.id, itemsJson, session, shippingAddress);
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session expired", { sessionId: session.id });

        // Mark any pending order as cancelled
        const { error } = await supabase
          .from("orders")
          .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", session.id)
          .eq("status", "NEW");

        if (error) logStep("Error cancelling order", { error: error.message });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorId = crypto.randomUUID().slice(0, 8);
    logStep(`ERROR processing event ${errorId}`, { message: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: "An error occurred processing your request", errorId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
