import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://leona-blom.lovable.app";

const STATIC_ROUTES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/boutique", priority: "0.9", changefreq: "daily" },
  { loc: "/collections", priority: "0.8", changefreq: "weekly" },
  { loc: "/actualites", priority: "0.7", changefreq: "weekly" },
  { loc: "/a-propos", priority: "0.6", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/faq", priority: "0.4", changefreq: "monthly" },
  { loc: "/try-on", priority: "0.4", changefreq: "monthly" },
  { loc: "/cgv", priority: "0.2", changefreq: "yearly" },
  { loc: "/confidentialite", priority: "0.2", changefreq: "yearly" },
  { loc: "/cookies", priority: "0.2", changefreq: "yearly" },
  { loc: "/mentions-legales", priority: "0.2", changefreq: "yearly" },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: string, changefreq = "weekly", priority = "0.5"): string {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) entry += `    <lastmod>${lastmod}</lastmod>\n`;
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  entry += `  </url>`;
  return entry;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch dynamic content in parallel
    const [productsRes, collectionsRes, postsRes] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("status", "active"),
      supabase.from("collections").select("slug, updated_at").not("published_at", "is", null),
      supabase.from("posts").select("slug, updated_at").not("published_at", "is", null),
    ]);

    const entries: string[] = [];

    // Static routes
    for (const route of STATIC_ROUTES) {
      entries.push(urlEntry(`${SITE_URL}${route.loc}`, undefined, route.changefreq, route.priority));
    }

    // Products
    for (const p of productsRes.data || []) {
      const lastmod = p.updated_at ? p.updated_at.split("T")[0] : undefined;
      entries.push(urlEntry(`${SITE_URL}/boutique/${p.slug}`, lastmod, "weekly", "0.8"));
    }

    // Collections
    for (const c of collectionsRes.data || []) {
      const lastmod = c.updated_at ? c.updated_at.split("T")[0] : undefined;
      entries.push(urlEntry(`${SITE_URL}/collections/${c.slug}`, lastmod, "weekly", "0.7"));
    }

    // Posts
    for (const p of postsRes.data || []) {
      const lastmod = p.updated_at ? p.updated_at.split("T")[0] : undefined;
      entries.push(urlEntry(`${SITE_URL}/actualites/${p.slug}`, lastmod, "monthly", "0.6"));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return new Response(`Error generating sitemap: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
