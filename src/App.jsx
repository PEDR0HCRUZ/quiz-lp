import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight, Send, MessageCircle, Instagram, Mail, Check,
  Sparkles, Loader2, Pencil, X, Plus, Image as ImageIcon, MapPin,
  LogOut, ChevronDown, Inbox, Monitor, Tablet, Smartphone, Copy, ExternalLink,
  Link2, RefreshCw, Wand2,
} from "lucide-react";
import { supabase } from "./lib/supabase.js";
import { slugify, slugLive, withSuffix, randomSlug } from "./lib/slug.js";
import { SitePreviewEditorial } from "./ThemeEditorial.jsx";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, darken } from "./colorSchemes.js";
import { ListEditor, Label as EdLabel, inputStyle as edInput } from "./editorControls.jsx";
import OnboardingQuiz from "./quiz/OnboardingQuiz.jsx";

/* ------------------------------------------------------------------ */
/*  PsiPage — v2: onboarding conversacional + login por magic link   */
/*  1) welcome (nome/email → magic link)  2) conversa suave              */
/*  3) copy determinística  4) site pronto → publica no Supabase.        */
/*  Funil de canal único: WhatsApp.                                      */
/* ------------------------------------------------------------------ */

// tokens do design system Avence Psi (ver avence-psi-design-system.html) —
// única fonte de verdade de cor pras telas do app (landing, auth, editor).
// "dark"/"bubbleUser" apontam pro grafite (--ink), que é o preenchimento do
// botão primário sólido no DS — sálvia nunca é usado em botão, só em foco/seleção.
const C = {
  paper: "#F7F3EC", panel: "#FFFFFF", ink: "#2A2622", sub: "#6B635A",
  line: "#DDD4C6", sage: "#5E7361", sageSoft: "#DCE4DA",
  clay: "#B7784F", claySoft: "#F3E4DA", danger: "#A8443A", dangerSoft: "#F6E3E1",
  dark: "#2A2622", bubbleUser: "#2A2622",
};

// largura máxima do conteúdo das seções do site publicado + respiro lateral em telas pequenas
const CONTAINER_MAX = 1216;
const CONTAINER_PAD = 32;
// respiro lateral como CSS var: 32px no desktop, 16px no mobile (a var é
// redefinida por media query nos blocos de <style>). Usado inline, então
// a media query consegue "vazar" pra dentro do estilo inline via a variável.
const CPAD = `var(--cpad, ${CONTAINER_PAD}px)`;

/* ------------------------- template base -------------------------- */
const DEFAULTS = {
  badge: "Atendimento 100% Online",
  headline: "Equilíbrio emocional através da terapia.",
  subheadline: "Psicoterapia baseada em evidências, no seu ritmo.",
  specialties: [
    { t: "Ansiedade", d: "Recupere o equilíbrio emocional e viva com mais tranquilidade." },
    { t: "Autoestima", d: "Reconstrua uma relação mais gentil e confiante consigo mesmo." },
    { t: "Relacionamentos", d: "Fortaleça vínculos com comunicação mais assertiva." },
    { t: "Autoconhecimento", d: "Um espaço seguro para se compreender e crescer." },
  ],
  benefits: [
    { t: "Conforto", d: "Sessões no ambiente onde você se sente mais seguro." },
    { t: "Acessibilidade", d: "Atendimento onde você estiver." },
    { t: "Economia", d: "Sem deslocamento nem tempo no trânsito." },
    { t: "Privacidade", d: "Plataforma de vídeo segura e criptografada." },
  ],
  methodTitle: "Sobre a abordagem",
  methodText: "Uma escuta clínica baseada em evidências, colaborativa e respeitosa com o seu tempo.\n\nO trabalho é conjunto: identificamos padrões que geram sofrimento e desenvolvemos recursos mais saudáveis.",
  bio: "Busco proporcionar um ambiente acolhedor e seguro, onde você possa se expressar livremente.",
  faq: [
    { q: "Como funciona o atendimento?", a: "Sessões semanais de 50 minutos, por videochamada." },
    { q: "Aceita convênio?", a: "O atendimento é particular. Emito recibo para reembolso." },
    { q: "Atende online?", a: "Sim, para todo o Brasil." },
    { q: "Menor de idade pode agendar?", a: "Sim, com consentimento dos responsáveis." },
  ],
};

/* ---- valores determinísticos: a SELEÇÃO manda, a IA só completa ---- */
const BADGE_BY_MODALIDADE = {
  "100% Online": "Atendimento 100% Online",
  "Presencial": "Atendimento presencial",
  "Híbrido": "Atendimento online e presencial",
};
const KNOWN_APPROACHES = ["TCC", "Psicanálise", "Humanista", "Gestalt"];
const GENERIC_SPEC_DESC =
  "Um espaço seguro e acolhedor para trabalhar essa questão com método e cuidado.";
const SPECIALTY_TITLES = [
  "Psicólogo(a) Clínico(a)", "Psicanalista", "Terapeuta Cognitivo-Comportamental",
  "Neuropsicólogo(a)", "Psicólogo(a) Infantil", "Psicólogo(a) Organizacional",
  "Psicoterapeuta de Casais", "Psicólogo(a) Hospitalar",
];
// prefixo do CRP fica fixo — a pessoa só escolhe a região e digita o número
const CRP_PREFIXES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

// metadados de tipografia dos dois temas do site — usados no preview combinado
// tema + paleta na etapa "themeStyle" do onboarding (ver THEME_META abaixo).
const THEME_META = {
  classic: { label: "Clássico", desc: "Serifada elegante, atemporal.", headingFont: "'Fraunces', serif", bodyFont: "'Inter', sans-serif", headingWeight: 600, headingStyle: "normal" },
  editorial: { label: "Autoral", desc: "Editorial quente, com personalidade.", headingFont: "'Instrument Serif', serif", bodyFont: "'Work Sans', sans-serif", headingWeight: 400, headingStyle: "italic" },
};

/* ---------------------------- conversa ---------------------------- */
const FLOW = [
  { key: "name", bot: "Oi! 🌱 Antes de começar, como você se chama?", ph: "Seu nome", type: "text" },
  { key: "themeStyle", bot: "Prazer, {first}! Vamos começar pelo visual — escolhe o estilo do site. Primeiro o tema, depois a paleta de cores. Dá pra trocar tudo depois.", type: "themeStyle" },
  { key: "link", bot: "Show! Agora escolhe o link do seu site — é por ele que seus pacientes vão te encontrar.", type: "link" },
  { key: "specialty", bot: "Qual é a sua especialidade?", type: "specialty" },
  { key: "crp", bot: "E o seu registro profissional?", type: "crp" },
  { key: "modalidade", bot: "E você atende de que forma?", type: "chips", options: ["100% Online", "Presencial", "Híbrido"] },
  { key: "endereco", bot: "Qual o endereço do consultório? Vai aparecer no rodapé do site, com um mapa.", ph: "Rua, número, bairro, cidade - UF", type: "text",
    skipIf: (a) => a.modalidade === "100% Online" },
  { key: "abordagem", bot: "Qual é a sua abordagem principal?", type: "chips", options: ["TCC", "Psicanálise", "Humanista", "Gestalt"], allowText: true, ph: "Outra..." },
  { key: "temas", bot: "Quais temas você mais atende? Selecione quantos quiser — e adicione os seus no campo abaixo.", type: "cards",
    options: ["Ansiedade", "Depressão", "Autoestima", "Autoconhecimento", "Relacionamentos", "Luto", "Estresse / Burnout", "Traumas", "Síndrome do pânico", "TOC", "Fobias", "Maternidade / Parentalidade"] },
  { key: "tom", bot: "Que tom combina mais com você?", type: "chips", options: ["Acolhedor", "Leve e próximo", "Direto", "Técnico"] },
  { key: "sobre", bot: "Me conta em poucas frases o que te move como profissional. Se quiser, use um dos começos abaixo — eu já deixo uma frase pronta (no tom que você escolheu) que você pode editar.", ph: "escreva do seu jeito...", type: "text",
    // uma versão de cada começo por tom (etapa anterior) — pra sugestão
    // combinar com o jeito que ela disse que queria soar, não só um texto genérico.
    startersByTone: {
      "Acolhedor": [
        { label: "Acredito que…", template: "Acredito que cada pessoa carrega dentro de si a capacidade de se reconectar consigo mesma, compreender suas próprias dores com carinho e construir, no seu tempo, uma vida com mais leveza, sentido e acolhimento para lidar com os desafios do dia a dia." },
        { label: "O mundo pode ser melhor através da…", template: "O mundo pode ser melhor através da escuta acolhedora, do cuidado genuíno e de relações mais gentis entre as pessoas — por isso acredito tanto no valor da terapia como um espaço seguro de transformação, capaz de gerar mudanças reais na forma como nos relacionamos com nós mesmos e com o outro." },
        { label: "Meu propósito é…", template: "Meu propósito é acompanhar pessoas em momentos delicados de transformação, oferecendo um colo emocional, um espaço seguro e livre de julgamentos para que possam se conhecer melhor, entender seus padrões e desenvolver recursos mais saudáveis para viver com mais autonomia e bem-estar." },
        { label: "Escolhi essa profissão porque…", template: "Escolhi essa profissão porque acredito no poder da escuta afetuosa e no impacto que ela pode ter na vida das pessoas — ao longo da minha trajetória, percebi que oferecer um espaço de cuidado genuíno é capaz de transformar histórias e ajudar cada pessoa a se relacionar com mais gentileza consigo mesma." },
      ],
      "Leve e próximo": [
        { label: "Acredito que…", template: "Acredito que a gente não precisa ter tudo resolvido pra merecer um espaço de escuta — cada pessoa tem sua própria bagagem, seu próprio ritmo, e é justamente por isso que gosto tanto de caminhar ao lado de quem topa se olhar com mais gentileza e leveza no dia a dia." },
        { label: "O mundo pode ser melhor através da…", template: "O mundo pode ser melhor através da conversa sincera, daquele papo que não julga e que ajuda a gente a se entender um pouco mais. É por isso que acredito na terapia como um espaço leve, próximo e sem formalidade, onde dá pra ser você mesma de verdade e ainda assim crescer." },
        { label: "Meu propósito é…", template: "Meu propósito é estar perto de quem tá passando por uma fase de mudança, sem cobrança e sem julgamento — só presença de verdade. Gosto de pensar a terapia como uma conversa boa, daquelas que ajudam a clarear a cabeça e encontrar um caminho mais leve pra seguir em frente." },
        { label: "Escolhi essa profissão porque…", template: "Escolhi essa profissão porque sempre gostei de ouvir as pessoas de verdade, sem pressa e sem julgamento. Com o tempo percebi que esse tipo de escuta próxima e sem formalidade pode fazer uma diferença enorme na vida de alguém — e é exatamente isso que quero oferecer." },
      ],
      "Direto": [
        { label: "Acredito que…", template: "Acredito que mudança real exige clareza, compromisso e ação — não só reflexão. Meu trabalho é ajudar você a identificar o que está travando seu progresso, entender os padrões por trás disso e sair da sessão com direções concretas para aplicar no seu dia a dia." },
        { label: "O mundo pode ser melhor através da…", template: "O mundo pode ser melhor através da terapia orientada a resultados — sem enrolação, sem sessões que não levam a lugar nenhum. Trabalho para que cada encontro tenha um propósito claro e que você saia com ferramentas práticas para lidar com o que precisa ser resolvido." },
        { label: "Meu propósito é…", template: "Meu propósito é ajudar você a sair do ciclo em que está preso e avançar de forma objetiva. Não acredito em terapia sem direção — cada sessão tem um foco, e o objetivo é sempre te aproximar de mudanças reais e mensuráveis na sua vida, sem enrolação." },
        { label: "Escolhi essa profissão porque…", template: "Escolhi essa profissão porque quero gerar resultado de verdade na vida das pessoas, não só oferecer um espaço para desabafar. Acredito em terapia com direção clara, metas definidas e progresso que pode ser sentido e percebido ao longo do processo." },
      ],
      "Técnico": [
        { label: "Acredito que…", template: "Acredito que a prática clínica deve ser fundamentada em evidências científicas sólidas, com metodologia clara e acompanhamento sistemático da evolução do paciente. Minha abordagem combina rigor técnico e responsabilidade ética para garantir resultados consistentes e mensuráveis." },
        { label: "O mundo pode ser melhor através da…", template: "O mundo pode ser melhor através da aplicação criteriosa de métodos terapêuticos validados cientificamente, com protocolos estruturados e avaliação contínua de progresso. Defendo uma prática clínica pautada em evidências, ética profissional e atualização constante do conhecimento técnico." },
        { label: "Meu propósito é…", template: "Meu propósito é conduzir o processo terapêutico com base em fundamentação técnica sólida, utilizando instrumentos de avaliação adequados e intervenções baseadas em evidências científicas, sempre respeitando as diretrizes éticas da profissão e as particularidades de cada caso clínico." },
        { label: "Escolhi essa profissão porque…", template: "Escolhi essa profissão porque me interesso profundamente pelos processos cognitivos e comportamentais humanos, e pela possibilidade de aplicar conhecimento científico validado para promover mudanças estruturadas e duradouras na vida dos pacientes, com metodologia clara e mensurável." },
      ],
    } },
  { key: "logo", bot: "Você já tem uma logo? Se tiver, me manda o arquivo (de preferência em PNG). Se não tiver, sem problema — seu nome aparece no topo do site.", type: "image" },
  { key: "photo", bot: "Pra deixar o site com a sua cara, envie uma foto profissional. Ela vai aparecer no topo e na seção “sobre”. Pode pular e adicionar depois.", type: "image" },
  { key: "whatsapp", bot: "Quase lá. Qual seu WhatsApp, com DDD?", ph: "51 99999-9999", type: "text" },
  { key: "instagram", bot: "Por fim, seu Instagram — pra fechar o rodapé.", ph: "@seuperfil", type: "text" },
];

