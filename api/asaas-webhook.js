// Vercel serverless function — recebe eventos de webhook da Asaas e
// atualiza a tabela subscriptions. Usa a service role do Supabase porque
// não existe sessão de usuário nesse contexto (RLS não se aplica).
import { createClient } from "@supabase/supabase-js";

const ACTIVE_EVENTS = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "SUBSCRIPTION_CREATED"];
const OVERDUE_EVENTS = ["PAYMENT_OVERDUE"];
const CANCELLED_EVENTS = ["SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.headers["asaas-access-token"] !== process.env.ASAAS_WEBHOOK_TOKEN) {
    res.status(401).json({ error: "Token de webhook inválido" });
    return;
  }

  const { event, payment, subscription } = req.body || {};
  const externalReference = payment?.externalReference || subscription?.externalReference;
  if (!externalReference) {
    // evento sem referência pra correlacionar (ex: eventos de conta) — ignora sem erro
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  let statusUpdate = null;
  if (ACTIVE_EVENTS.includes(event)) statusUpdate = "active";
  else if (OVERDUE_EVENTS.includes(event)) statusUpdate = "overdue";
  else if (CANCELLED_EVENTS.includes(event)) statusUpdate = "cancelled";

  if (!statusUpdate) {
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  const { error } = await supabase.from("subscriptions").upsert({
    owner_id: externalReference,
    status: statusUpdate,
    asaas_subscription_id: payment?.subscription || subscription?.id || null,
    current_period_end: payment?.dueDate || null,
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
