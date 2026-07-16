-- =====================================================
-- Avence Psi / PsiPage — Migração pro fluxo de quiz selecionável
-- (novo onboarding sem login inicial + trial de 24h + plano único).
-- ADITIVA e retrocompatível: a versão do chat (main, em produção) usa o
-- mesmo banco e continua lendo status = 'published'. Aqui só ADICIONAMOS
-- os status novos e colunas, sem renomear/apagar nada. Rodar uma vez.
-- =====================================================

-- 1) Novos status possíveis pro site:
--    draft     — quiz em andamento / ainda não publicado (só o dono vê)
--    published — LEGADO do chat, mantido pra não quebrar produção
--    trial     — publicado, janela de 24h antes de pagar (público)
--    active    — assinatura paga, site no ar + admin liberado (público)
--    blocked   — trial expirou sem pagamento (público, mas mostra tela de "expirado")
alter table sites drop constraint if exists sites_status_check;
alter table sites
  add constraint sites_status_check
  check (status in ('draft', 'published', 'trial', 'active', 'blocked'));

-- 2) Fim do trial de 24h (nulo enquanto draft; setado ao publicar como trial).
alter table sites
  add column if not exists trial_expires_at timestamptz;

-- 3) Marca se a pessoa já trocou o slug aleatório pelo personalizado (feature paga).
alter table sites
  add column if not exists slug_custom boolean not null default false;

-- índice pra o cron varrer trials vencidos com eficiência
create index if not exists sites_trial_expires_idx on sites (trial_expires_at)
  where status = 'trial';

-- 4) Leitura pública: além de 'published' (legado), libera trial/active/blocked
--    (blocked precisa ser legível pra página pública renderizar a tela de
--    "site expirado"). 'draft' segue só pro dono.
drop policy if exists "leitura pública de publicados, dono vê o próprio rascunho" on sites;
create policy "leitura pública de publicados/no ar, dono vê o próprio"
  on sites for select
  using (
    status in ('published', 'trial', 'active', 'blocked')
    or owner_id = auth.uid()
  );

-- insert/update policies seguem as mesmas (dono cria/atualiza o próprio site).