/* --------------------------- utilities ---------------------------- */
let _mid = 0;
const uid = () => ++_mid;
// id do site anônimo (trial) pendente de ser vinculado à conta — em
// localStorage (não useRef) porque o magic link do e-mail costuma abrir em
// nova aba/janela, onde um useRef já teria perdido o valor.
const TRIAL_SITE_KEY = "psipage_trial_site_id";
const getPendingTrialSiteId = () => { try { return localStorage.getItem(TRIAL_SITE_KEY); } catch { return null; } };
const setPendingTrialSiteId = (id) => { try { id ? localStorage.setItem(TRIAL_SITE_KEY, id) : localStorage.removeItem(TRIAL_SITE_KEY); } catch { /* ignora */ } };
const CARDS_STEP = FLOW.find((f) => f.type === "cards");
const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
// aceita "@fulana", "fulana" ou um link já pronto e sempre devolve uma URL válida do perfil
const igLink = (handle) => {
  const h = (handle || "").trim();
  if (!h) return "";
  if (/^https?:\/\//i.test(h)) return h;
  return `https://instagram.com/${h.replace(/^@/, "")}`;
};
const initials = (n) =>
  (n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const firstName = (n) => (n || "").trim().split(" ")[0] || "";
// nome é exibido publicamente no site — força "Primeira Maiúscula" em cada
// palavra independente de como a pessoa digitou (tudo minúsculo, tudo
// maiúsculo etc.)
const titleCase = (n) =>
  (n || "").trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
// máscara de celular BR: "51999998888" -> "51 99999-9888"
const formatPhoneBR = (raw) => {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`;
};
// MVP roda só o funil de chat no mobile — checado uma vez ao fim do chat,
// não precisa reagir a resize (celular não cruza esse breakpoint em uso normal).
const isMobileViewport = () => window.matchMedia("(max-width: 900px)").matches;

/* -------------------------- copy determinística --------------------- */
/* Sem IA por enquanto: monta a copy a partir do template + respostas.   */
// título exibido junto do nome (ex: "Dra. · CRP 07/123456") — combina o
// tratamento escolhido no quiz com o registro profissional, se houver.
const TITULO_LABELS = { psicologa: "Psicóloga", psicologo: "Psicólogo", dra: "Dra.", nenhum: "" };
function buildTitle(answers) {
  const label = TITULO_LABELS[answers.titulo] ?? "";
  const crp = answers.crp?.num ? `CRP ${answers.crp.uf}/${answers.crp.num}` : "";
  return [label, crp].filter(Boolean).join(" · ");
}
const BADGE_BY_MODALIDADE_NOVO = {
  online: "Atendimento 100% Online",
  presencial: "Atendimento presencial",
  hibrido: "Atendimento online e presencial",
};

// monta um objeto "site" válido a partir de QUALQUER estado parcial de
// answers (formato do OnboardingQuiz) — usado tanto pro preview ao vivo
// quanto pra geração final (runGeneration). Campos ainda não respondidos
// caem nos DEFAULTS, então o preview nunca fica quebrado/vazio.
function buildSiteFromAnswers(answers, lead) {
  const title = buildTitle(answers);

  const selectedEspecialidades = answers.especialidade || [];
  const specialties = selectedEspecialidades.length
    ? selectedEspecialidades.map((t) => ({ t, d: GENERIC_SPEC_DESC }))
    : DEFAULTS.specialties;

  const badge = BADGE_BY_MODALIDADE_NOVO[answers.modalidade] || DEFAULTS.badge;
  const methodTitle = answers.abordagem ? `O que é a ${answers.abordagem}?` : DEFAULTS.methodTitle;

  return {
    ...DEFAULTS,
    specialties, badge, methodTitle,
    name: lead.name || "", email: lead.email || "", title,
    modalidade: answers.modalidade || "", whatsapp: answers.whatsapp || "", instagram: answers.instagram || "",
    photo: answers.foto?.url || "",
    logo: answers.logo?.url || "",
    endereco: answers.endereco || "",
    bio: answers.bio || DEFAULTS.bio,
    publico: answers.publico || [],
    preco: answers.preco || null,
    waMessage: `Olá! Vi seu site e tenho interesse em agendar uma consulta.`,
    theme: answers.themeStyle?.theme || "classic",
    colorScheme: answers.themeStyle?.colorScheme || DEFAULT_COLOR_SCHEME,
  };
}

/* =========================== SITE PREVIEW ========================== */
function SitePreview({ d }) {
  const [openFaq, setOpenFaq] = useState(0);
  const { accent, accentSoft } = COLOR_SCHEMES[d.colorScheme] || COLOR_SCHEMES[DEFAULT_COLOR_SCHEME];
  // versão escura do accent pros blocos de contraste (metodologia, CTA) — antes
  // eram preto fixo + verde-limão da PsiPage, que ignoravam a paleta escolhida.
  const accentDeep = darken(accent, 0.55);
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);
  const Btn = ({ children, primary }) => (
    <a href={wa} target="_blank" rel="noreferrer" data-edit="whatsapp" style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 19px", borderRadius: 999,
      fontSize: 13, fontWeight: 600, textDecoration: "none",
      background: primary ? accent : "transparent", color: primary ? "#fff" : C.ink,
      border: primary ? "none" : `1px solid ${C.line}`,
    }}>{children}</a>
  );
  const wrap = (extra) => ({ maxWidth: CONTAINER_MAX, margin: "0 auto", padding: `0 ${CPAD}`, ...extra });
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: C.ink, background: "#fff", fontSize: 14, lineHeight: 1.55 }}>
      {/* header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={wrap({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `14px ${CPAD}` })}>
          {d.logo
            ? <img src={d.logo} alt={d.name} data-edit="logo" style={{ height: 28, maxWidth: 160, objectFit: "contain" }} />
            : <span data-edit="name" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>{d.name}</span>}
          <nav className="site-nav" style={{ display: "flex", gap: 16, fontSize: 12, color: C.sub }}>
            <a href="#especialidades" style={{ color: "inherit", textDecoration: "none" }}>Especialidades</a>
            <a href="#metodo" style={{ color: "inherit", textDecoration: "none" }}>Método</a>
            <a href="#sobre" style={{ color: "inherit", textDecoration: "none" }}>Sobre</a>
            <a href="#duvidas" style={{ color: "inherit", textDecoration: "none" }}>Dúvidas</a>
          </nav>
          <Btn primary><MessageCircle size={14} /> Agendar</Btn>
        </div>
      </div>
      {/* hero */}
      <div className="hero-grid" style={wrap({ padding: `46px ${CPAD} 40px`, gap: 28, alignItems: "center" })}>
        <div>
          <span data-edit="badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: accent, background: accentSoft, padding: "5px 11px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: accent }} />{d.badge}
          </span>
          <h1 data-edit="headline" style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, lineHeight: 1.08, margin: "16px 0 12px", letterSpacing: "-.01em" }}>{d.headline}</h1>
          <p data-edit="subheadline" style={{ color: C.sub, maxWidth: 380, margin: "0 0 22px" }}>{d.subheadline}</p>
          <div style={{ display: "flex", gap: 10 }}><Btn primary>Iniciar jornada <ArrowRight size={14} /></Btn><Btn>Saiba mais</Btn></div>
        </div>
        <div data-edit="photo" style={{ aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: `linear-gradient(160deg, ${accentSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {d.photo
            ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontFamily: "Fraunces, serif", fontSize: 46, color: accent, opacity: .55 }}>{initials(d.name)}</span>}
        </div>
      </div>
      {/* especialidades */}
      <div id="especialidades" style={{ background: C.panel, scrollMarginTop: 64 }}>
        <div style={wrap({ padding: `40px ${CPAD}` })}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, margin: 0 }}>Foco em resultados</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 22px" }}>Especialidades clínicas</h2>
          <div className="spec-grid" style={{ gap: 14 }}>
            {d.specialties.map((s, i) => (
              <div key={i} data-edit={`specialties.${i}`} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px" }}>
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 13, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "6px 0" }}>{s.t}</h3>
                <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* diferenciais */}
      <div className="diff-grid" style={wrap({ padding: `40px ${CPAD}`, gap: 26, alignItems: "center" })}>
        <div style={{ aspectRatio: "1/1", borderRadius: 16, overflow: "hidden" }}>
          <img src="/media/diferenciais-verde.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, margin: 0 }}>Psicologia online</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "8px 0 16px" }}>Por que esse atendimento?</h2>
          {d.benefits.map((b, i) => (
            <div key={i} data-edit={`benefits.${i}`} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <span style={{ marginTop: 2, flexShrink: 0, width: 20, height: 20, borderRadius: 99, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={12} color="#fff" />
              </span>
              <p style={{ margin: 0, fontSize: 13.5 }}><b>{b.t}</b> — <span style={{ color: C.sub }}>{b.d}</span></p>
            </div>
          ))}
        </div>
      </div>
      {/* metodologia */}
      <div id="metodo" style={{ background: accentDeep, color: "#EDEBE3", scrollMarginTop: 64 }}>
        <div style={wrap({ padding: `40px ${CPAD}` })}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accentSoft, margin: 0 }}>Abordagem</p>
          <h2 data-edit="methodTitle" style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 16px" }}>{d.methodTitle}</h2>
          <div data-edit="methodText">
            {d.methodText.split("\n\n").map((p, i) => (
              <p key={i} style={{ maxWidth: 560, color: "rgba(255,255,255,.72)", margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
        </div>
      </div>
      {/* sobre */}
      <div id="sobre" className="sobre-grid" style={wrap({ padding: `40px ${CPAD}`, gap: 26, alignItems: "center", scrollMarginTop: 64 })}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, margin: 0 }}>Quem sou eu</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "8px 0 14px" }}>Uma escuta clínica e humana.</h2>
          <p data-edit="bio" style={{ color: C.sub, fontSize: 13.5, marginBottom: 18 }}>{d.bio}</p>
          <Btn primary><MessageCircle size={14} /> Agende uma consulta</Btn>
        </div>
        <div style={{ aspectRatio: "4/5", borderRadius: 16, overflow: "hidden" }}>
          <img src="/media/sobre-verde.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
      {/* faq */}
      <div id="duvidas" style={{ background: C.panel, scrollMarginTop: 64 }}>
        <div style={wrap({ padding: `40px ${CPAD}` })}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 18px" }}>Perguntas frequentes</h2>
          {d.faq.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} data-edit={`faq.${i}`} style={{ borderTop: `1px solid ${C.line}`, padding: "13px 0" }}>
                <button onClick={() => setOpenFaq(open ? -1 : i)}
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer", fontWeight: 600, fontSize: 14, background: "none", border: "none", padding: 0, margin: 0, color: C.ink, textAlign: "left", font: "inherit" }}>
                  {f.q}
                  <Plus size={15} color={C.sub} style={{ flexShrink: 0, transition: "transform .15s", transform: open ? "rotate(45deg)" : "none" }} />
                </button>
                <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .25s ease" }}>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ margin: "8px 0 0", color: C.sub, fontSize: 13 }}>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* investimento — só aparece se a pessoa optou por mostrar o valor no quiz */}
      {d.preco?.mostrar && d.preco?.valor != null && (
        <div style={wrap({ padding: `40px ${CPAD} 0` })}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", background: accentSoft, borderRadius: 16, padding: "24px 28px" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, margin: 0 }}>Investimento</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 600, color: C.ink }}>R$ {d.preco.valor}</span>
                <span style={{ fontSize: 13, color: C.sub }}>por sessão</span>
              </div>
            </div>
            <Btn primary><MessageCircle size={14} /> Agendar</Btn>
          </div>
        </div>
      )}
      {/* cta final */}
      <div style={wrap({ padding: `40px ${CPAD}` })}>
        <div style={{ background: accent, borderRadius: 16, padding: 30, color: "#fff", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>Vamos dar o primeiro passo?</h3>
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, margin: "0 0 18px" }}>Agende uma conversa inicial agora mesmo.</p>
          <a href={wa} target="_blank" rel="noreferrer" data-edit="whatsapp" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 999, background: "#fff", color: accentDeep, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <MessageCircle size={15} /> Falar no WhatsApp
          </a>
        </div>
      </div>
      {/* footer */}
      <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel }}>
        {d.endereco && (
          <div style={wrap({ padding: `26px ${CPAD} 0` })}>
            <iframe title="Localização do consultório" loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(d.endereco)}&output=embed`}
              style={{ width: "100%", height: 200, border: 0, borderRadius: 12, display: "block" }} />
            <div data-edit="endereco" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, marginTop: 10 }}>
              <MapPin size={13} />{d.endereco}
            </div>
          </div>
        )}
        <div style={wrap({ padding: `26px ${CPAD}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 })}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{d.title} · {d.modalidade}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {d.instagram && (
              <a href={igLink(d.instagram)} target="_blank" rel="noreferrer" data-edit="instagram" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.sub, textDecoration: "none" }}><Instagram size={14} />{d.instagram}</a>
            )}
            {d.email && (
              <a href={`mailto:${d.email}`} data-edit="email" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.sub, textDecoration: "none" }}><Mail size={14} />{d.email}</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* escolhe o tema pra renderizar sem alterar SitePreview (tema clássico) */
