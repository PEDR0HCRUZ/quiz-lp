// Vercel serverless function — recebe o lead do quiz e cria uma linha
// na base "Pipeline de Clientes" do Notion, marcada com "Leads Psi".
const DATABASE_ID = "39242f86-6631-8007-96a6-c181eb53b226";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    res.status(500).json({ error: "NOTION_TOKEN não configurado" });
    return;
  }

  const { name, email, whatsapp, slug } = req.body || {};
  if (!name || !email) {
    res.status(400).json({ error: "name e email são obrigatórios" });
    return;
  }

  const properties = {
    Nome: { title: [{ text: { content: name } }] },
    "E-mail": { email },
    Etapa: { select: { name: "Novo lead" } },
    "Leads Psi": { checkbox: true },
  };
  if (whatsapp) properties.WhatsApp = { phone_number: whatsapp };
  if (slug) properties.Observações = { rich_text: [{ text: { content: `Quiz Avence Psi — slug: ${slug}` } }] };

  const notionRes = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties }),
  });

  if (!notionRes.ok) {
    const detail = await notionRes.text();
    res.status(502).json({ error: "Notion recusou a requisição", detail });
    return;
  }

  res.status(200).json({ ok: true });
}
