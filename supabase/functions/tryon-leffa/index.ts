import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAL_BASE = "https://queue.fal.run/fal-ai/leffa/virtual-tryon";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FAL_KEY = Deno.env.get("FAL_KEY");
  if (!FAL_KEY) {
    return new Response(JSON.stringify({ error: "FAL_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop(); // "create" or "status"

  try {
    // ── CREATE ─────────────────────────────────────────────────
    if (path === "create" && req.method === "POST") {
      const body = await req.json();
      const { productId, userImageBase64, garmentImageUrl: directGarmentUrl, garmentType: directGarmentType } = body;

      let humanImageUrl: string;
      let garmentImageUrl: string;
      let garmentType: string;

      // If admin test mode passes garment directly
      if (directGarmentUrl && directGarmentType) {
        garmentImageUrl = directGarmentUrl;
        garmentType = directGarmentType;
      } else if (productId) {
        // Load product from DB
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data: product, error: dbErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (dbErr || !product) {
          return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!product.tryon_ai_enabled) {
          return new Response(JSON.stringify({ error: "AI try-on not enabled for this product" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        garmentImageUrl = product.tryon_garment_image_url || (product.images && product.images[0]) || "";
        garmentType = product.tryon_garment_type || "upper_body";
      } else {
        return new Response(JSON.stringify({ error: "productId or garmentImageUrl required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!garmentImageUrl) {
        return new Response(JSON.stringify({ error: "No garment image available" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle human image: if base64, upload to fal storage
      if (userImageBase64) {
        // Upload to fal storage
        const uploadRes = await fetch("https://fal.run/fal-ai/fal-storage/upload", {
          method: "PUT",
          headers: {
            Authorization: `Key ${FAL_KEY}`,
            "Content-Type": "application/octet-stream",
          },
          body: base64ToUint8Array(userImageBase64),
        });

        if (!uploadRes.ok) {
          // Fallback: use data URI directly
          humanImageUrl = userImageBase64.startsWith("data:")
            ? userImageBase64
            : `data:image/jpeg;base64,${userImageBase64}`;
        } else {
          const uploadData = await uploadRes.json();
          humanImageUrl = uploadData.url || uploadData.file_url || userImageBase64;
        }
      } else {
        return new Response(JSON.stringify({ error: "userImageBase64 required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Submit to fal queue
      const falRes = await fetch(FAL_BASE, {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            human_image_url: humanImageUrl,
            garment_image_url: garmentImageUrl,
            garment_type: garmentType,
          },
        }),
      });

      const falData = await falRes.json();

      if (!falRes.ok) {
        return new Response(JSON.stringify({ error: "fal.ai error", details: falData }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ request_id: falData.request_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STATUS ────────────────────────────────────────────────
    if (path === "status" && req.method === "GET") {
      const requestId = url.searchParams.get("requestId");
      if (!requestId) {
        return new Response(JSON.stringify({ error: "requestId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check status
      const statusRes = await fetch(
        `${FAL_BASE}/requests/${requestId}/status`,
        {
          headers: { Authorization: `Key ${FAL_KEY}` },
        }
      );
      
      if (!statusRes.ok) {
        const errText = await statusRes.text();
        return new Response(JSON.stringify({ error: "fal status error", details: errText }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      let statusData;
      try {
        statusData = await statusRes.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid response from fal" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (statusData.status === "COMPLETED") {
        // Get result
        const resultRes = await fetch(
          `${FAL_BASE}/requests/${requestId}`,
          {
            headers: { Authorization: `Key ${FAL_KEY}` },
          }
        );
        const resultData = await resultRes.json();
        const imageUrl = resultData?.image?.url || resultData?.output?.image?.url || null;

        return new Response(
          JSON.stringify({ status: "COMPLETED", image_url: imageUrl, raw: resultData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ status: statusData.status || "IN_PROGRESS" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown endpoint. Use /create or /status" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URI prefix if present
  const raw = base64.replace(/^data:[^;]+;base64,/, "");
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