const THEMES = { classic: "Clássico", editorial: "Autoral" };
function ThemedSite({ d }) {
  if (d?.theme === "editorial") return <SitePreviewEditorial d={d} />;
  return <SitePreview d={d} />;
}

// registro dos campos editáveis pelo editor visual: cada data-edit no preview
// aponta pra uma chave aqui, que diz qual controle a lateral deve abrir.
// type: text | textarea | image | list. Pra list, withDesc/labels configuram
// o ListEditor. section só agrupa visualmente o rótulo mostrado.
const FIELD_REGISTRY = {
  name: { label: "Nome", type: "text", ph: "Marina Costa" },
  badge: { label: "Selo de modalidade", type: "text", ph: "Atendimento 100% Online" },
  headline: { label: "Headline (título principal)", type: "textarea", ph: "Equilíbrio emocional..." },
  subheadline: { label: "Subtítulo", type: "textarea", ph: "Psicoterapia baseada em..." },
  bio: { label: "Sobre você (bio)", type: "textarea", ph: "Escreva sobre você..." },
  methodTitle: { label: "Título da abordagem", type: "text", ph: "O que é a TCC?" },
  methodText: { label: "Texto da abordagem", type: "textarea", ph: "Descreva sua abordagem..." },
  photo: { label: "Foto principal", type: "image" },
  logo: { label: "Logo", type: "image" },
  whatsapp: { label: "WhatsApp (com DDD)", type: "text", ph: "51 99999-9999" },
  instagram: { label: "Instagram", type: "text", ph: "@seuperfil" },
  email: { label: "E-mail", type: "text", ph: "voce@email.com" },
  endereco: { label: "Endereço do consultório", type: "text", ph: "Rua, número, cidade" },
  specialties: { label: "Especialidades", type: "list", withDesc: true, labels: ["Tema (ex: Ansiedade)", "Descrição curta"] },
  benefits: { label: "Diferenciais", type: "list", withDesc: true, labels: ["Título (ex: Conforto)", "Descrição curta"] },
  faq: { label: "Perguntas frequentes", type: "list", withDesc: false, labels: ["Pergunta", "Resposta"] },
};

// nem toda pergunta do FLOW escreve num data-edit com o mesmo nome (ex:
// "temas" alimenta "specialties", "sobre" alimenta "bio") — este mapa traduz
// a key da pergunta pro alvo certo no preview, usado só pelo highlight ao
// vivo da fase de chat. Perguntas ausentes aqui (crp, link, tom...) não têm
// um elemento correspondente pra destacar, e o highlight simplesmente não
// aparece nessas etapas — comportamento esperado, não um bug.
const FLOW_KEY_TO_PREVIEW_FIELD = {
  modalidade: "badge",
  abordagem: "methodTitle",
  temas: "specialties",
  sobre: "bio",
};
// itens de lista chegam como "specialties.0.t" — normaliza pro campo-base
// (specialties) que é o que o controle de lista edita por inteiro.
const baseField = (path) => (path || "").split(".")[0];

