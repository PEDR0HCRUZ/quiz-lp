// Vercel Edge Function — gera a imagem de compartilhamento (og:image) do
// site publicado. Recebe só o slug e busca nome/headline/foto direto no
// Supabase (em vez de receber a foto pela URL): as fotos são salvas como
// data URI base64 no banco, e uma data URI cabendo inteira numa querystring
// deixa a URL do og:image gigante (testado: 460KB+), o que a maioria dos
// crawlers de link preview recusa. Elementos montados como objetos simples
// (formato do Satori) em vez de JSX, porque arquivos .js em /api não
// passam pelo build do Vite/React.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const C = { paper: "#F3F1EA", ink: "#17160F", sub: "#6F6A5E", sage: "#46614D", sageSoft: "#EAEFE9" };

const initials = (n) =>
  (n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

async function fetchSite(slug) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  if (!slug || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sites?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=data`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.data || null;
  } catch {
    return null;
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "";
  const site = slug ? await fetchSite(slug) : null;

  const name = site?.name || "Avence Psi";
  const tagline = site?.headline || "Crie o site da sua clínica de psicologia em minutos.";
  const photo = site?.photo || "";

  const rightPane = photo
    ? { type: "img", props: { src: photo, width: 420, height: 630, style: { objectFit: "cover" } } }
    : { type: "span", props: { style: { display: "flex", fontSize: 120, color: C.sage }, children: initials(name) } };

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: { width: "100%", height: "100%", display: "flex", background: C.paper },
        children: [
          {
            type: "div",
            props: {
              style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px 60px" },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", alignItems: "center", marginBottom: 28 },
                    children: [
                      { type: "div", props: { style: { display: "flex", width: 14, height: 14, borderRadius: 4, background: C.sage, marginRight: 10 } } },
                      { type: "span", props: { style: { display: "flex", fontSize: 22, fontWeight: 700, color: C.ink }, children: "Avence Psi" } },
                    ],
                  },
                },
                { type: "div", props: { style: { display: "flex", fontSize: 56, fontWeight: 600, color: C.ink, maxWidth: 640 }, children: name } },
                { type: "div", props: { style: { display: "flex", fontSize: 24, color: C.sub, marginTop: 22, maxWidth: 600 }, children: tagline } },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: { width: 420, display: "flex", alignItems: "center", justifyContent: "center", background: C.sageSoft },
              children: rightPane,
            },
          },
        ],
      },
    },
    { width: 1200, height: 630 }
  );
}
