import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Verify admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all active products without stripe_product_id
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name_fr, name_en, description_fr, base_price_eur, images, slug, stripe_product_id")
      .eq("status", "active");

    if (error) throw new Error(error.message);

    const results: { id: string; name: string; stripe_product_id: string; stripe_price_id: string; created: boolean }[] = [];

    for (const p of (products || [])) {
      // Skip if already synced
      if (p.stripe_product_id) {
        results.push({ id: p.id, name: p.name_fr, stripe_product_id: p.stripe_product_id, stripe_price_id: "", created: false });
        continue;
      }

      // Create Stripe product
      const stripeProduct = await stripe.products.create({
        name: p.name_fr,
        description: p.description_fr || undefined,
        images: p.images?.slice(0, 8) || [],
        metadata: { supabase_id: p.id, slug: p.slug },
      });

      // Create default price (base_price_eur in cents)
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: p.base_price_eur,
        currency: "eur",
      });

      // Update DB
      await supabase
        .from("products")
        .update({ stripe_product_id: stripeProduct.id, stripe_price_id: stripePrice.id })
        .eq("id", p.id);

      results.push({
        id: p.id,
        name: p.name_fr,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id,
        created: true,
      });

      console.log(`[SYNC-STRIPE] Created: ${p.name_fr} → ${stripeProduct.id}`);
    }

    return new Response(JSON.stringify({ synced: results.filter(r => r.created).length, total: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SYNC-STRIPE] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
