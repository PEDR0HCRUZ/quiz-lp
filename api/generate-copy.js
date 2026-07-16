// Vercel serverless function — usa a OpenAI pra escrever headline, subheadline,
// texto de método e bio únicos, combinando nome + especialidade + abordagem +
// tom do quiz. Chamada é bloqueante (o front espera a resposta antes de mostrar
// o site), então o timeout aqui precisa ser curto — se estourar ou falhar, quem
// chamou (runGeneration, em App.jsx) já sabe cair pros DEFAULTS determinísticos.
const TIMEOUT_MS = 6000;
const MODEL = "gpt-4o-mini";
// a IA só ESCOLHE entre essas variantes pré-construídas (App.jsx: SpecialtiesGrid/
// Lista/Destaque) — nunca gera layout livre, então o pior caso é uma escolha
// "sem graça", nunca uma UI quebrada.
const SPECIALTIES_VARIANTS = ["grid", "lista", "destaque"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY não configurada" });
    return;
  }

  const { name, especialidade, abordagem, modalidade, tom, temas, sobre } = req.body || {};
  if (!name) {
    res.status(400).json({ error: "name é obrigatório" });
    return;
  }

  const especialidadesList = Array.isArray(especialidade) && especialidade.length
    ? especialidade
    : ["psicoterapia geral"];
  const temasList = Array.isArray(temas) && temas.length ? temas : especialidadesList;

  const prompt = `Escreva os textos do site de ${name}, psicólogo(a) no Brasil.

Dados do quiz:
- Especialidade(s): ${especialidadesList.join(", ")}
- Abordagem clínica: ${abordagem || "não informada"}
- Temas que mais atende: ${temasList.join(", ")}
- Modalidade de atendimento: ${modalidade || "não informada"}
- Tom de voz desejado: ${tom || "acolhedor"}
${sobre ? `- Já escreveu sobre si: "${sobre}"` : ""}

Gere um JSON com exatamente estas chaves, todas em português do Brasil, sem markdown:
- "headline": frase curta e marcante pro topo do site (máx. 8 palavras), evocando o que a terapia oferece — evite clichês genéricos como "equilíbrio emocional através da terapia".
- "subheadline": uma frase (máx. 18 palavras) que amarre a abordagem (${abordagem || "a especialidade"}) com os temas atendidos, no tom pedido.
- "methodText": 2 parágrafos curtos (separados por \\n\\n) explicando como ${name} trabalha, mencionando a abordagem clínica de forma concreta, não genérica.
- "bio": 2-3 frases em primeira pessoa, no tom pedido, que soem como algo que ${name} escreveria sobre por que faz esse trabalho.
- "specialties": array de objetos {"t": tema, "d": descrição}, um pra cada um destes temas nesta ordem exata: ${temasList.map((t) => `"${t}"`).join(", ")}. Cada "d" é uma frase curta (máx. 16 palavras) específica pra aquele tema combinado com a abordagem ${abordagem || "escolhida"} — nada de frase genérica repetida entre os temas.
- "specialtiesVariant": escolha exatamente um destes valores — "grid" (cards uniformes, bom pra 4+ temas variados), "lista" (lista numerada, bom quando os temas pedem mais explicação/leitura), "destaque" (1 tema em card grande + resto pequeno — só escolha "destaque" se houver PELO MENOS 3 temas na lista acima E um deles for claramente o foco principal; com 2 temas ou menos, ou sem foco claro, use "grid"). Escolha pensando em qual comunica melhor ESSA combinação específica de temas.

Regras: nada de placeholder ou texto de exemplo. Não repita a mesma frase em headline e subheadline. Seja específico à combinação de especialidade + abordagem, não genérico. Cada descrição de specialties precisa ser diferente das outras.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.9,
        max_tokens: 900,
      }),
      signal: controller.signal,
    });

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      res.status(502).json({ error: "OpenAI recusou a requisição", detail });
      return;
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content;
    const copy = JSON.parse(content);

    const { headline, subheadline, methodText, bio, specialties, specialtiesVariant } = copy;
    if (!headline || !subheadline || !methodText || !bio || !Array.isArray(specialties) || !specialties.length) {
      res.status(502).json({ error: "Resposta da OpenAI incompleta" });
      return;
    }
    // nunca confia cegamente na escolha da IA — se vier fora do enum, cai no
    // layout original ("grid"), que se sustenta com qualquer quantidade de itens.
    const safeVariant = SPECIALTIES_VARIANTS.includes(specialtiesVariant) ? specialtiesVariant : "grid";

    res.status(200).json({ headline, subheadline, methodText, bio, specialties, specialtiesVariant: safeVariant });
  } catch (err) {
    const isAbort = err.name === "AbortError";
    res.status(isAbort ? 504 : 500).json({ error: isAbort ? "Timeout na OpenAI" : "Erro ao gerar copy", detail: String(err) });
  } finally {
    clearTimeout(timeout);
  }
}
