// Vercel Routing Middleware — injeta meta tags (title/description/og:image)
// no HTML de cada site publicado (avence-psi.com/:slug). O app é uma SPA
// client-side pura, então sem isso todo link compartilhado (WhatsApp,
// Instagram, etc.) mostra sempre o mesmo <head> genérico do index.html —
// crawlers de preview não executam JS, então precisa vir pronto no HTML.
export const config = {
  matcher: ["/((?!api/|assets/|.*\\..*).*)"],
};

const escapeHtml = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default async function middleware(request) {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/+|\/+$/g, "");
  const originResponse = await fetch(request);

  if (!slug) return originResponse;
  const contentType = originResponse.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return originResponse;

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return originResponse;

  try {
    const apiRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sites?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=data`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!apiRes.ok) return originResponse;
    const rows = await apiRes.json();
    const site = rows?.[0]?.data;
    if (!site?.name) return originResponse;

    const title = `${site.name} — ${site.headline || "Psicóloga"}`;
    const description = site.subheadline || site.bio || "";
    const ogImage = `${url.origin}/api/og?slug=${encodeURIComponent(slug)}`;
    const pageUrl = `${url.origin}/${slug}`;

    let html = await originResponse.text();
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
    html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
    html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${ogImage}" />`);
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(description)}" />`);
    html = html.replace("</head>", `<meta property="og:url" content="${pageUrl}" />\n</head>`);

    const headers = new Headers(originResponse.headers);
    headers.delete("content-length");
    return new Response(html, { status: originResponse.status, headers });
  } catch {
    return originResponse;
  }
}
