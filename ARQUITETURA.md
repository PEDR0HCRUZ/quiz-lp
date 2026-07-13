# PsiPage (Avence Psi) — Guia de arquitetura

> Documento de contexto pra quem (pessoa ou IA) for continuar o projeto.
> Escrito em jul/2026. O produto nasceu como **"Avence Psi"** e foi
> renomeado pra **"PsiPage"** numa mudança do sócio (Igor) no `main`.

---

## 1. O que é

App que **cria landing pages para psicólogos através de um quiz conversacional**.
A psicóloga responde algumas perguntas num chat (tipo conversa), o app gera um
site pronto a partir das respostas, ela pode **editar visualmente**, escolher
**tema** e **paleta de cores**, e **publicar** numa URL pública
(`dominio.com/nome-dela`). Publicar é o que a assinatura paga libera.

Canal de conversão único: **WhatsApp** (todos os CTAs levam pro wa.me).

---

## 2. Stack

- **Vite + React 18** (SPA, sem SSR). **Sem Tailwind** — tudo é **estilo inline**
  (objetos `style={{...}}`), no mesmo estilo do código original exportado do
  Canvas do Claude. Manter esse padrão ao editar.
- **lucide-react** pra ícones.
- **Supabase** (Postgres + Auth) — banco, autenticação, RLS.
- **Vercel** — hospedagem + funções serverless (`api/*.js`) pra tudo que precisa
  de segredo no servidor.
- Fontes: Google Fonts (Fraunces + Inter no tema Clássico; Instrument Serif +
  Work Sans no tema Autoral).

---

## 3. Repositório, branches e ambientes

Repo GitHub: `PEDR0HCRUZ/quiz-lp`.

**Branches (são checkpoints importantes — não apagar sem combinar):**
- `main` — versão do Igor, **em produção**. Já contém o editor visual (PR #1
  mergeado) + a mudança dele "preview ao vivo no chat + MVP mobile chat-only".
