-- =====================================================
-- Avence Psi — correlação de checkout (fix: externalReference não
-- propaga do checkout pro payment na Asaas). Rodar uma vez.
-- =====================================================

alter table subscriptions
  add column if not exists asaas_checkout_id text;

create index if not exists subscriptions_checkout_id_idx on subscriptions (asaas_checkout_id);
create index if not exists subscriptions_subscription_id_idx on subscriptions (asaas_subscription_id);
