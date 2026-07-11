-- =====================================================
-- Avence Psi — Assinatura recorrente (Asaas)
-- Rodar uma vez no SQL Editor do projeto Supabase
-- =====================================================

create table if not exists subscriptions (
  owner_id              uuid primary key references auth.users(id) on delete cascade,
  asaas_customer_id     text,
  asaas_subscription_id text,
  plan                  text check (plan in ('monthly', 'yearly')),
  status                text not null default 'inactive' check (status in ('inactive', 'active', 'overdue', 'cancelled')),
  current_period_end    date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_updated_at on subscriptions;
create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();

alter table subscriptions enable row level security;

drop policy if exists "dono lê a própria assinatura" on subscriptions;
create policy "dono lê a própria assinatura"
  on subscriptions for select
  using (owner_id = auth.uid());

-- sem policy de insert/update: só o webhook (service role) escreve aqui.
