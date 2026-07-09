// Vercel serverless function — cria uma sessão de checkout (assinatura
// recorrente) na Asaas pro dono autenticado da requisição.
import { createClient } from "@supabase/supabase-js";

const PLANS = {
  monthly: { cycle: "MONTHLY", value: 49.90 },
  yearly: { cycle: "YEARLY", value: 358.80 },
};

const ASAAS_BASE = process.env.ASAAS_ENV === "production"
  ? "https://api.asaas.com/v3"
  : "https://api-sandbox.asaas.com/v3";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { plan, name, email } = req.body || {};
  const planConfig = PLANS[plan];
  if (!planConfig) {
    res.status(400).json({ error: "plan inválido (use 'monthly' ou 'yearly')" });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Token ausente" });
    return;
  }

  // client anon só pra validar o JWT de quem chamou
  const authClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "Sessão inválida" });
    return;
  }
  const ownerId = userData.user.id;

  // client com service role pra gravar a correlação checkout → owner
  // (a tabela subscriptions só aceita escrita via service role)
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  const origin = req.headers.origin || `https://${req.headers.host}`;

  const payload = {
    // RECURRENT só aceita CREDIT_CARD na Asaas (Pix não permite débito automático)
    billingTypes: ["CREDIT_CARD"],
    chargeTypes: ["RECURRENT"],
    minutesToExpire: 60,
    externalReference: ownerId,
    callback: {
      successUrl: `${origin}/?checkout=success`,
      cancelUrl: `${origin}/?checkout=cancel`,
    },
    // sem customerData: a própria página da Asaas coleta nome/e-mail/CPF/endereço.
    // Se enviarmos customerData parcial, a Asaas passa a exigir TODOS os campos
    // (CPF, telefone, endereço) no payload em vez de deixar a pessoa preencher lá.
    items: [{ name: "Assinatura Avence Psi", quantity: 1, value: planConfig.value }],
    subscription: { cycle: planConfig.cycle, nextDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
  };

  const asaasRes = await fetch(`${ASAAS_BASE}/checkouts`, {
    method: "POST",
    headers: {
      access_token: process.env.ASAAS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!asaasRes.ok) {
    const detail = await asaasRes.text();
    res.status(502).json({ error: "Asaas recusou a requisição", detail });
    return;
  }

  const data = await asaasRes.json();
  const url = data.link || data.url;
  // o externalReference não propaga do checkout pro payment gerado na Asaas,
  // então guardamos a correlação checkout → owner no nosso próprio banco.
  const checkoutId = data.id || url?.split("/").filter(Boolean).pop();
  await supabase.from("subscriptions").upsert({
    owner_id: ownerId,
    plan,
    asaas_checkout_id: checkoutId,
    status: "inactive",
  });

  res.status(200).json({ url });
}
