import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CartLineItem {
  name: string;
  unit_price_cents: number;
  quantity: number;
  image_url?: string;
  size?: string;
  color?: string;
  braiding?: string;
}

interface ShippingData {
  price_eur_cents: number;
  method_id?: string;
  method_code?: string;
  options?: { insurance: boolean; signature: boolean; gift_wrap: boolean };
  shipment_preference?: string;
  shipping_address?: any;
  billing_address?: any;
  zone_id?: string;
  customs_notice?: boolean;
  estimated_lead_days?: number;
  estimated_eta_min?: number;
  estimated_eta_max?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Service role client for order creation
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { items, currency, locale, shipping } = await req.json() as {
      items: CartLineItem[];
      currency?: string;
      locale?: string;
      shipping?: ShippingData;
    };

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Authenticate user (required for checkout with shipping)
    let userEmail: string | undefined;
    let userId: string | undefined;
    let customerId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email ?? undefined;
      userId = data.user?.id ?? undefined;
    }

    if (!userEmail) {
      throw new Error("Authentication required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || "https://leona-blom.lovable.app";
    const cur = (currency || "EUR").toLowerCase();

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const description = [item.size, item.color, item.braiding].filter(Boolean).join(" · ");
      return {
        price_data: {
          currency: cur,
          unit_amount: item.unit_price_cents,
          product_data: {
            name: item.name,
            ...(description ? { description } : {}),
            ...(item.image_url ? { images: [item.image_url] } : {}),
          },
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item if > 0
    const shippingPriceCents = shipping?.price_eur_cents ?? 0;
    if (shippingPriceCents > 0) {
      lineItems.push({
        price_data: {
          currency: cur,
          unit_amount: shippingPriceCents,
          product_data: {
            name: locale === "fr" ? "Frais de livraison" : "Shipping",
          },
        },
        quantity: 1,
      });
    }

    // Calculate totals
    const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    const total = subtotal + shippingPriceCents;

    // Create order in DB before redirect
    const orderPayload: any = {
      user_id: userId,
      status: "NEW",
      currency: (currency || "EUR").toUpperCase(),
      subtotal,
      total,
      shipping_fee: shippingPriceCents,
      items_json: items.map(i => ({
        name: i.name,
        unit_price_cents: i.unit_price_cents,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        braiding: i.braiding,
        image_url: i.image_url,
      })),
      shipping_address_json: shipping?.shipping_address ?? null,
      billing_address_json: shipping?.billing_address ?? null,
      shipping_zone_id: shipping?.zone_id ?? null,
      shipping_method_id: shipping?.method_id ?? null,
      shipping_options_json: shipping?.options ?? null,
      shipment_preference: shipping?.shipment_preference ?? "single",
      shipping_price: shippingPriceCents,
      shipping_currency: (currency || "EUR").toUpperCase(),
      customs_notice_shown: shipping?.customs_notice ?? false,
    };

    // Calculate estimated dates
    if (shipping?.estimated_lead_days != null && shipping.estimated_lead_days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + shipping.estimated_lead_days);
      orderPayload.estimated_ship_start_date = startDate.toISOString().split("T")[0];
      if (shipping.estimated_eta_max) {
        const deliveryDate = new Date(startDate);
        deliveryDate.setDate(deliveryDate.getDate() + shipping.estimated_eta_max);
        orderPayload.estimated_delivery_date = deliveryDate.toISOString().split("T")[0];
      }
    } else if (shipping?.estimated_eta_max) {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + shipping.estimated_eta_max);
      orderPayload.estimated_delivery_date = deliveryDate.toISOString().split("T")[0];
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError) {
      console.error("[create-checkout] Order creation error:", orderError);
      // Continue anyway — order will be created by webhook as fallback
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      locale: locale === "fr" ? "fr" : "auto",
      success_url: `${origin}/paiement-succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier`,
      metadata: {
        order_id: order?.id ?? "",
        shipping_method: shipping?.method_code ?? "",
        shipment_preference: shipping?.shipment_preference ?? "single",
      },
    });

    // Update order with stripe session ID
    if (order?.id && session.id) {
      await supabaseAdmin
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("id", order.id);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error(`[create-checkout] Error ${errorId}:`, error);
    return new Response(JSON.stringify({ error: "An error occurred processing your request", errorId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
