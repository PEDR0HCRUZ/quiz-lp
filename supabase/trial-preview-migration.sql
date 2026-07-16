-- =====================================================
-- Avence Psi / PsiPage — Tela de sucesso pré-conta (Fase 2b)
-- Permite criar um site "trial" ANTES de existir conta/login, pra gerar um
-- link temporário logo após o quiz (antes de pedir e-mail). Quando a pessoa
-- cria conta depois, esse mesmo registro é vinculado ao owner_id (UPDATE),
-- em vez de criar um site novo. ADITIVA e retrocompatível.
-- =====================================================

-- 1) owner_id passa a aceitar null (site sem dono ainda, enquanto anônimo).
--    O unique constraint em si não bloqueia múltiplos NULLs no Postgres,
--    então não precisa ser removido.
alter table sites alter column owner_id drop not null;

-- 2) Permite inserir um site anônimo (owner_id is null, status = 'trial')
--    e permite ao dono "adotar" um site anônimo (claim) via update.
drop policy if exists "dono cria seu site" on sites;
create policy "dono cria seu site ou site anônimo em trial"
  on sites for insert
  with check (
    owner_id = auth.uid()
    or (owner_id is null and status = 'trial')
  );

drop policy if exists "dono atualiza seu site" on sites;
create policy "dono atualiza seu site ou reivindica site anônimo"
  on sites for update
  using (owner_id = auth.uid() or owner_id is null)
  with check (owner_id = auth.uid());
