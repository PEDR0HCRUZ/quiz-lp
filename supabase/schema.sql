-- =====================================================
-- Avence Psi — Setup do banco
-- Rodar uma vez no SQL Editor do projeto Supabase novo
-- =====================================================

create table if not exists sites (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references auth.users(id) on delete cascade,
  slug        text not null unique,
  status      text not null default 'draft' check (status in ('draft', 'published')),
  data        jsonb not null default '{}',
  answers     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists sites_slug_idx on sites (slug);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sites_updated_at on sites;
create trigger sites_updated_at
  before update on sites
  for each row execute function update_updated_at();

alter table sites enable row level security;

drop policy if exists "leitura pública de publicados, dono vê o próprio rascunho" on sites;
create policy "leitura pública de publicados, dono vê o próprio rascunho"
  on sites for select
  using (status = 'published' or owner_id = auth.uid());

drop policy if exists "dono cria seu site" on sites;
create policy "dono cria seu site"
  on sites for insert
  with check (owner_id = auth.uid());

drop policy if exists "dono atualiza seu site" on sites;
create policy "dono atualiza seu site"
  on sites for update
  using (owner_id = auth.uid());
