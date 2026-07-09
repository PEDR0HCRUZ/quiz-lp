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
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
  console.log("[asaas-webhook] event:", event, "payment.subscription:", payment?.subscription, "payment.checkoutSession:", payment?.checkoutSession, "subscription?.id:", subscription?.id);

  // o externalReference não propaga do checkout pro payment/subscription na
  // Asaas, então correlacionamos pelo que a gente mesmo salvou em
  // api/checkout.js: primeiro pelo asaas_subscription_id (cobranças
  // seguintes, já sabemos qual assinatura é), senão pelo asaas_checkout_id
  // (primeiro pagamento, ainda não tínhamos o id da assinatura).
  const subId = payment?.subscription || subscription?.id || null;
  const checkoutId = payment?.checkoutSession || null;

  let ownerId = null;
  if (subId) {
    const { data } = await supabase.from("subscriptions").select("owner_id").eq("asaas_subscription_id", subId).maybeSingle();
    ownerId = data?.owner_id || null;
  }
  if (!ownerId && checkoutId) {
    const { data } = await supabase.from("subscriptions").select("owner_id").eq("asaas_checkout_id", checkoutId).maybeSingle();
    ownerId = data?.owner_id || null;
  }
  console.log("[asaas-webhook] ownerId encontrado:", ownerId);
  if (!ownerId) {
    // não achamos correlação nenhuma — ignora sem erro (ex: evento de conta, ou checkout de outro teste)
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  let statusUpdate = null;
  if (ACTIVE_EVENTS.includes(event)) statusUpdate = "active";
  else if (OVERDUE_EVENTS.includes(event)) statusUpdate = "overdue";
  else if (CANCELLED_EVENTS.includes(event)) statusUpdate = "cancelled";

  console.log("[asaas-webhook] statusUpdate:", statusUpdate, "subId:", subId);

  // mesmo em eventos que não ativam nada (ex: PAYMENT_CREATED), grava o
  // asaas_subscription_id assim que ele aparecer — eventos futuros (tipo
  // SUBSCRIPTION_CREATED) chegam só com o id da assinatura, sem
  // checkoutSession, e dependem desse backfill pra conseguir correlacionar.
  if (!subId && !statusUpdate) {
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  const payload = { owner_id: ownerId };
  if (subId) payload.asaas_subscription_id = subId;
  if (statusUpdate) payload.status = statusUpdate;
  if (payment?.dueDate) payload.current_period_end = payment.dueDate;

  const { error } = await supabase.from("subscriptions").upsert(payload);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
