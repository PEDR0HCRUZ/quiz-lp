-- =====================================================
-- PsiPage — Âncora por telefone (MVP de validação)
-- Guarda o WhatsApp na página criada pra, no futuro, dar pra recuperar a
-- página pelo telefone (em vez de a pessoa ter que refazer). NÃO é auth: o
-- telefone não é verificado, é só um identificador/âncora. O acesso real
-- continua sendo e-mail + OTP (fase seguinte). ADITIVA e retrocompatível.
-- =====================================================

-- telefone normalizado (só dígitos), gravado na criação do site trial.
alter table sites add column if not exists phone text;
create index if not exists sites_phone_idx on sites (phone);

-- Obs: a recuperação POR telefone (buscar a página digitando o número) ainda
-- não existe — fica pra quando formos ligar a cobrança. Por ora o telefone só
-- é gravado pra não se perder. Antes do lançamento pra público geral, revisar
-- a policy de leitura pública (hoje expõe answers/phone das linhas trial) pra
-- restringir o que sai na API anônima.