- `feature/editor` — o editor visual (já mergeado no main via PR #1).
- `feature/asaas-subscription` — checkpoint anterior (Asaas + temas + login).
- Tag `pre-editor` — marco do site estável antes do editor.

**Ambientes Vercel (dois projetos separados):**
- **`psi-avence`** → `https://psi-avence.vercel.app` — **PRODUÇÃO** (serve o `main`).
- **`psi-avence-dev`** → `https://psi-avence-dev.vercel.app` — **DEV/teste** (onde
  o Pedro testa as branches dele).

⚠️ O `.vercel/project.json` fica linkado ao **psi-avence-dev** por padrão. Deploy
é **manual** (`npx vercel deploy --prod --yes`) — não há auto-deploy do GitHub.
Pra deployar em produção: `vercel link --yes --project psi-avence`, deploya, e
**religa de volta pro dev** copiando o project.json de volta (pra não mandar dev
pra produção sem querer).

---

## 4. Estrutura de arquivos

```
Quiz Landing Pages/
├── index.html              # meta tags / OG base (Igor renomeou pra PsiPage)
├── vite.config.js
├── vercel.json             # rewrites SPA (tudo -> index.html)
├── middleware.js           # injeta meta tags/OG por site publicado (SEO)
├── api/                    # funções serverless da Vercel (Node, usam process.env)
│   ├── checkout.js         # cria checkout de assinatura na Asaas
│   ├── asaas-webhook.js    # recebe eventos da Asaas e atualiza subscriptions
│   ├── lead.js             # manda lead pro Notion (precisa NOTION_TOKEN)
│   └── og.js               # gera a og:image dinâmica (@vercel/og, Edge)
├── src/
│   ├── main.jsx            # entrypoint React
│   ├── App.jsx             # TUDO: quiz, fases, tema Clássico (SitePreview),
│   │                       #   painel, editor visual, auth, publicação
│   ├── ThemeEditorial.jsx  # tema "Autoral" (SitePreviewEditorial)
│   ├── colorSchemes.js     # 6 paletas (accent/accentSoft) + helper darken()
│   ├── editorControls.jsx  # ListEditor/inputStyle/Label do editor visual
│   └── lib/
│       ├── supabase.js     # client Supabase (anon)
│       └── slug.js         # slugify + withSuffix (gera slug único do site)
├── supabase/               # SQL pra rodar no painel do Supabase (uma vez)
│   ├── schema.sql          # tabela sites + RLS
│   ├── subscriptions.sql   # tabela subscriptions + RLS
│   ├── subscriptions-add-checkout-id.sql
│   └── email-templates.html# templates de e-mail do Supabase Auth (referência)
└── avence-psi-*.jsx        # protótipos v1 (quiz e conversa) — NÃO são o app atual,
                            #   servem de referência (o editorControls veio daí)
```

**O coração é `src/App.jsx`** (~1600 linhas). Quase tudo mora nele.

---

## 5. Modelo de dados (Supabase)

### Tabela `sites` (schema.sql)
Um site por conta (`owner_id` unique). Colunas principais:
- `owner_id` (uuid, FK auth.users, unique)
- `slug` (text, unique) — a URL pública (`/slug`)
- `status` (`draft` | `published`)
- `data` (jsonb) — **o site inteiro** (ver objeto abaixo)
- `answers` (jsonb) — respostas cruas do quiz

**RLS:** leitura pública só de `published` (ou o dono vê o próprio rascunho);
escrita só do dono.

**O objeto `data` (o "site")** tem os campos: `name`, `email`, `title`,
`headline`, `subheadline`, `badge`, `specialties[{t,d}]`, `benefits[{t,d}]`,
`methodTitle`, `methodText`, `bio`, `faq[{q,a}]`, `photo` (data URI ou URL),
`logo`, `whatsapp`, `instagram`, `endereco`, `modalidade`, `waMessage`,
`theme` (`classic`|`editorial`), `colorScheme` (nome da paleta).

### Tabela `subscriptions` (subscriptions.sql)
Assinatura por conta. `owner_id` PK, `status` (`inactive`|`active`|`overdue`|
`cancelled`), `plan` (`monthly`|`yearly`), `asaas_subscription_id`,
`asaas_checkout_id`, `current_period_end`. **Só o webhook escreve** (via service
role) — sem policy de insert/update pro usuário.

---

## 6. Fluxo do app (fases em `App.jsx`, estado `phase`)

`loading → welcome → chat → generating → site` (+ `public` pra páginas publicadas).

1. **welcome** — tela de login. Pede nome + e-mail → manda **código de acesso**
   por e-mail (OTP do Supabase). A pessoa cola o código de 6-8 dígitos.
2. **chat** — o quiz conversacional. Etapas (constante `FLOW`):
   `specialty → crp → modalidade → endereco (condicional: só se não for 100%
   online) → abordagem → temas → colorScheme → tom → sobre → logo → photo →
   whatsapp → instagram`. Respostas viram o objeto `data`.
3. **generating** — anima "gerando" e monta o site determinístico (`buildCopy`
   + `runGeneration`) a partir das respostas. **Sem IA** — é template + respostas.
   Salva como rascunho.
4. **site** — o **painel**: preview do site (num iframe) + coluna lateral
   (Tema/Paleta ou editor) + cabeçalho com Editar / Ver site / Recomeçar /
   Publicar. É aqui que vive o editor visual.
5. **public** (quando a URL é `/algum-slug`) — renderiza o site publicado
   direto (busca no Supabase pelo slug).

O objeto `data` gera o site via **dois temas** que recebem o mesmo `d`:
`SitePreview` (Clássico, em App.jsx) e `SitePreviewEditorial` (Autoral, em
ThemeEditorial.jsx). Ambos têm as mesmas seções, só muda a pegada visual.

---

## 7. Autenticação (magic link / código OTP)

- Login **sem senha** via `supabase.auth.signInWithOtp`. O e-mail traz um link
  E um **código** — a UI usa o **código** como caminho principal (resolve o
  problema do link abrir no navegador errado). Verifica com
  `supabase.auth.verifyOtp`.
- **SMTP customizado (Resend)** configurado no painel do Supabase (Authentication
  → Emails → SMTP) — o mailer padrão do Supabase tem rate limit baixo demais.
  Host `smtp.resend.com`, porta 465, usuário `resend`, senha = API key do Resend.
- **Domínio verificado no Resend:** `psi.avencestudio.com` (via Hostinger DNS).
  O remetente deve sair de um e-mail desse domínio (ex `login@psi.avencestudio.com`)
  pra não cair em spam. `onboarding@resend.dev` só entrega pro dono da conta e
  cai em spam.
- **Supabase → Authentication → URL Configuration:** Site URL e Redirect URLs
  precisam incluir a URL do ambiente (senão o link redireciona pro localhost).
- Os templates de e-mail estão personalizados (marca PsiPage) — ver
  `supabase/email-templates.html`.
- **Configurável:** tamanho do OTP (6-10 dígitos) em Authentication → Providers
  → Email. O input do app aceita até 8.

---

## 8. Serviços externos e variáveis de ambiente

**NUNCA commitar valores** — só nomes. Ficam no dashboard da Vercel (e `VITE_*`
no `.env` local pra dev).

| Variável | Onde | Pra quê |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client + server | conexão Supabase (público) |
| `SUPABASE_SERVICE_ROLE` | só server (api/) | webhook escreve em subscriptions sem sessão |
| `ASAAS_API_KEY` | server | criar checkout na Asaas |
| `ASAAS_ENV` | server | `production` ou vazio (sandbox) |
| `ASAAS_WEBHOOK_TOKEN` | server | valida que o webhook é da Asaas |
| `NOTION_TOKEN` | server | manda lead pro Notion (ainda não fornecido/ativo) |

**Asaas** (pagamento): checkout hospedado (`POST /v3/checkouts`), assinatura
RECORRENTE (só CREDIT_CARD, PIX não vale pra recorrente). Gotcha crítico: o
`externalReference` NÃO propaga do checkout pro webhook — a correlação
checkout→dono é salva no nosso banco (`asaas_checkout_id`/`asaas_subscription_id`).
Testado em sandbox. Base URL: `api-sandbox.asaas.com/v3` ou `api.asaas.com/v3`.

**Notion** (lead capture): `api/lead.js` posta na base "Pipeline de Clientes",
coluna checkbox "Leads Psi". Precisa do `NOTION_TOKEN` (integração Notion com a
base compartilhada) — **ainda pendente**.

---

## 9. O editor visual (feature nova, estilo Elementor)

No painel (fase `site`), botão **"Editar"** liga o `editMode`. Como funciona:

- **Por que funciona sem reescrever os temas:** o preview roda num `<iframe>`
  mas via **`createPortal` do React** — é a **mesma árvore React / mesmo contexto
  JS**. Então clique no preview fala direto com o estado do painel, sem
  `postMessage`.
- **Seleção:** elementos editáveis têm `data-edit="<campo>"` no JSX dos dois
  temas (ex `data-edit="headline"`, `data-edit="specialties.0"`,
  `data-edit="photo"`). Um handler delegado no `PreviewFrame` lê o `data-edit`
  no clique e seta `selectedField`. CSS de hover/selected (contorno azul) só
  vale quando `body.ed-active`.
- **Edição:** a coluna lateral vira contextual. `FIELD_REGISTRY` (em App.jsx)
  mapeia campo → `{ label, type }` (`text|textarea|image|list`). O controle é
  renderizado reaproveitando `editorControls.jsx` (ListEditor com add/remove).
- **Gravação:** `editField(campo, valor)` faz `setSite` (preview atualiza ao
  vivo) + `saveSite` com **debounce de 800ms**. Mantém o status (publicado
  continua publicado).
- **WhatsApp:** todos os CTAs têm `data-edit="whatsapp"` — clicar num CTA no
  modo edição edita o número.

**Pendências que o Pedro deixou pra segunda rodada:** reordenar itens de lista;
selecionar um card de especialidade individual (hoje clicar em qualquer card
abre a lista inteira). Ele ia testar e dizer o que mudar.

---

## 10. Publicação, SEO e og:image

- **Publicar:** `publishSite()` checa a assinatura ativa; sem assinatura, abre o
  seletor de plano → checkout Asaas. Com assinatura, grava `status: published`
  e gera slug único. Ao voltar do checkout (`?checkout=success`), publica sozinho.
- **SEO por site publicado:** `middleware.js` (Vercel Routing Middleware)
  intercepta rotas de slug, busca o site no Supabase e injeta `title`/
  `description`/`og:image` no HTML **antes** de responder (crawlers de preview
  não rodam JS, então precisa vir pronto).
- **og:image:** `api/og.js` (Edge, `@vercel/og`) gera um PNG 1200×630 com nome +
  headline + foto, buscando os dados pelo `slug` (a foto é data URI no banco;
  mandar pela querystring estourava a URL).

---

## 11. Temas e paletas

- **Dois temas:** `classic` (SitePreview, verde/neutro, fontes Fraunces+Inter) e
  `editorial`/"Autoral" (SitePreviewEditorial, terracota quente, Instrument
  Serif+Work Sans). Mesmas seções, visual diferente.
- **6 paletas** (`colorSchemes.js`): Sálvia, Terracota, Azul acinzentado, Areia,
  Lavanda suave, Terra rosada. Cada uma dá `accent` + `accentSoft`. Tons pastéis
  (nicho psicologia). A paleta é **independente do tema** — os blocos de
  contraste (metodologia, CTA) usam `darken(accent)` em vez de cores fixas.
- **Responsivo:** o respiro lateral é uma CSS var `--cpad` (32px desktop → 16px
  mobile) definida por media query nos blocos de `<style>`, usada nos paddings
  inline (é o truque pra media query "vazar" pro estilo inline). Imagens ocupam
  a largura toda no mobile.
- **Seções fixas com imagens de banco** (Unsplash, guardadas em `public/media/`):
  a seção "diferenciais" e a "sobre" usam fotos ilustrativas fixas; só o **hero**
  usa a foto que a psicóloga enviou.
- **Preview responsivo no painel:** seletor Desktop/Tablet/Mobile. O iframe **é**
  o dispositivo (largura simulada, rola por dentro) — não medir/sincronizar
  altura (tentativas anteriores davam barra fantasma e vão branco).

---

## 12. Como rodar / deployar

```bash
# dev local
npm run dev            # (ou o servidor já configurado) — precisa do .env com VITE_*

# build
npx vite build

# deploy DEV (psi-avence-dev) — .vercel já linkado nele
npx vercel deploy --prod --yes

# deploy PRODUÇÃO (psi-avence) — precisa religar antes:
npx vercel link --yes --project psi-avence
npx vercel deploy --prod --yes
# depois religar de volta pro dev (restaurar .vercel/project.json)
```

---

## 13. Convenções e cuidados

- **Estilo inline, sem Tailwind.** Ao editar um tema, siga o padrão dos objetos
  `style`.
- **Português** em toda a UI e comentários.
- **Nunca commitar segredos.** Chaves só no dashboard da Vercel / `.env` local.
- **Deploy é manual** e o `.vercel` fica no dev — cuidado pra não mandar dev pra
  produção. Sempre confira qual projeto está linkado antes de `vercel deploy`.
- **Dois temas + página pública + preview**: ao mexer no CSS/estrutura de um
  tema, lembrar que ele renderiza em 3 contextos (preview no painel via iframe,
  página pública direta, e og). As media queries/CSS vars vivem em blocos
  separados (`PREVIEW_FRAME_CSS`, o `fontStyle` da página pública, e o
  `EDITORIAL_STYLE_TAG`).
- **A última mudança do Igor no `main`** ("preview ao vivo no chat + MVP mobile
  chat-only") não foi revisada em detalhe por quem escreveu este doc — conferir
  o `git log`/diff do main pra entender o que ele fez de novo no chat/mobile.