/* --------- Shell e Brand em escopo de módulo (estáveis) ---------- */
/* Definir estes DENTRO do App faz o React remontar tudo a cada tecla, */
/* o que fazia o input perder o foco. Fora do App, a identidade é fixa. */
const Shell = ({ children }) => (
  <div className="shell-outer" style={{ background: C.paper, fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@400;500;600&display=swap');
      *{box-sizing:border-box;} body{margin:0;overscroll-behavior-y:contain;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;} details summary::-webkit-details-marker{display:none;}
      @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
      input,textarea{transition:border-color .16s,box-shadow .16s,background .16s;}
      input:hover,textarea:hover{border-color:${C.sub};}
      input:focus,textarea:focus{outline:none;border-color:${C.sage} !important;box-shadow:0 0 0 3px ${C.sageSoft};}
      .fade{animation:fade .5s ease both;} @keyframes fade{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
      .bub{animation:bub .35s ease both;} @keyframes bub{from{opacity:0;transform:translateY(6px) scale(.98);}to{opacity:1;transform:none;}}
      .prev::-webkit-scrollbar{width:7px;} .prev::-webkit-scrollbar-thumb{background:#D8D3C6;border-radius:9px;}
      .dot{width:6px;height:6px;border-radius:99px;background:${C.sub};display:inline-block;animation:blink 1.2s infinite;}
      .dot:nth-child(2){animation-delay:.2s;}.dot:nth-child(3){animation-delay:.4s;}
      @keyframes blink{0%,60%,100%{opacity:.25;}30%{opacity:1;}}
      @keyframes spin{to{transform:rotate(360deg);}} .spin{animation:spin 1s linear infinite;}
      .btn-primary-hover{transition:transform .12s;} .btn-primary-hover:hover:not(:disabled){transform:translateY(-1px);}
      .btn-primary-hover:focus-visible{outline:2px solid ${C.sage};outline-offset:3px;}
      .link-hover{transition:color .16s;} .link-hover:hover{color:${C.ink} !important;}

      /* --- mobile: viewport real (evita corte por barra do navegador) --- */
      .shell-outer{ min-height: 100vh; min-height: 100dvh; }
      .welcome-card{ padding: 40px 36px; }
      .chat-split{ height: min(760px, 88vh); height: min(760px, 88dvh); }
      .chat-card--split{ height: 100%; }
      @media (max-width: 900px) {
        /* MVP roda só o funil de chat no mobile: tela cheia, sem preview ao lado */
        input, textarea, select { font-size: 16px !important; } /* evita auto-zoom do iOS ao focar */
        .shell-outer:has(.chat-split){ padding: 0 !important; }
        .chat-split{ flex-direction: column; height: 100vh !important; height: 100dvh !important; }
        .chat-card--split{ width: 100% !important; height: 100% !important; border-radius: 0 !important; }
        .chat-preview-pane{ display: none !important; }
      }
      @media (max-width: 480px) {
        .shell-outer{ padding: 12px !important; }
        .welcome-card{ padding: 28px 20px !important; border-radius: 18px !important; }
        .welcome-card h1{ font-size: 24px !important; }
      }
    `}</style>
    {children}
  </div>
);

const Brand = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
    <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.sage, flexShrink: 0 }} />
    <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 18 }}>Psi<span style={{ fontStyle: "italic", color: C.sage }}>Page</span></span>
  </div>
);

/* --------- preview responsivo (mobile/tablet/desktop) ---------- */
/* O preview do site renderiza direto no DOM da página do painel, então as    */
/* media queries do site (@media max-width:640px etc.) respondem à largura   */
/* da JANELA do navegador, não à largura de uma div. Só dá pra simular       */
/* mobile/tablet de verdade com um <iframe> — tem seu próprio viewport       */
/* independente. Usa portal do React pra montar o mesmo componente ao vivo   */
/* dentro do documento do iframe, sem perder reatividade (troca de           */
/* tema/paleta continua atualizando o preview instantaneamente).             */
const EDIT_HL = "#2F6FED"; // cor do contorno do editor — azul fixo, destaca em qualquer paleta
const PREVIEW_FRAME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
  :root { --cpad: 32px; }
  *{box-sizing:border-box;} body{margin:0;} details summary::-webkit-details-marker{display:none;}
  html{scroll-behavior:smooth;}
  ::-webkit-scrollbar{width:7px;} ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#D8D3C6;border-radius:9px;}
  .hero-grid { display:grid; grid-template-columns: 1.1fr .9fr; }
  .sobre-grid { display:grid; grid-template-columns: 1fr 1fr; }
  .diff-grid { display:grid; grid-template-columns: 1fr 1fr; }
  .spec-grid { display:grid; grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px) {
    :root { --cpad: 16px; }
    .hero-grid, .sobre-grid, .diff-grid, .spec-grid { grid-template-columns: 1fr !important; }
    .hero-grid > div:last-child, .sobre-grid > div:last-child { width: 100%; max-width: 420px; margin: 20px auto 0; }
    .diff-grid > div:first-child { width: 100%; max-width: 420px; margin: 0 auto 20px; }
    .site-nav { display: none !important; }
  }
  /* editor visual: só valem quando body.ed-active */
  body.ed-active [data-edit]{ cursor: pointer; }
  body.ed-active [data-edit]:hover{ outline: 2px dashed ${EDIT_HL}; outline-offset: 2px; border-radius: 4px; }
  body.ed-active [data-edit].ed-selected{ outline: 2px solid ${EDIT_HL}; outline-offset: 2px; border-radius: 4px; }
  /* construção ao vivo (fase de chat): pulso passageiro no campo recém-preenchido */
  [data-edit].just-filled{ animation: just-filled-pulse 1.2s ease; border-radius: 4px; }
  @keyframes just-filled-pulse{
    0%{ box-shadow: 0 0 0 3px ${EDIT_HL}66; }
    70%{ box-shadow: 0 0 0 3px ${EDIT_HL}66; }
    100%{ box-shadow: 0 0 0 0 transparent; }
  }
`;

const PREVIEW_DEVICES = {
  desktop: { label: "Desktop", width: "100%", icon: Monitor },
  tablet: { label: "Tablet", width: 768, icon: Tablet },
  mobile: { label: "Mobile", width: 375, icon: Smartphone },
};

/* O iframe É o dispositivo: largura da tela simulada, altura 100% do palco,   */
/* rolando por dentro dele mesmo — igual um navegador de verdade. A tentativa  */
/* anterior (crescer o iframe até a altura total do conteúdo e deixar o        */
/* container de fora rolar) dava barra de rolagem fantasma na borda e sobra    */
/* de espaço no fim das telas menores.                                         */
function PreviewFrame({ width, radius, children, editMode, selectedField, onSelect, highlightField }) {
  const [iframeEl, setIframeEl] = useState(null);
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    if (!iframeEl) return;
    const doc = iframeEl.contentDocument;
    if (!doc || !doc.body) return;
    doc.body.style.margin = "0";
    const style = doc.createElement("style");
    style.textContent = PREVIEW_FRAME_CSS;
    doc.head.appendChild(style);
    setMountNode(doc.body);
  }, [iframeEl]);

  // liga/desliga o modo de edição no body do iframe + handler de clique
  // delegado. Em editMode, clicar num elemento com data-edit seleciona; e
  // qualquer link (CTA do WhatsApp) tem o clique bloqueado pra não navegar.
  useEffect(() => {
    if (!mountNode) return;
    mountNode.classList.toggle("ed-active", !!editMode);
    if (!editMode) return;
    const onClick = (e) => {
      const link = e.target.closest("a");
      if (link) { e.preventDefault(); }
      const el = e.target.closest("[data-edit]");
      if (el) { e.preventDefault(); e.stopPropagation(); onSelect?.(el.dataset.edit); }
    };
    mountNode.addEventListener("click", onClick, true);
    return () => mountNode.removeEventListener("click", onClick, true);
  }, [mountNode, editMode, onSelect]);

  // marca o elemento selecionado (contorno sólido). Só o campo-base importa
  // pra listas — todos os itens da mesma lista destacam juntos.
  useEffect(() => {
    if (!mountNode) return;
    mountNode.querySelectorAll(".ed-selected").forEach((el) => el.classList.remove("ed-selected"));
    if (!editMode || !selectedField) return;
    const base = (selectedField || "").split(".")[0];
    mountNode.querySelectorAll("[data-edit]").forEach((el) => {
      if ((el.dataset.edit || "").split(".")[0] === base) el.classList.add("ed-selected");
    });
  }, [mountNode, editMode, selectedField, children]);

  // "construção ao vivo": quando um campo acaba de ser respondido no chat,
  // rola o preview até ele e aplica um pulso de contorno passageiro — sinaliza
  // pro usuário exatamente onde a resposta caiu no site, sem exigir clique.
  // "ts" garante que o efeito rode de novo mesmo se o mesmo campo for
  // respondido duas vezes seguidas (ex: editar a mesma resposta de novo).
  useEffect(() => {
    if (!mountNode || !highlightField?.field) return;
    const base = highlightField.field.split(".")[0];
    const el = mountNode.querySelector(`[data-edit="${base}"], [data-edit^="${base}."]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("just-filled");
    const t = setTimeout(() => el.classList.remove("just-filled"), 1200);
    return () => clearTimeout(t);
  }, [mountNode, highlightField?.field, highlightField?.ts]);

  return (
    <>
      <iframe ref={setIframeEl} title="Preview do site"
        style={{ width, maxWidth: "100%", height: "100%", border: 0, display: "block", background: "#fff", borderRadius: radius }} />
      {mountNode && createPortal(children, mountNode)}
    </>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const [phase, setPhase] = useState("loading"); // loading | public | landing | quiz | generating | trial | quiz-email | site | mobile-success | published
  const [trialUrl, setTrialUrl] = useState(null);
  const [trialLinkCopied, setTrialLinkCopied] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "" });
  const [authError, setAuthError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [editMode, setEditMode] = useState(false);
  const [selectedField, setSelectedField] = useState(null); // caminho do data-edit, ex "headline" ou "faq.1.q"
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [siteSlug, setSiteSlug] = useState(null);
  const [siteStatus, setSiteStatus] = useState("draft");
  const [publicSite, setPublicSite] = useState(undefined); // undefined=carregando null=não achou objeto=achou
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const flowStartedRef = useRef(false); // true assim que o quiz começa nesta aba — evita que a sessão chegando depois (outra aba) interrompa o fluxo
  const [msgs, setMsgs] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef(answers); // espelho pra `hydrate` (roteamento, monta 1x) ler o valor mais recente
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [justFilled, setJustFilled] = useState(null); // { field, ts } da última resposta — dispara scroll+pulso no preview
  const [site, setSite] = useState(null);
  // edição de respostas já enviadas
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [editingKey, setEditingKey] = useState(null); // edição via seletor original (chips/cards/crp/specialty/foto)
  // seleção de cards (etapa de temas) — multi-seleção
  const [cardSel, setCardSel] = useState([]);
  const [cardOpts, setCardOpts] = useState(CARDS_STEP ? CARDS_STEP.options : []);
  const [cardCustom, setCardCustom] = useState("");
  // imagem (foto ou logo, conforme a etapa ativa)
  const [imageDraft, setImageDraft] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // etapas "specialty" e "crp": especialidade e registro, cada uma leve e isolada
  const [specialtySel, setSpecialtySel] = useState("");
  const [specialtyCustom, setSpecialtyCustom] = useState("");
  const [crpPrefix, setCrpPrefix] = useState("07");
  const [crpNumber, setCrpNumber] = useState("");
  // etapa "themeStyle": dois sub-passos (tema → paleta), cada um leve e isolado
  const [themeSub, setThemeSub] = useState("theme"); // "theme" | "colorScheme"
  const [themeSel, setThemeSel] = useState("classic");
  // etapa "link": slug do site, pré-preenchido a partir do nome já informado
  const [linkSlug, setLinkSlug] = useState("");
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const saveTimerRef = useRef(null); // debounce das edições ao vivo do editor
  const editFileRef = useRef(null); // file input do editor visual (foto/logo)

  const step = FLOW[stepIdx];
  const editingFlowStep = editingKey ? FLOW.find((f) => f.key === editingKey) : null;
  const activeType = editingFlowStep ? editingFlowStep.type : step?.type;
  // site derivado ao vivo das respostas dadas até agora — usado pelo preview
  // ao lado do chat, que vai se montando campo a campo conforme a conversa avança.
  const previewSite = useMemo(() => buildSiteFromAnswers(answers, lead), [answers, lead]);
  answersRef.current = answers;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  // pré-preenche o slug sugerido com o nome assim que a etapa "link" abre
  useEffect(() => {
    if (activeType === "link" && !linkSlug) setLinkSlug(slugify(answers.name || lead.name));
  }, [activeType]);

  // textarea da resposta longa ("sobre") cresce junto com o texto até um
  // teto, em vez de ficar 1 linha só e obrigar a rolar pra ler o que já foi
  // escrito/inserido (ex: os começos sugeridos, que passam de 250 chars).
  useEffect(() => {
    const el = composerRef.current;
    if (el && el.tagName === "TEXTAREA") {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 220) + "px";
    }
  }, [draft]);

  // bot fala com "digitando"
  const botSay = (text) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: uid(), role: "bot", text }]);
    }, 700);
  };

  // login por magic link — cria a conta (se for a primeira vez) ou autentica
  // de novo (se já existir), sem senha. A sessão só existe de fato depois
  // que a pessoa clica no link recebido por e-mail (onAuthStateChange trata
  // a volta, lá embaixo).
  const sendMagicLink = async () => {
    if (!/\S+@\S+\.\S+/.test(lead.email)) return;
    // o nome já veio do quiz (1º passo, answers.nome) — só cai pro e-mail
    // se por algum motivo ela chegou aqui sem ter passado pelo quiz.
    const name = titleCase(lead.name.trim() || answers.nome || lead.email.split("@")[0].replace(/[._-]+/g, " "));
    setLead((l) => ({ ...l, name }));
    setSendingLink(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: lead.email,
      options: { emailRedirectTo: window.location.origin, data: { name } },
    });
    setSendingLink(false);
    if (error) { setAuthError(error.message); return; }
    setLinkSent(true);
    // manda o lead pro Notion em segundo plano — não trava o fluxo se falhar
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: lead.email }),
    }).catch(() => {});
  };

  // alternativa ao link — resolve o problema clássico de magic link quando o
  // e-mail só abre em outro navegador/perfil (a pessoa pede o login aqui,
  // mas o e-mail abre em outra sessão do navegador, então o link "entra"
  // no lugar errado). Código de 6 dígitos verifica direto onde foi pedido.
  const verifyCode = async () => {
    if (!otpCode.trim()) return;
    setVerifyingOtp(true);
    setAuthError("");
    const { error } = await supabase.auth.verifyOtp({
      email: lead.email,
      token: otpCode.trim(),
      type: "email",
    });
    if (error) { setVerifyingOtp(false); setAuthError(error.message); return; }
    // sucesso: NÃO desliga o loading aqui — onAuthStateChange (mais abaixo)
    // pega a sessão nova e chama hydrate(), que troca de fase. Se resetar
    // verifyingOtp já aqui, o botão volta a mostrar "Entrar" clicável por um
    // instante antes da troca de tela, parecendo que precisa clicar de novo.
  };

  const logout = async () => {
    await supabase.auth.signOut();
    flowStartedRef.current = false;
    setAccountMenuOpen(false);
    setLead({ name: "", email: "" });
    setLinkSent(false);
    setMsgs([]); setStepIdx(0); setAnswers({});
    setSite(null); setSiteSlug(null); setSiteStatus("draft"); setPublishedUrl(null);
    setPendingTrialSiteId(null);
    setPhase("landing");
  };

  // roteamento simples (path != "/" = site público) + sessão existente (magic link)
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (path === "__quiz") { setPhase("devquiz"); return; } // rota de dev: testar o novo quiz isolado
    if (path === "__preview-success") {
      setLead({ name: "Ana Beatriz", email: "ana@exemplo.com" });
      setPublishedUrl(`${window.location.origin}/ana-beatriz`);
      setPhase("published");
      return;
    }
    if (path === "__preview-trial") {
      setLead({ name: "Ana Beatriz", email: "ana@exemplo.com" });
      setTrialUrl(`${window.location.origin}/ana-beatriz`);
      setPhase("trial");
      return;
    }
    if (path) {
      setPhase("public");
      supabase.from("sites").select("data").eq("slug", path).in("status", ["published", "trial", "active"]).maybeSingle()
        .then(({ data }) => setPublicSite(data ? data.data : null));
      return;
    }

    const hydrate = async (session) => {
      if (flowStartedRef.current) return; // evita rodar de novo (StrictMode / onAuthStateChange + getSession em paralelo)
      flowStartedRef.current = true;
      const name = titleCase(session.user.user_metadata?.name || "");
      const email = session.user.user_metadata?.email || session.user.email || "";
      setLead({ name, email });
      const { data: row } = await supabase
        .from("sites")
        .select("slug, status, data, answers")
        .eq("owner_id", session.user.id)
        .maybeSingle();
      if (row) {
        setAnswers(row.answers || {});
        // sites gerados antes da normalização do nome (ex: "pedro" salvo em
        // vez de "Pedro") se corrigem sozinhos no próximo carregamento —
        // sem isso, o nome errado fica congelado pra sempre na página pública.
        let siteData = row.data;
        if (siteData?.name && siteData.name !== titleCase(siteData.name)) {
          siteData = { ...siteData, name: titleCase(siteData.name) };
          saveSite(row.status, siteData, row.answers || {});
        }
        setSite(siteData || null);
        setSiteSlug(row.slug);
        setSiteStatus(row.status);
        if (row.status === "published") setPublishedUrl(`${window.location.origin}/${row.slug}`);
        setPhase("site");
      } else if (getPendingTrialSiteId() && await claimTrialSite(getPendingTrialSiteId(), session.user.id)) {
        // ela já tinha visto o preview temporário (fase "trial") e acabou de
        // criar a conta — vincula esse MESMO site (mesmo link) em vez de
        // gerar um novo, e segue direto pro editor.
        const { data: claimed } = await supabase.from("sites")
          .select("slug, status, data, answers").eq("id", getPendingTrialSiteId()).maybeSingle();
        setPendingTrialSiteId(null);
        setAnswers(claimed?.answers || answersRef.current);
        setSite(claimed?.data || null);
        setSiteSlug(claimed?.slug || null);
        setSiteStatus(claimed?.status || "trial");
        setPhase("site");
      } else if (Object.keys(answersRef.current).length) {
        // acabou de confirmar o OTP no fim do quiz novo: já tem as respostas
        // em memória (setAnswers no onComplete do OnboardingQuiz) — gera o
        // site direto, sem repetir nada.
        runGeneration(answersRef.current);
      } else {
        // sessão existente sem site salvo e sem respostas em memória (ex:
        // reabriu o link do e-mail direto, sem ter passado pelo quiz nesta
        // aba) — manda pro quiz do zero.
        setPhase("quiz");
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || flowStartedRef.current) return;
      hydrate(session);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) hydrate(data.session);
      else setPhase("landing");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const restartQuiz = () => {
    setMsgs([]); setStepIdx(0); setAnswers({}); setSite(null);
    setSiteSlug(null); setSiteStatus("draft"); setPublishedUrl(null);
    setPhase("quiz");
  };

  const changeTheme = (theme) => {
    const updated = { ...site, theme };
    setSite(updated);
    saveSite(siteStatus, updated, answers);
  };

  const changeColorScheme = (colorScheme) => {
    const updated = { ...site, colorScheme };
    setSite(updated);
    saveSite(siteStatus, updated, answers);
  };

  // edição ao vivo de um campo do site (usada pelo editor visual). Atualiza o
  // estado na hora (preview reflete) e agenda a gravação com debounce pra não
  // bater no Supabase a cada tecla. Mantém o status atual (publicado continua
  // publicado). "value" pra listas é o array inteiro (o ListEditor devolve).
  const editField = (field, value) => {
    const updated = { ...site, [field]: value };
    setSite(updated);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSite(siteStatus, updated, answers).then((slug) => {
        if (slug && siteStatus === "published") setPublishedUrl(`${window.location.origin}/${slug}`);
      });
    }, 800);
  };

  const toggleEditMode = () => {
    setEditMode((v) => !v);
    setSelectedField(null);
  };

  // lê o arquivo escolhido no editor e grava no campo selecionado (photo/logo)
  const editImageFile = (e) => {
    const f = e.target.files?.[0];
    if (!f || !selectedField) return;
    const r = new FileReader();
    r.onload = () => editField(baseField(selectedField), r.result);
    r.readAsDataURL(f);
    e.target.value = ""; // permite reescolher o mesmo arquivo
  };

  // grava (ou atualiza) a linha em sites com o status pedido. Usado tanto
  // pra salvar rascunho (assim que o site é gerado, antes de qualquer
  // pagamento — evita perder tudo se ela sair pro checkout e voltar) quanto
  // pra publicar de verdade.
  const saveSite = async (status, siteData, answersData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const ownerId = session.user.id;
    const { data: existing } = await supabase.from("sites").select("id, slug").eq("owner_id", ownerId).maybeSingle();
    // site novo (ainda sem linha salva) nasce num slug curto e aleatório —
    // o nome bonito só é escolhido no admin, depois que ela assina o plano.
    for (let n = 1; n <= 20; n++) {
      const slug = existing?.slug || randomSlug();
      const payload = { owner_id: ownerId, slug, status, data: siteData, answers: answersData };
      const { error } = existing
        ? await supabase.from("sites").update(payload).eq("id", existing.id)
        : await supabase.from("sites").insert(payload);
      if (!error) return slug;
      if (existing || error.code !== "23505") return null; // só tenta de novo se foi conflito de slug numa criação nova
    }
    return null;
  };

  // cria o site "trial" sem dono, logo após o quiz — pra gerar um link
  // temporário e visitável ANTES de pedir e-mail/conta. É publicado de
  // verdade (status = 'trial' já é lido pela página pública), só que sem
  // owner_id ainda. O id fica guardado pra ser "reivindicado" (vinculado à
  // conta) quando ela fizer login logo depois — ver claimTrialSite.
  const createTrialSite = async (siteData, answersData) => {
    // telefone (WhatsApp) vira a âncora da página no banco — normalizado só em
    // dígitos, pra recuperar depois sem depender do cache do navegador.
    const phone = (answersData?.whatsapp || "").replace(/\D/g, "") || null;
    let includePhone = true; // se a coluna 'phone' ainda não foi migrada, cria sem ela (não trava o MVP)
    for (let n = 1; n <= 20; n++) {
      const slug = randomSlug();
      const payload = { owner_id: null, slug, status: "trial", data: siteData, answers: answersData };
      if (includePhone) payload.phone = phone;
      const { data, error } = await supabase.from("sites").insert(payload).select("id, slug").single();
      if (!error) return data;
      if (includePhone && (error.code === "PGRST204" || /phone/i.test(error.message || ""))) { includePhone = false; continue; }
      if (error.code !== "23505") return null; // só tenta de novo se foi conflito de slug
    }
    return null;
  };

  // vincula o site anônimo (trial) recém-criado à conta que acabou de logar,
  // em vez de criar um site novo do zero — o link temporário que ela já viu
  // continua sendo o mesmo. Chamado assim que a sessão é confirmada (hydrate).
  const claimTrialSite = async (trialSiteId, ownerId) => {
    if (!trialSiteId) return false;
    const { error } = await supabase.from("sites")
      .update({ owner_id: ownerId })
      .eq("id", trialSiteId)
      .is("owner_id", null);
    return !error;
  };

  const publishSite = async () => {
    setPublishing(true);
    setAuthError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // sessão expirou/caiu — sem login real não tem como recriar sem
      // perder a conta certa, então manda de volta pro login em vez de
      // criar uma sessão nova (que geraria um site órfão, desconectado
      // da conta de verdade).
      setPublishing(false);
      setAuthError("Sua sessão expirou. Faça login de novo pra publicar.");
      logout();
      return;
    }
    const ownerId = session.user.id;

    const { data: sub } = await supabase.from("subscriptions").select("status").eq("owner_id", ownerId).maybeSingle();
    if (sub?.status !== "active") {
      await saveSite("draft", site, answers); // garante que o rascunho está salvo antes de ir pro checkout
      setPublishing(false);
      setShowPlanPicker(true);
      return;
    }

    const slug = await saveSite("published", site, answers);
    setPublishing(false);
    if (!slug) { setAuthError("Erro ao publicar."); return; }
    const wasAlreadyPublished = siteStatus === "published";
    setSiteSlug(slug);
    setSiteStatus("published");
    setPublishedUrl(`${window.location.origin}/${slug}`);
    // celebra só na primeira publicação de verdade — se ela já estava
    // publicada (ex: só editou e clicou "Atualizar site"), fica no editor.
    if (!wasAlreadyPublished) setPhase("published");
  };

  const startCheckout = async (plan) => {
    setCheckingOut(true);
    setAuthError("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ plan, name: lead.name, email: lead.email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setCheckingOut(false);
      setAuthError(data.error || "Erro ao iniciar o pagamento.");
      return;
    }
    window.location.href = data.url;
  };

  // voltando do checkout da Asaas com sucesso: limpa a URL e tenta publicar de novo
  // (o webhook pode levar alguns segundos pra confirmar, então tenta algumas vezes)
  useEffect(() => {
    if (phase !== "site" || new URLSearchParams(window.location.search).get("checkout") !== "success") return;
    window.history.replaceState({}, "", window.location.pathname);
    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      publishSite();
      if (attempts >= 5) clearInterval(retry);
    }, 3000);
    publishSite();
    return () => clearInterval(retry);
  }, [phase]);

  const advance = (merged) => {
    setJustFilled({ field: FLOW_KEY_TO_PREVIEW_FIELD[step.key] || step.key, ts: Date.now() });
    let nextIdx = stepIdx + 1;
    while (nextIdx < FLOW.length && FLOW[nextIdx].skipIf && FLOW[nextIdx].skipIf(merged)) nextIdx++;
    if (nextIdx < FLOW.length) {
      setStepIdx(nextIdx);
      botSay(FLOW[nextIdx].bot.replace("{first}", firstName(merged.name || lead.name)));
    } else {
      setTimeout(() => runGeneration(merged), 500);
    }
  };

  const submit = (value) => {
    if (!value || !value.trim()) return;
    const key = step.key;
    if (key === "name") {
      const name = titleCase(value);
      setLead((l) => ({ ...l, name }));
      setMsgs((m) => [...m, { id: uid(), role: "user", text: name, key }]);
      const merged = { ...answers, [key]: name };
      setAnswers(merged);
      setDraft("");
      advance(merged);
      return;
    }
    setMsgs((m) => [...m, { id: uid(), role: "user", text: value, key }]);
    const merged = { ...answers, [key]: value };
    setAnswers(merged);
    setDraft("");
    advance(merged);
  };

  // se a resposta faz parte de uma edição (bolha clicada, seletor reaberto),
  // atualiza a mensagem/resposta no lugar em vez de avançar o fluxo.
  // retorna true quando tratou como edição.
  // "text" é o que aparece na bolha; "value" é o que fica salvo em answers[key] —
  // só diferem no caso da foto (bolha mostra um resumo, answers guarda a imagem).
  const applyAnswer = (key, text, value = text, msgExtra = {}) => {
    if (editingKey !== key) return false;
    setMsgs((m) => m.map((x) => (x.key === key ? { ...x, text, ...msgExtra } : x)));
    setAnswers((a) => ({ ...a, [key]: value }));
    setEditingKey(null);
    setJustFilled({ field: FLOW_KEY_TO_PREVIEW_FIELD[key] || key, ts: Date.now() });
    return true;
  };

  const chooseChip = (o) => {
    if (editingKey) { applyAnswer(editingKey, o); return; }
    submit(o);
  };

  // --- especialidade (etapa isolada, leve) ---
  const confirmSpecialty = () => {
    const spec = (specialtyCustom.trim() || specialtySel).trim();
    if (!spec) return;
    if (applyAnswer("specialty", spec)) { setSpecialtySel(""); setSpecialtyCustom(""); return; }
    setMsgs((m) => [...m, { id: uid(), role: "user", text: spec, key: "specialty" }]);
    const merged = { ...answers, specialty: spec };
    setAnswers(merged);
    setSpecialtySel(""); setSpecialtyCustom("");
    advance(merged);
  };

  // --- CRP (prefixo fixo) ou "ainda não tenho registro" ---
  const confirmCrp = () => {
    if (!crpNumber.trim()) return;
    const crp = `CRP ${crpPrefix}/${crpNumber.trim()}`;
    if (applyAnswer("crp", crp)) { setCrpNumber(""); return; }
    setMsgs((m) => [...m, { id: uid(), role: "user", text: crp, key: "crp" }]);
    const merged = { ...answers, crp };
    setAnswers(merged);
    setCrpNumber("");
    advance(merged);
  };
  const confirmNoCrp = () => {
    const text = "Ainda não tenho registro (em formação)";
    if (applyAnswer("crp", text, "")) { setCrpNumber(""); return; }
    setMsgs((m) => [...m, { id: uid(), role: "user", text, key: "crp" }]);
    const merged = { ...answers, crp: "" };
    setAnswers(merged);
    setCrpNumber("");
    advance(merged);
  };

  // --- estilo do site: tema (sub-passo 1) → paleta (sub-passo 2) ---
  // as duas escolhas só viram resposta (e avançam o FLOW) ao fim do sub-passo 2,
  // pra manter uma única bolha "Autoral • Sálvia" em vez de duas mensagens soltas.
  const chooseTheme = (key) => { setThemeSel(key); setThemeSub("colorScheme"); };
  const confirmColorScheme = (colorScheme) => {
    const value = { theme: themeSel, colorScheme };
    const text = `${THEME_META[themeSel].label} • ${colorScheme}`;
    if (applyAnswer("themeStyle", text, value)) {
      setThemeSub("theme");
      return;
    }
    setMsgs((m) => [...m, { id: uid(), role: "user", text, key: "themeStyle" }]);
    const merged = { ...answers, themeStyle: value };
    setAnswers(merged);
    setThemeSub("theme");
    advance(merged);
  };

  // --- link do site (slug) --- sem checagem de disponibilidade ainda, só confirma o valor digitado
  const confirmLink = () => {
    const slug = slugify(linkSlug) || slugify(lead.name);
    if (!slug) return;
    const text = `psipage.com/${slug}`;
    if (applyAnswer("link", text, slug)) { setLinkSlug(""); return; }
    setMsgs((m) => [...m, { id: uid(), role: "user", text, key: "link" }]);
    const merged = { ...answers, link: slug };
    setAnswers(merged);
    setLinkSlug("");
    advance(merged);
  };

  // --- imagem (foto de perfil OU logo — mesma UI, chave muda conforme a etapa) ---
  const IMAGE_LABELS = {
    photo: { added: "📷 Foto adicionada", skipped: "Seguir sem foto por enquanto" },
    logo: { added: "🖼️ Logo enviada", skipped: "Seguir sem logo por enquanto" },
  };
  const handleImageFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImageDraft(r.result);
    r.readAsDataURL(f);
  };
  const confirmImage = (val) => {
    const key = (editingFlowStep || step)?.key || "photo";
    const labels = IMAGE_LABELS[key] || IMAGE_LABELS.photo;
    const text = val ? labels.added : labels.skipped;
    if (applyAnswer(key, text, val || "", { photo: val || "" })) { setImageDraft(""); setImageUrl(""); return; }
    setMsgs((m) => [...m, { id: uid(), role: "user", text, key, photo: val || "" }]);
    const merged = { ...answers, [key]: val || "" };
    setAnswers(merged);
    setImageDraft(""); setImageUrl("");
    advance(merged);
  };

  // --- editar uma resposta já enviada ---
  const startEdit = (m) => {
    if (m.role !== "user" || !m.key || typing) return;
    const flowStep = FLOW.find((f) => f.key === m.key);
    if (flowStep?.type === "specialty") {
      const known = SPECIALTY_TITLES.includes(m.text);
      setSpecialtySel(known ? m.text : "");
      setSpecialtyCustom(known ? "" : m.text);
      setEditingKey(m.key);
      return;
    }
    if (flowStep?.type === "crp") {
      const match = /^CRP\s+(\d+)\/(.*)$/.exec(m.text);
      setCrpPrefix(match ? match[1] : "07");
      setCrpNumber(match ? match[2] : "");
      setEditingKey(m.key);
      return;
    }
    if (flowStep?.type === "link") {
      setLinkSlug(m.text.replace(/^psipage\.com\//, ""));
      setEditingKey(m.key);
      return;
    }
    if (flowStep?.type === "themeStyle") {
      setThemeSel(answers.themeStyle?.theme || "classic");
      setThemeSub("theme");
      setEditingKey(m.key);
      return;
    }
    if (flowStep?.type === "cards") {
      setCardSel(m.text.split(",").map((s) => s.trim()).filter(Boolean));
      setEditingKey(m.key);
      return;
    }
    if (flowStep?.type === "image") {
      setImageDraft(m.photo || "");
      setImageUrl("");
      setEditingKey(m.key);
      return;
    }
    if (flowStep?.type === "chips") {
      setEditingKey(m.key);
      return;
    }
    // texto livre
    setEditingId(m.id);
    setEditDraft(m.key === "whatsapp" ? formatPhoneBR(m.text) : m.text);
  };
  const saveEdit = () => {
    if (!editDraft.trim()) return;
    const msg = msgs.find((x) => x.id === editingId);
    setMsgs((m) => m.map((x) => (x.id === editingId ? { ...x, text: editDraft } : x)));
    if (msg?.key) setAnswers((a) => ({ ...a, [msg.key]: editDraft }));
    setEditingId(null);
    setEditDraft("");
  };
  const cancelEdit = () => { setEditingId(null); setEditDraft(""); };
  const cancelKeyEdit = () => {
    setEditingKey(null);
    setImageDraft(""); setImageUrl("");
    setCardSel([]);
    setSpecialtySel(""); setSpecialtyCustom("");
    setCrpNumber("");
    setThemeSub("theme");
  };

  // --- seleção de cards (temas) ---
  const toggleCard = (opt) =>
    setCardSel((s) => (s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]));
  const addCustomCard = () => {
    const v = cardCustom.trim();
    if (!v || cardOpts.includes(v)) { setCardCustom(""); return; }
    setCardOpts((o) => [...o, v]);
    setCardSel((s) => [...s, v]);
    setCardCustom("");
  };
  const confirmCards = () => {
    if (!cardSel.length) return;
    const text = cardSel.join(", ");
    if (applyAnswer("temas", text)) { setCardSel([]); return; }
    submit(text);
    setCardSel([]);
  };

  // --- usar um começo sugerido: preenche com uma frase completa (da base,
  // sem IA) que ela pode editar, em vez de só um fragmento incompleto ---
  const addStarter = (template) => {
    setDraft(template);
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const runGeneration = (all) => {
    const siteObj = buildSiteFromAnswers(all, lead);
    setSite(siteObj);
    // MVP mobile: sem editor com sidebar — cai numa tela simples de publicar.
    // Quem já tem site salvo (hydrate()) continua indo pro editor normalmente.
    setPhase(isMobileViewport() ? "mobile-success" : "site");
    // salva como rascunho assim que o site é gerado — se ela sair (ex: pro
    // checkout) e voltar, o hydrate() consegue restaurar isso.
    saveSite("draft", siteObj, all).then((slug) => { if (slug) setSiteSlug(slug); });
  };

  /* -------- render por fase -------- */

  /* ---- PÁGINA PÚBLICA (psipage.com/slug) ---- */
  if (phase === "public") {
    const fontStyle = (
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        :root { --cpad: 32px; }
        *{box-sizing:border-box;} html{scroll-behavior:smooth;} body{margin:0;} details summary::-webkit-details-marker{display:none;}
        .hero-grid { display:grid; grid-template-columns: 1.1fr .9fr; }
        .sobre-grid { display:grid; grid-template-columns: 1fr 1fr; }
        .diff-grid { display:grid; grid-template-columns: 1fr 1fr; }
        .spec-grid { display:grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) {
          :root { --cpad: 16px; }
          .hero-grid, .sobre-grid, .diff-grid, .spec-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child, .sobre-grid > div:last-child { width: 100%; max-width: 420px; margin: 20px auto 0; }
          .diff-grid > div:first-child { width: 100%; max-width: 420px; margin: 0 auto 20px; }
          .site-nav { display: none !important; }
        }`}</style>
    );
    if (publicSite === undefined) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.paper, color: C.sub, fontFamily: "Inter, system-ui, sans-serif" }}>
          {fontStyle}Carregando...
        </div>
      );
    }
    if (publicSite === null) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: C.paper, color: C.ink, fontFamily: "Inter, system-ui, sans-serif" }}>
          {fontStyle}
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}>Página não encontrada.</h1>
          <p style={{ color: C.sub, fontSize: 14 }}>Esse site ainda não foi publicado ou o endereço está errado.</p>
        </div>
      );
    }
    return <div style={{ background: "#fff" }}>{fontStyle}<ThemedSite d={publicSite} /></div>;
  }

  // ícone de conta (foto ou iniciais) + dropdown com logout — aparece nas
  // fases "chat" e "site", onde já existe uma sessão de verdade.
  const renderAccountMenu = () => (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAccountMenuOpen((v) => !v)} aria-label="Conta"
        style={{ display: "flex", alignItems: "center", gap: 6, padding: 3, borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}>
        <div style={{ width: 26, height: 26, borderRadius: 999, overflow: "hidden", flexShrink: 0, background: C.sageSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {site?.photo
            ? <img src={site.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sage }}>{initials(lead.name)}</span>}
        </div>
        <ChevronDown size={13} color={C.sub} style={{ marginRight: 3 }} />
      </button>
      {accountMenuOpen && (
        <>
          <div onClick={() => setAccountMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div className="fade" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 10, minWidth: 190, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: "0 20px 40px -20px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{lead.name}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1, wordBreak: "break-all" }}>{lead.email}</div>
            </div>
            <button onClick={logout}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.danger, textAlign: "left" }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        </>
      )}
    </div>
  );

  // card de escolha de plano (mensal/anual). TEMPORARIAMENTE fora da UI: o
  // checkout vai ser movido pra tela de sucesso / pós teste (ver Notion). A
  // infra de pagamento (startCheckout, gate em publishSite) segue ativa; este
  // render fica guardado pra ser religado no novo lugar — não é código morto.
  const renderPlanPicker = () => (
    <div className="fade" style={{ marginBottom: 16, padding: 18, borderRadius: 16, background: C.sageSoft, border: `1px solid ${C.line}`, textAlign: "left" }}>
      <p style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 600 }}>Escolha um plano pra publicar</p>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: C.sub }}>Sua página fica no ar enquanto a assinatura estiver ativa.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => startCheckout("monthly")} disabled={checkingOut}
          style={{ flex: "1 1 180px", padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel, cursor: checkingOut ? "default" : "pointer", textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Mensal</div>
          <div style={{ fontSize: 13, color: C.sub }}>R$ 49,90/mês</div>
        </button>
        <button onClick={() => startCheckout("yearly")} disabled={checkingOut}
          style={{ flex: "1 1 180px", padding: "14px 16px", borderRadius: 12, border: `2px solid ${C.sage}`, background: C.panel, cursor: checkingOut ? "default" : "pointer", textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.sage }}>Anual</div>
          <div style={{ fontSize: 13, color: C.sub }}>R$ 29,90/mês — cobrado R$ 358,80/ano</div>
        </button>
      </div>
      {checkingOut && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: C.sub }}>Abrindo o checkout...</p>}
    </div>
  );

  /* ---- DEV: novo quiz selecionável isolado (rota /__quiz) ---- */
  if (phase === "devquiz") {
    return <OnboardingQuiz onComplete={(ans) => { console.log("[quiz] respostas:", ans); alert("Quiz concluído! Respostas no console (F12)."); }} />;
  }

  /* ---- LOADING inicial (checando sessão) ---- */
  if (phase === "loading") {
    return <Shell><div className="fade" style={{ color: C.sub, fontSize: 14 }}>Carregando...</div></Shell>;
  }

  /* ---- LANDING: copy + CTA, sem pedir nada, leva direto pro quiz ---- */
  if (phase === "landing") {
    return (
      <div className="fade landing-page" style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@400;500;600&display=swap');
          *{box-sizing:border-box;}
          @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
          .fade{animation:fade .5s ease both;} @keyframes fade{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
          .landing-cta{transition:transform .12s;} .landing-cta:hover{transform:translateY(-1px);}
          .landing-cta:focus-visible{outline:2px solid ${C.sage};outline-offset:3px;}
          .landing-nav-pill{transition:border-color .16s,color .16s;}
          .landing-nav-pill:hover{border-color:${C.ink};color:${C.ink};}
          @media (max-width: 640px) {
            .landing-header{padding:16px 20px !important;}
            .landing-hero{padding:120px 20px 60px !important;}
            .landing-hero h1{font-size:34px !important;}
          }
        `}</style>
        <header className="landing-header" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: C.paper, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: `1px solid ${C.line}` }}>
          <Brand />
          <button onClick={() => setPhase("quiz")} className="landing-nav-pill"
            style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, color: C.sub, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 999, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit" }}>
            Comece por aqui
          </button>
        </header>

        <main className="landing-hero" style={{ flex: 1, display: "flex", alignItems: "center", padding: "160px 32px 96px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
          <div>
            <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, color: C.clay }}>
              3 minutos · sem cartão
            </span>
            <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 400, fontSize: "clamp(32px,5.2vw,50px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: "16px 0 20px" }}>
              Responda algumas perguntas.<br />
              Saia daqui com o <em style={{ fontStyle: "italic", color: C.sage }}>seu site no ar</em>.
            </h1>
            <p style={{ color: C.sub, fontSize: 17, lineHeight: 1.6, maxWidth: "56ch", margin: "0 0 32px" }}>
              Você não vai escolher template, nem mexer em editor. Só responder sobre o seu trabalho — e o site sai pronto, com seus textos, sua foto e o botão de agendar.
            </p>
            <button onClick={() => setPhase("quiz")} className="landing-cta"
              style={{ padding: "15px 30px", borderRadius: 999, border: "none", cursor: "pointer", background: C.dark, color: C.paper, fontWeight: 500, fontSize: 15, fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Começar
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---- QUIZ (novo, selecionáveis) ---- */
  if (phase === "quiz") {
    return (
      <OnboardingQuiz
        onComplete={async (ans) => {
          const name = titleCase(ans.nome || lead.name);
          setAnswers(ans);
          setLead((l) => ({ ...l, name }));
          setPhase("generating");
          const siteObj = buildSiteFromAnswers(ans, { name, email: "" });
          setSite(siteObj);
          const created = await createTrialSite(siteObj, ans);
          if (!created) {
            // sem link temporário por algum motivo (erro de rede/banco) — não
            // trava o funil, segue direto pro pedido de e-mail como antes.
            setPhase("quiz-email");
            return;
          }
          setPendingTrialSiteId(created.id);
          setSiteSlug(created.slug);
          setSiteStatus("trial");
          setTrialUrl(`${window.location.origin}/${created.slug}`);
          setPhase("trial");
        }}
      />
    );
  }

  /* ---- gerando o site (transição curta entre o fim do quiz e o link) ---- */
  if (phase === "generating") {
    return (
      <Shell>
        <div className="fade" style={{ textAlign: "center", maxWidth: 420, width: "100%" }}>
          <Loader2 size={30} color={C.sage} className="spin" style={{ marginBottom: 18 }} />
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>
            Criando o site de {firstName(lead.name)}...
          </h2>
          <p style={{ color: C.sub, fontSize: 14.5, margin: 0 }}>Isso leva só alguns segundos.</p>
        </div>
      </Shell>
    );
  }

  /* ---- TRIAL: aha moment — site pronto num link temporário, antes de pedir e-mail ---- */
  if (phase === "trial") {
    return (
      <Shell>
        <div className="fade" style={{ textAlign: "center", maxWidth: 460, width: "100%" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.sage, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Sparkles size={26} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 600, margin: "0 0 10px" }}>
            Prontinho, {firstName(lead.name)}! Seu site já existe.
          </h2>
          <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.55, margin: "0 0 24px" }}>
            Dá uma olhada em como ficou — o link já está no ar pra você compartilhar.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 18px", borderRadius: 12, background: C.panel, border: `1px solid ${C.line}` }}>
            <span style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 14.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {trialUrl?.replace(/^https?:\/\//, "")}
            </span>
            <button onClick={() => { navigator.clipboard?.writeText(trialUrl); setTrialLinkCopied(true); setTimeout(() => setTrialLinkCopied(false), 1800); }}
              aria-label={trialLinkCopied ? "Copiado!" : "Copiar link"} title={trialLinkCopied ? "Copiado!" : "Copiar link"}
              style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, border: "none", background: "transparent", color: trialLinkCopied ? C.sage : C.sub, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {trialLinkCopied ? <Check size={16} /> : <Copy size={15} />}
            </button>
            <a href={trialUrl} target="_blank" rel="noreferrer" className="btn-primary-hover"
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 999, border: "none", background: C.dark, color: C.paper, fontWeight: 500, fontSize: 13.5, textDecoration: "none", whiteSpace: "nowrap" }}>
              <ExternalLink size={14} /> Ver site no ar
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  /* ---- QUIZ: e-mail + OTP (último passo, depois do quiz) ---- */
  if (phase === "quiz-email") {
    const ok = /\S+@\S+\.\S+/.test(lead.email);
    if (linkSent) {
      return (
        <Shell>
          <div className="fade welcome-card" style={{ width: "100%", maxWidth: 440, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 22, boxShadow: "0 30px 70px -40px rgba(0,0,0,.3)", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.sageSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Inbox size={22} color={C.sage} />
            </div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 10px" }}>Verifique seu e-mail</h1>
            <p style={{ color: C.sub, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 18px" }}>
              Mandamos um código de acesso pra <b>{lead.email}</b>. Copie e cole aqui embaixo pra continuar.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="00000000"
                inputMode="numeric" disabled={verifyingOtp}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                style={{ flex: 1, minWidth: 0, padding: "13px 15px", borderRadius: 12, border: `1px solid ${C.line}`, background: verifyingOtp ? C.paper : C.panel, fontSize: 16, letterSpacing: ".1em", textAlign: "center", fontFamily: "Inter" }} />
              <button onClick={verifyCode} disabled={!otpCode.trim() || verifyingOtp} className="btn-primary-hover"
                style={{ padding: "0 20px", borderRadius: 999, border: "none", cursor: otpCode.trim() && !verifyingOtp ? "pointer" : "default", background: otpCode.trim() ? C.dark : C.line, color: otpCode.trim() ? C.paper : C.sub, fontWeight: 500, fontSize: 13.5, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {verifyingOtp ? (<><Loader2 size={15} className="spin" /> Verificando...</>) : "Entrar"}
              </button>
            </div>
            {authError && <p style={{ color: C.danger, fontSize: 13, margin: "12px 0 0" }}>{authError}</p>}
            <p style={{ color: C.sub, fontSize: 13, margin: "16px 0 0" }}>
              Não chegou? Confira o spam ou{" "}
              <button onClick={() => { setLinkSent(false); setOtpCode(""); setAuthError(""); }} className="link-hover" style={{ background: "none", border: "none", padding: 0, color: C.sage, fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                tente de novo
              </button>.
            </p>
          </div>
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="fade welcome-card" style={{ width: "100%", maxWidth: 440, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 22, boxShadow: "0 30px 70px -40px rgba(0,0,0,.3)" }}>
          <Brand />
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600, lineHeight: 1.12, margin: "26px 0 12px", letterSpacing: "-.01em" }}>
            Falta só o seu e-mail, {firstName(lead.name)}.
          </h1>
          <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
            É por ele que você acessa seu site depois — sem senha, só um código.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>Qual seu e-mail mesmo?</div>
              <input value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="voce@email.com"
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel, fontSize: 15, fontFamily: "Inter" }} />
            </div>
          </div>
          {authError && <p style={{ color: C.danger, fontSize: 13, margin: "12px 0 0" }}>{authError}</p>}
          <button onClick={sendMagicLink} disabled={!ok || sendingLink} className="btn-primary-hover"
            style={{ marginTop: 22, width: "100%", padding: "14px", borderRadius: 999, border: "none", cursor: ok && !sendingLink ? "pointer" : "default", background: ok ? C.dark : C.line, color: ok ? C.paper : C.sub, fontWeight: 500, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {sendingLink ? "Enviando..." : "Entrar"} <ArrowRight size={17} />
          </button>
          <p style={{ fontSize: 11.5, color: C.sub, textAlign: "center", margin: "14px 0 0" }}>
            100% seguro, sem spam.
          </p>
        </div>
      </Shell>
    );
  }

  /* ---- MVP MOBILE: chat terminou, sem editor — só confirmar e publicar ---- */
  if (phase === "mobile-success") {
    return (
      <Shell>
        <div className="fade" style={{ textAlign: "center", maxWidth: 460, width: "100%" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.sage, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Check size={26} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "0 0 10px" }}>
            Prontinho, {firstName(lead.name)}!
          </h2>
          <p style={{ color: C.sub, fontSize: 15, margin: "0 0 24px" }}>
            Recebemos suas respostas e seu site já está pronto. Publique agora pra ele ficar no ar.
          </p>
          <button onClick={publishSite} disabled={publishing} className="btn-primary-hover"
            style={{ width: "100%", padding: "14px", borderRadius: 999, border: "none", cursor: publishing ? "default" : "pointer", background: C.dark, color: C.paper, fontWeight: 500, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Check size={16} /> {publishing ? "Publicando..." : "Publicar meu site"}
          </button>
          {authError && <p style={{ color: C.danger, fontSize: 13, margin: "12px 0 0" }}>{authError}</p>}
        </div>
      </Shell>
    );
  }

  /* ---- PUBLICADO (aha moment) ---- */
  if (phase === "published") {
    return (
      <Shell>
        <div className="fade" style={{ textAlign: "center", maxWidth: 460, width: "100%" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.sage, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Check size={26} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600, margin: "0 0 10px" }}>
            Seu site está no ar, {firstName(lead.name)}.
          </h2>
          <p style={{ color: C.sub, fontSize: 15, margin: "0 0 28px" }}>
            Já pode compartilhar esse link com suas pacientes.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 12px 12px 18px", borderRadius: 12, background: C.panel, border: `1px solid ${C.line}`, marginBottom: 16 }}>
            <span style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 14.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {publishedUrl?.replace(/^https?:\/\//, "")}
            </span>
            <button onClick={() => { navigator.clipboard?.writeText(publishedUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800); }}
              style={{ padding: "9px 14px", borderRadius: 999, border: "none", background: linkCopied ? C.sage : C.dark, color: C.paper, fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "background .16s" }}>
              <Copy size={14} /> {linkCopied ? "Copiado!" : "Copiar link"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="btn-primary-hover"
              style={{ padding: "12px 20px", borderRadius: 999, border: "none", background: C.dark, color: C.paper, fontWeight: 500, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <ExternalLink size={15} /> Ver site no ar
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Acabei de criar meu site! Dá uma olhada: ${publishedUrl}`)}`} target="_blank" rel="noreferrer"
              style={{ padding: "12px 20px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontWeight: 500, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <MessageCircle size={15} /> Compartilhar
            </a>
          </div>

          <button onClick={() => setPhase("site")} className="link-hover"
            style={{ marginTop: 28, padding: 0, border: "none", background: "none", color: C.sub, fontSize: 13.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Continuar editando o site
          </button>
        </div>
      </Shell>
    );
  }

  /* ---- SITE PRONTO ---- */
  return (
    <div className="site-done-wrap" style={{ minHeight: "100vh", background: C.paper, fontFamily: "Inter, system-ui, sans-serif", padding: 22 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;} body{margin:0;} details summary::-webkit-details-marker{display:none;}

        /* --- grids do preview do site: colapsam em telas estreitas --- */
        .hero-grid { display:grid; grid-template-columns: 1.1fr .9fr; }
        .sobre-grid { display:grid; grid-template-columns: 1fr 1fr; }
        .spec-grid { display:grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) {
          .hero-grid, .sobre-grid, .spec-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child, .sobre-grid > div:last-child { max-width: 220px; margin: 20px auto 0; }
          .site-nav { display: none !important; }
        }
        @media (max-width: 900px) {
          .site-editor-cols { flex-direction: column; }
          .site-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; flex-wrap: wrap; gap: 20px !important; }
          .site-sidebar > div { flex: 1 1 200px; }
          /* quem já tem site salvo continua caindo aqui mesmo no mobile (hydrate()) — evita auto-zoom do iOS */
          input, textarea, select { font-size: 16px !important; }
        }
        @media (max-width: 480px) {
          .site-done-wrap { padding: 12px !important; }
          .site-actions-row button { flex: 1; }
        }
      `}</style>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="fade" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, background: C.sageSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={20} color={C.sage} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>Seu site está pronto, {firstName(lead.name)}.</div>
              <div style={{ fontSize: 13, color: C.sub }}>Feito a partir das suas respostas. Role para conferir.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div className="site-actions-row" style={{ display: "flex", gap: 10 }}>
              {publishedUrl && (
                <>
                  <a href={publishedUrl} target="_blank" rel="noreferrer"
                    style={{ padding: "11px 18px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontWeight: 500, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <ExternalLink size={14} /> Ver site
                  </a>
                  <button onClick={() => navigator.clipboard?.writeText(publishedUrl)} aria-label="Copiar link" title="Copiar link"
                    style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Copy size={15} />
                  </button>
                </>
              )}
              <button onClick={toggleEditMode}
                style={{ padding: "11px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 500, fontSize: 13.5, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 7,
                  border: editMode ? "none" : `1px solid ${C.line}`,
                  background: editMode ? C.sage : C.panel,
                  color: editMode ? C.paper : C.ink }}>
                <Pencil size={14} /> {editMode ? "Concluir edição" : "Editar"}
              </button>
              <button onClick={restartQuiz}
                style={{ padding: "11px 18px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontWeight: 500, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>
                Recomeçar
              </button>
              <button onClick={publishSite} disabled={publishing} className="btn-primary-hover"
                style={{ padding: "11px 20px", borderRadius: 999, border: "none", background: C.dark, color: C.paper, fontWeight: 500, fontSize: 13.5, cursor: publishing ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap" }}>
                <Check size={16} /> {publishing ? "Publicando..." : siteStatus === "published" ? "Atualizar site" : "Publicar site"}
              </button>
            </div>
            {renderAccountMenu()}
          </div>
        </div>
        {authError && (
          <div className="fade" style={{ marginBottom: 12, fontSize: 13, color: C.danger }}>{authError}</div>
        )}
        <div className="fade" style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", gap: 3, padding: 3, borderRadius: 12, background: C.panel, border: `1px solid ${C.line}` }}>
            {Object.entries(PREVIEW_DEVICES).map(([key, { label, icon: Icon }]) => (
              <button key={key} onClick={() => setPreviewDevice(key)} aria-label={label} title={label}
                style={{
                  width: 36, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: previewDevice === key ? C.sageSoft : "transparent",
                  color: previewDevice === key ? C.sage : C.sub,
                  transition: "background .16s,color .16s",
                }}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
        <div className="site-editor-cols" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div className="site-sidebar fade" style={{ width: 224, flexShrink: 0, position: "sticky", top: 22, display: "flex", flexDirection: "column", gap: 22 }}>
            {editMode && selectedField ? (
              /* --- editor do campo selecionado --- */
              (() => {
                const base = baseField(selectedField);
                const reg = FIELD_REGISTRY[base];
                if (!reg) return null;
                return (
                  <div>
                    <button onClick={() => setSelectedField(null)} className="link-hover"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, marginBottom: 12, color: C.sub, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                      <ArrowRight size={13} style={{ transform: "rotate(180deg)" }} /> Voltar
                    </button>
                    <div style={{ fontSize: 12, color: C.clay, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>{reg.label}</div>
                    {reg.type === "text" && (
                      <input value={site?.[base] || ""} onChange={(e) => editField(base, e.target.value)} placeholder={reg.ph} style={edInput(C)} />
                    )}
                    {reg.type === "textarea" && (
                      <textarea value={site?.[base] || ""} onChange={(e) => editField(base, e.target.value)} placeholder={reg.ph} rows={5} style={{ ...edInput(C), resize: "vertical", lineHeight: 1.5 }} />
                    )}
                    {reg.type === "list" && (
                      <ListEditor items={site?.[base] || []} onChange={(arr) => editField(base, arr)} withDesc={reg.withDesc} labels={reg.labels} C={C} />
                    )}
                    {reg.type === "image" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {site?.[base] && <img src={site[base]} alt="" style={{ width: "100%", borderRadius: 12, border: `1px solid ${C.line}` }} />}
                        <input type="file" accept="image/*" ref={editFileRef} style={{ display: "none" }} onChange={editImageFile} />
                        <button onClick={() => editFileRef.current?.click()}
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px", borderRadius: 999, border: `1px solid ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                          <ImageIcon size={15} /> {site?.[base] ? "Trocar imagem" : "Escolher imagem"}
                        </button>
                        <input value={/^data:/.test(site?.[base] || "") ? "" : (site?.[base] || "")} onChange={(e) => editField(base, e.target.value)} placeholder="ou cole o link de uma imagem" style={edInput(C)} />
                        {site?.[base] && (
                          <button onClick={() => editField(base, "")}
                            style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, color: C.sub, fontWeight: 500, fontSize: 12.5, cursor: "pointer" }}>
                            Remover
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* --- sem seleção: Tema + Paleta (+ dica em editMode) --- */
              <>
                {editMode && (
                  <div style={{ padding: "10px 12px", borderRadius: 12, background: C.sageSoft, border: `1px solid ${C.line}`, fontSize: 12.5, color: C.sage, fontWeight: 600, lineHeight: 1.4 }}>
                    Clique num elemento do site pra editá-lo.
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: C.clay, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>Tema</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(THEMES).map(([key, label]) => (
                      <button key={key} onClick={() => changeTheme(key)}
                        style={{
                          padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "border-color .16s,background .16s",
                          border: `1px solid ${(site?.theme || "classic") === key ? C.sage : C.line}`,
                          background: (site?.theme || "classic") === key ? C.sageSoft : C.panel,
                          color: C.ink,
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.clay, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>Paleta</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.keys(COLOR_SCHEMES).map((label) => {
                      const on = (site?.colorScheme || DEFAULT_COLOR_SCHEME) === label;
                      return (
                        <button key={label} onClick={() => changeColorScheme(label)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "border-color .16s,background .16s",
                            border: `1px solid ${on ? C.sage : C.line}`,
                            background: on ? C.sageSoft : C.panel,
                            color: C.ink,
                          }}>
                          <span style={{ width: 14, height: 14, borderRadius: 999, background: COLOR_SCHEMES[label].accent, flexShrink: 0 }} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="fade" style={{
            flex: 1, minWidth: 0, height: "calc(100vh - 150px)",
            borderRadius: 20, border: `1px solid ${C.line}`, overflow: "hidden",
            background: previewDevice === "desktop" ? C.panel : C.paper,
            boxShadow: "0 24px 60px -36px rgba(0,0,0,.3)",
            display: "flex", justifyContent: "center",
            padding: previewDevice === "desktop" ? 0 : 20,
          }}>
            <PreviewFrame width={PREVIEW_DEVICES[previewDevice].width} radius={previewDevice === "desktop" ? 0 : 10}
              editMode={editMode} selectedField={selectedField} onSelect={setSelectedField}>
              <ThemedSite d={site} />
            </PreviewFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
