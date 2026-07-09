import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Send, MessageCircle, Instagram, Mail, Check,
  Sparkles, Loader2, Pencil, X, Plus, Image as ImageIcon, MapPin,
} from "lucide-react";
import { supabase } from "./lib/supabase.js";
import { slugify, withSuffix } from "./lib/slug.js";
import { SitePreviewEditorial } from "./ThemeEditorial.jsx";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME } from "./colorSchemes.js";

/* ------------------------------------------------------------------ */
/*  Avence Psi — v2: onboarding conversacional + login por magic link   */
/*  1) welcome (nome/email → magic link)  2) conversa suave              */
/*  3) copy determinística  4) site pronto → publica no Supabase.        */
/*  Funil de canal único: WhatsApp.                                      */
/* ------------------------------------------------------------------ */

const C = {
  paper: "#F3F1EA", panel: "#FBFAF7", ink: "#17160F", sub: "#6F6A5E",
  line: "#E5E1D6", sage: "#46614D", sageSoft: "#EAEFE9",
  acid: "#B5EF00", dark: "#14140F", bubbleUser: "#14140F",
};

// largura máxima do conteúdo das seções do site publicado + respiro lateral em telas pequenas
const CONTAINER_MAX = 1216;
const CONTAINER_PAD = 32;

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
  aviso: "Atendimento particular. Recibo emitido para reembolso.",
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

/* ---------------------------- conversa ---------------------------- */
const FLOW = [
  { key: "specialty", bot: "Prazer, {first}! 🌱 Qual é a sua especialidade?", type: "specialty" },
  { key: "crp", bot: "E o seu registro profissional?", type: "crp" },
  { key: "modalidade", bot: "E você atende de que forma?", type: "chips", options: ["100% Online", "Presencial", "Híbrido"] },
  { key: "endereco", bot: "Qual o endereço do consultório? Vai aparecer no rodapé do site, com um mapa.", ph: "Rua, número, bairro, cidade - UF", type: "text",
    skipIf: (a) => a.modalidade === "100% Online" },
  { key: "abordagem", bot: "Qual é a sua abordagem principal?", type: "chips", options: ["TCC", "Psicanálise", "Humanista", "Gestalt"], allowText: true, ph: "Outra..." },
  { key: "temas", bot: "Quais temas você mais atende? Selecione quantos quiser — e adicione os seus no campo abaixo.", type: "cards",
    options: ["Ansiedade", "Depressão", "Autoestima", "Autoconhecimento", "Relacionamentos", "Luto", "Estresse / Burnout", "Traumas", "Síndrome do pânico", "TOC", "Fobias", "Maternidade / Parentalidade"] },
  { key: "colorScheme", bot: "Vamos escolher a paleta de cores do site. Dá pra trocar depois.", type: "colors", options: Object.keys(COLOR_SCHEMES) },
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

const GEN_STATUS = [
  "Lendo suas respostas...", "Escrevendo sua headline...",
  "Organizando as especialidades...", "Dando forma à sua bio...",
  "Montando as seções...", "Finalizando o site...",
];

/* --------------------------- utilities ---------------------------- */
let _mid = 0;
const uid = () => ++_mid;
const CARDS_STEP = FLOW.find((f) => f.type === "cards");
const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
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

/* -------------------------- copy determinística --------------------- */
/* Sem IA por enquanto: monta a copy a partir do template + respostas.   */
function buildCopy(input) {
  return {
    ...DEFAULTS,
    badge: input.modalidade === "Presencial" ? "Atendimento presencial" : "Atendimento 100% Online",
    methodTitle: `Sobre a ${input.abordagem}`,
    bio: input.sobre || DEFAULTS.bio,
  };
}

/* =========================== SITE PREVIEW ========================== */
function SitePreview({ d }) {
  const { accent, accentSoft } = COLOR_SCHEMES[d.colorScheme] || COLOR_SCHEMES[DEFAULT_COLOR_SCHEME];
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);
  const Btn = ({ children, primary }) => (
    <a href={wa} target="_blank" rel="noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 19px", borderRadius: 999,
      fontSize: 13, fontWeight: 600, textDecoration: "none",
      background: primary ? accent : "transparent", color: primary ? "#fff" : C.ink,
      border: primary ? "none" : `1px solid ${C.line}`,
    }}>{children}</a>
  );
  const wrap = (extra) => ({ maxWidth: CONTAINER_MAX, margin: "0 auto", padding: `0 ${CONTAINER_PAD}px`, ...extra });
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: C.ink, background: "#fff", fontSize: 14, lineHeight: 1.55 }}>
      {/* header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={wrap({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `14px ${CONTAINER_PAD}px` })}>
          {d.logo
            ? <img src={d.logo} alt={d.name} style={{ height: 28, maxWidth: 160, objectFit: "contain" }} />
            : <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>{d.name}</span>}
          <nav className="site-nav" style={{ display: "flex", gap: 16, fontSize: 12, color: C.sub }}><span>Especialidades</span><span>Método</span><span>Sobre</span><span>Dúvidas</span></nav>
          <Btn primary><MessageCircle size={14} /> Agendar</Btn>
        </div>
      </div>
      {/* hero */}
      <div className="hero-grid" style={wrap({ padding: `46px ${CONTAINER_PAD}px 40px`, gap: 28, alignItems: "center" })}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: accent, background: accentSoft, padding: "5px 11px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: accent }} />{d.badge}
          </span>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, lineHeight: 1.08, margin: "16px 0 12px", letterSpacing: "-.01em" }}>{d.headline}</h1>
          <p style={{ color: C.sub, maxWidth: 380, margin: "0 0 22px" }}>{d.subheadline}</p>
          <div style={{ display: "flex", gap: 10 }}><Btn primary>Iniciar jornada <ArrowRight size={14} /></Btn><Btn>Saiba mais</Btn></div>
        </div>
        <div style={{ aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: `linear-gradient(160deg, ${accentSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {d.photo
            ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontFamily: "Fraunces, serif", fontSize: 46, color: accent, opacity: .55 }}>{initials(d.name)}</span>}
        </div>
      </div>
      {/* especialidades */}
      <div style={{ background: C.panel }}>
        <div style={wrap({ padding: `40px ${CONTAINER_PAD}px` })}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, margin: 0 }}>Foco em resultados</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 22px" }}>Especialidades clínicas</h2>
          <div className="spec-grid" style={{ gap: 14 }}>
            {d.specialties.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px" }}>
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 13, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "6px 0" }}>{s.t}</h3>
                <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* metodologia */}
      <div style={{ background: C.dark, color: "#EDEBE3" }}>
        <div style={wrap({ padding: `40px ${CONTAINER_PAD}px` })}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.acid, margin: 0 }}>Abordagem</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 16px" }}>{d.methodTitle}</h2>
          {d.methodText.split("\n\n").map((p, i) => (
            <p key={i} style={{ maxWidth: 560, color: "#C7C4BA", margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>{p}</p>
          ))}
        </div>
      </div>
      {/* sobre */}
      <div className="sobre-grid" style={wrap({ padding: `40px ${CONTAINER_PAD}px`, gap: 26, alignItems: "center" })}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, margin: 0 }}>Quem sou eu</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "8px 0 14px" }}>Uma escuta clínica e humana.</h2>
          <p style={{ color: C.sub, fontSize: 13.5, marginBottom: 18 }}>{d.bio}</p>
          <Btn primary><MessageCircle size={14} /> Agende uma consulta</Btn>
        </div>
        <div style={{ aspectRatio: "4/5", borderRadius: 16, overflow: "hidden", background: `linear-gradient(160deg, ${accentSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {d.photo
            ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontFamily: "Fraunces, serif", fontSize: 40, color: accent, opacity: .5 }}>{initials(d.name)}</span>}
        </div>
      </div>
      {/* faq */}
      <div style={{ background: C.panel }}>
        <div style={wrap({ padding: `40px ${CONTAINER_PAD}px` })}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 18px" }}>Perguntas frequentes</h2>
          {d.faq.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${C.line}`, padding: "13px 0" }} open={i === 0}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14, listStyle: "none" }}>{f.q}</summary>
              <p style={{ margin: "8px 0 0", color: C.sub, fontSize: 13 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      {/* cta final */}
      <div style={wrap({ padding: `40px ${CONTAINER_PAD}px` })}>
        <div style={{ background: C.dark, borderRadius: 16, padding: 30, color: "#fff", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>Vamos dar o primeiro passo?</h3>
          <p style={{ color: "#B7B4AA", fontSize: 13, margin: "0 0 18px" }}>Agende uma conversa inicial agora mesmo.</p>
          <a href={wa} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 999, background: C.acid, color: C.ink, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <MessageCircle size={15} /> Falar no WhatsApp
          </a>
        </div>
      </div>
      {/* footer */}
      <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel }}>
        {d.endereco && (
          <div style={wrap({ padding: `26px ${CONTAINER_PAD}px 0` })}>
            <iframe title="Localização do consultório" loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(d.endereco)}&output=embed`}
              style={{ width: "100%", height: 200, border: 0, borderRadius: 12, display: "block" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, marginTop: 10 }}>
              <MapPin size={13} />{d.endereco}
            </div>
          </div>
        )}
        <div style={wrap({ padding: `26px ${CONTAINER_PAD}px`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 })}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{d.title} · {d.modalidade}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.sub }}><Instagram size={14} />{d.instagram}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.sub }}><Mail size={14} />{d.email}</span>
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

/* --------- Shell e Brand em escopo de módulo (estáveis) ---------- */
/* Definir estes DENTRO do App faz o React remontar tudo a cada tecla, */
/* o que fazia o input perder o foco. Fora do App, a identidade é fixa. */
const Shell = ({ children }) => (
  <div className="shell-outer" style={{ background: C.paper, fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;} body{margin:0;} details summary::-webkit-details-marker{display:none;}
      input:focus,textarea:focus{outline:none;border-color:${C.sage} !important;}
      .fade{animation:fade .5s ease both;} @keyframes fade{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
      .bub{animation:bub .35s ease both;} @keyframes bub{from{opacity:0;transform:translateY(6px) scale(.98);}to{opacity:1;transform:none;}}
      .prev::-webkit-scrollbar{width:7px;} .prev::-webkit-scrollbar-thumb{background:#D8D3C6;border-radius:9px;}
      .dot{width:6px;height:6px;border-radius:99px;background:${C.sub};display:inline-block;animation:blink 1.2s infinite;}
      .dot:nth-child(2){animation-delay:.2s;}.dot:nth-child(3){animation-delay:.4s;}
      @keyframes blink{0%,60%,100%{opacity:.25;}30%{opacity:1;}}
      @keyframes spin{to{transform:rotate(360deg);}} .spin{animation:spin 1s linear infinite;}

      /* --- mobile: viewport real (evita corte por barra do navegador) --- */
      .shell-outer{ min-height: 100vh; min-height: 100dvh; }
      .welcome-card{ padding: 40px 36px; }
      .chat-card{ height: min(680px, 92vh); height: min(680px, 92dvh); }
      @media (max-width: 480px) {
        .shell-outer{ padding: 12px !important; }
        .welcome-card{ padding: 28px 20px !important; border-radius: 18px !important; }
        .welcome-card h1{ font-size: 24px !important; }
        .chat-card{ height: 94dvh !important; border-radius: 16px !important; }
      }
    `}</style>
    {children}
  </div>
);

const Brand = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
    <div style={{ width: 26, height: 26, borderRadius: 7, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: C.acid }} />
    </div>
    <span style={{ fontWeight: 700, fontSize: 14 }}>Avence <span style={{ color: C.sage }}>Psi</span></span>
  </div>
);

/* ============================== APP ============================== */
export default function App() {
  const [phase, setPhase] = useState("loading"); // loading | public | welcome | chat | generating | site
  const [lead, setLead] = useState({ name: "", email: "" });
  const [authError, setAuthError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [siteSlug, setSiteSlug] = useState(null);
  const [siteStatus, setSiteStatus] = useState("draft");
  const [publicSite, setPublicSite] = useState(undefined); // undefined=carregando null=não achou objeto=achou
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const flowStartedRef = useRef(false); // true assim que o quiz começa nesta aba — evita que a sessão chegando depois (outra aba) interrompa o fluxo
  const [msgs, setMsgs] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [genLine, setGenLine] = useState(0);
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
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const composerRef = useRef(null);

  const step = FLOW[stepIdx];
  const editingFlowStep = editingKey ? FLOW.find((f) => f.key === editingKey) : null;
  const activeType = editingFlowStep ? editingFlowStep.type : step?.type;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

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

  // login anônimo do Supabase: cria sessão na hora, sem e-mail/SMTP.
  // (auth por magic link removida por enquanto — sem verificação de e-mail)
  const startQuiz = async () => {
    if (!lead.name.trim() || !/\S+@\S+\.\S+/.test(lead.email)) return;
    const name = titleCase(lead.name);
    setLead((l) => ({ ...l, name }));
    // marca ANTES de chamar signInAnonymously — esse próprio método dispara
    // o listener onAuthStateChange internamente, que pode rodar hydrate()
    // numa corrida antes da nossa continuação abaixo, duplicando a 1ª mensagem.
    flowStartedRef.current = true;
    setSendingLink(true);
    setAuthError("");
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { name, email: lead.email } },
    });
    setSendingLink(false);
    if (error) { flowStartedRef.current = false; setAuthError(error.message); return; }
    setPhase("chat");
    botSay(FLOW[0].bot.replace("{first}", firstName(name)));
    // manda o lead pro Notion em segundo plano — não trava o quiz se falhar
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: lead.email }),
    }).catch(() => {});
  };

  // roteamento simples (path != "/" = site público) + sessão existente (magic link)
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (path) {
      setPhase("public");
      supabase.from("sites").select("data").eq("slug", path).eq("status", "published").maybeSingle()
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
      } else {
        setPhase("chat");
        botSay(FLOW[0].bot.replace("{first}", firstName(name)));
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || flowStartedRef.current) return;
      hydrate(session);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) hydrate(data.session);
      else setPhase("welcome");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const restartQuiz = () => {
    setMsgs([]); setStepIdx(0); setAnswers({}); setSite(null);
    setSiteSlug(null); setSiteStatus("draft"); setPublishedUrl(null);
    setPhase("chat");
    botSay(FLOW[0].bot.replace("{first}", firstName(lead.name)));
  };

  const changeTheme = (theme) => {
    const updated = { ...site, theme };
    setSite(updated);
    saveSite(siteStatus, updated, answers);
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
    const baseSlug = slugify(lead.name);
    for (let n = 1; n <= 20; n++) {
      const slug = existing?.slug || withSuffix(baseSlug, n);
      const payload = { owner_id: ownerId, slug, status, data: siteData, answers: answersData };
      const { error } = existing
        ? await supabase.from("sites").update(payload).eq("id", existing.id)
        : await supabase.from("sites").insert(payload);
      if (!error) return slug;
      if (existing || error.code !== "23505") return null; // só tenta de novo se foi conflito de slug numa criação nova
    }
    return null;
  };

  const publishSite = async () => {
    setPublishing(true);
    setAuthError("");
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // fallback: não deveria acontecer (a sessão anônima é criada no início do quiz), mas garante
      const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { name: lead.name, email: lead.email } } });
      if (error) { setPublishing(false); setAuthError(error.message); return; }
      session = data.session;
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
    setSiteSlug(slug);
    setSiteStatus("published");
    setPublishedUrl(`${window.location.origin}/${slug}`);
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
    let nextIdx = stepIdx + 1;
    while (nextIdx < FLOW.length && FLOW[nextIdx].skipIf && FLOW[nextIdx].skipIf(merged)) nextIdx++;
    if (nextIdx < FLOW.length) {
      setStepIdx(nextIdx);
      botSay(FLOW[nextIdx].bot.replace("{first}", firstName(lead.name)));
    } else {
      setTimeout(() => runGeneration(merged), 500);
    }
  };

  const submit = (value) => {
    if (!value || !value.trim()) return;
    const key = step.key;
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
    setPhase("generating");
    // título final: especialidade + registro (ou "em formação" se ainda não tiver CRP)
    const title = all.crp ? `${all.specialty} • ${all.crp}` : `${all.specialty} • Em formação`;
    const input = {
      name: lead.name, title, modalidade: all.modalidade,
      abordagem: all.abordagem, temas: all.temas, tom: all.tom, sobre: all.sobre,
    };
    // status rotativo — só pacing visual, não espera nenhuma rede
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % GEN_STATUS.length; setGenLine(i); }, 450);

    setTimeout(() => {
      clearInterval(iv);
      const copy = buildCopy(input);

      // --- A SELEÇÃO É VERDADE: forçamos os valores escolhidos ---
      const selectedTemas = (all.temas || "").split(",").map((s) => s.trim()).filter(Boolean);
      const aiSpecs = Array.isArray(copy.specialties) ? copy.specialties : [];
      const finalSpecialties = selectedTemas.length
        ? selectedTemas.map((t, i) => {
            const byIndex = aiSpecs[i] && aiSpecs[i].d;
            const byName = aiSpecs.find((s) => s.t && s.t.toLowerCase() === t.toLowerCase())?.d;
            return { t, d: byIndex || byName || GENERIC_SPEC_DESC };
          })
        : (aiSpecs.length ? aiSpecs : DEFAULTS.specialties);

      const badge = BADGE_BY_MODALIDADE[all.modalidade] || copy.badge || DEFAULTS.badge;
      const methodTitle = KNOWN_APPROACHES.includes(all.abordagem)
        ? `O que é a ${all.abordagem}?`
        : (copy.methodTitle || "Sobre a abordagem");

      const siteObj = {
        ...copy,
        specialties: finalSpecialties,
        badge,
        methodTitle,
        name: lead.name, email: lead.email, title,
        modalidade: all.modalidade, whatsapp: all.whatsapp, instagram: all.instagram,
        photo: all.photo || "",
        logo: all.logo || "",
        endereco: all.endereco || "",
        waMessage: `Olá! Vi seu site e tenho interesse em agendar uma consulta.`,
        theme: "classic",
        colorScheme: all.colorScheme || DEFAULT_COLOR_SCHEME,
      };
      setSite(siteObj);
      setPhase("site");
      // salva como rascunho assim que o site é gerado — se ela sair (ex: pro
      // checkout) e voltar, o hydrate() consegue restaurar isso.
      saveSite("draft", siteObj, all).then((slug) => { if (slug) setSiteSlug(slug); });
    }, GEN_STATUS.length * 450 + 300);
  };

  /* -------- render por fase -------- */

  /* ---- PÁGINA PÚBLICA (avence-psi.com/slug) ---- */
  if (phase === "public") {
    const fontStyle = (
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;} body{margin:0;} details summary::-webkit-details-marker{display:none;}
        .hero-grid { display:grid; grid-template-columns: 1.1fr .9fr; }
        .sobre-grid { display:grid; grid-template-columns: 1fr 1fr; }
        .spec-grid { display:grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) {
          .hero-grid, .sobre-grid, .spec-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child, .sobre-grid > div:last-child { max-width: 220px; margin: 20px auto 0; }
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

  /* ---- LOADING inicial (checando sessão) ---- */
  if (phase === "loading") {
    return <Shell><div className="fade" style={{ color: C.sub, fontSize: 14 }}>Carregando...</div></Shell>;
  }

  /* ---- WELCOME / captura de lead ---- */
  if (phase === "welcome") {
    const ok = lead.name.trim() && /\S+@\S+\.\S+/.test(lead.email);
    return (
      <Shell>
        <div className="fade welcome-card" style={{ width: "100%", maxWidth: 440, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 22, boxShadow: "0 30px 70px -40px rgba(0,0,0,.3)" }}>
          <Brand />
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600, lineHeight: 1.12, margin: "26px 0 12px", letterSpacing: "-.01em" }}>
            Vamos criar o seu site em uma conversa.
          </h1>
          <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
            Sem formulários intermináveis. Responda algumas perguntas do seu jeito e a gente escreve tudo pra você. Leva uns 3 minutos.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>Seu nome</div>
              <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder="Marina Costa"
                style={{ width: "100%", padding: "13px 15px", borderRadius: 11, border: `1px solid ${C.line}`, background: "#fff", fontSize: 15, fontFamily: "Inter" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>Seu melhor e-mail</div>
              <input value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="voce@email.com"
                onKeyDown={(e) => e.key === "Enter" && startQuiz()}
                style={{ width: "100%", padding: "13px 15px", borderRadius: 11, border: `1px solid ${C.line}`, background: "#fff", fontSize: 15, fontFamily: "Inter" }} />
            </div>
          </div>
          {authError && <p style={{ color: "#B3453A", fontSize: 13, margin: "12px 0 0" }}>{authError}</p>}
          <button onClick={startQuiz} disabled={!ok || sendingLink}
            style={{ marginTop: 22, width: "100%", padding: "14px", borderRadius: 999, border: "none", cursor: ok && !sendingLink ? "pointer" : "default", background: ok ? C.dark : "#D9D5CA", color: "#fff", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .2s" }}>
            {sendingLink ? "Preparando..." : "Começar a conversa"} <ArrowRight size={17} />
          </button>
          <p style={{ fontSize: 11.5, color: C.sub, textAlign: "center", margin: "14px 0 0" }}>
            Sem spam, sem senha.
          </p>
        </div>
      </Shell>
    );
  }

  /* ---- CHAT ---- */
  if (phase === "chat") {
    return (
      <Shell>
        <div className="chat-card" style={{ width: "100%", maxWidth: 480, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 22, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 70px -40px rgba(0,0,0,.3)" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Brand />
            <span style={{ fontSize: 11.5, color: C.sage, fontWeight: 600 }}>● online</span>
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {msgs.map((m) => {
              const editable = m.role === "user" && m.key;
              if (editingId === m.id) {
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", width: "88%", justifyContent: "flex-end" }}>
                      <input autoFocus value={editDraft}
                        onChange={(e) => setEditDraft(m.key === "whatsapp" ? formatPhoneBR(e.target.value) : e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        style={{ flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.sage}`, background: "#fff", fontSize: 14.5, fontFamily: "Inter" }} />
                      <button onClick={saveEdit} aria-label="Salvar"
                        style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 999, border: "none", background: C.sage, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEdit} aria-label="Cancelar"
                        style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="bub" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    onClick={() => editable && startEdit(m)}
                    title={editable ? "Toque para editar" : undefined}
                    style={{
                      position: "relative", maxWidth: "82%", padding: "11px 15px",
                      paddingRight: editable ? 34 : 15,
                      borderRadius: 16, fontSize: 14.5, lineHeight: 1.5,
                      background: m.role === "user" ? C.bubbleUser : "#fff",
                      color: m.role === "user" ? "#fff" : C.ink,
                      border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                      borderBottomRightRadius: m.role === "user" ? 5 : 16,
                      borderBottomLeftRadius: m.role === "user" ? 16 : 5,
                      cursor: editable ? "pointer" : "default",
                      outline: editingKey === m.key ? `2px solid ${C.acid}` : "none",
                      outlineOffset: 2,
                    }}>
                    {m.photo
                      ? <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                          <img src={m.photo} alt="" style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover" }} />{m.text}
                        </span>
                      : m.text}
                    {editable && (
                      <Pencil size={12} style={{ position: "absolute", top: 10, right: 12, opacity: .5 }} />
                    )}
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="bub" style={{ display: "flex" }}>
                <div style={{ padding: "13px 16px", borderRadius: 16, borderBottomLeftRadius: 5, background: "#fff", border: `1px solid ${C.line}`, display: "flex", gap: 4 }}>
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
          </div>
          {/* composer */}
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.line}`, background: C.panel }}>
            {editingKey && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, fontSize: 12.5, color: C.sage, fontWeight: 600 }}>
                Editando resposta anterior
                <button onClick={cancelKeyEdit} style={{ background: "none", border: "none", color: C.sub, fontSize: 12.5, cursor: "pointer", fontWeight: 500 }}>
                  Cancelar
                </button>
              </div>
            )}
            {!typing && activeType === "chips" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: (editingFlowStep || step).allowText ? 10 : 0 }}>
                {(editingFlowStep || step).options.map((o) => (
                  <button key={o} onClick={() => chooseChip(o)}
                    style={{ padding: "9px 15px", borderRadius: 999, border: `1px solid ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>{o}</button>
                ))}
              </div>
            )}
            {!typing && activeType === "colors" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 4 }}>
                {(editingFlowStep || step).options.map((o) => (
                  <button key={o} onClick={() => chooseChip(o)}
                    style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", height: 22 }}>
                      {COLOR_SCHEMES[o].swatches.map((sw, i) => (
                        <div key={i} style={{ flex: 1, background: sw }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{o}</span>
                  </button>
                ))}
              </div>
            )}
            {!typing && activeType === "specialty" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {SPECIALTY_TITLES.map((s) => {
                    const on = specialtySel === s;
                    return (
                      <button key={s} onClick={() => { setSpecialtySel(s); setSpecialtyCustom(""); }}
                        style={{ padding: "8px 13px", borderRadius: 999, fontWeight: 600, fontSize: 13, cursor: "pointer",
                          border: `1px solid ${on ? C.sage : C.line}`, background: on ? C.sage : "#fff", color: on ? "#fff" : C.ink }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <input value={specialtyCustom} onChange={(e) => { setSpecialtyCustom(e.target.value); setSpecialtySel(""); }}
                    placeholder="ou digite a sua..." onKeyDown={(e) => e.key === "Enter" && confirmSpecialty()}
                    style={{ flex: 1, minWidth: 0, padding: "11px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14, fontFamily: "Inter" }} />
                  <button onClick={confirmSpecialty} disabled={!(specialtySel || specialtyCustom.trim())} aria-label="Continuar"
                    style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: "none",
                      background: (specialtySel || specialtyCustom.trim()) ? C.dark : "#D9D5CA", color: "#fff",
                      cursor: (specialtySel || specialtyCustom.trim()) ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
            {!typing && activeType === "crp" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {CRP_PREFIXES.map((p) => (
                    <button key={p} onClick={() => setCrpPrefix(p)}
                      style={{ padding: "7px 12px", borderRadius: 999, fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                        border: `1px solid ${crpPrefix === p ? C.sage : C.line}`, background: crpPrefix === p ? C.sage : "#fff", color: crpPrefix === p ? "#fff" : C.ink }}>
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 999, background: "#fff", overflow: "hidden" }}>
                    <span style={{ padding: "11px 0 11px 15px", fontSize: 14, fontWeight: 600, color: C.sub, whiteSpace: "nowrap" }}>CRP {crpPrefix}/</span>
                    <input value={crpNumber} onChange={(e) => setCrpNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000" inputMode="numeric" onKeyDown={(e) => e.key === "Enter" && confirmCrp()}
                      style={{ flex: 1, minWidth: 0, border: "none", padding: "11px 15px 11px 4px", fontSize: 14, fontFamily: "Inter", background: "transparent" }} />
                  </div>
                  <button onClick={confirmCrp} disabled={!crpNumber.trim()} aria-label="Continuar"
                    style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: "none",
                      background: crpNumber.trim() ? C.dark : "#D9D5CA", color: "#fff",
                      cursor: crpNumber.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowRight size={17} />
                  </button>
                </div>
                <button onClick={confirmNoCrp}
                  style={{ width: "100%", padding: "10px", borderRadius: 999, border: `1px dashed ${C.line}`, background: "transparent", color: C.sub, fontWeight: 500, fontSize: 12.5, cursor: "pointer" }}>
                  Ainda não tenho registro (estou em formação)
                </button>
              </div>
            )}
            {!typing && activeType === "image" && (
              <div>
                <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleImageFile} />
                {imageDraft ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <img src={imageDraft} alt="" style={{ width: 54, height: 54, borderRadius: 12, objectFit: "cover", border: `1px solid ${C.line}` }} />
                    <button onClick={() => confirmImage(imageDraft)}
                      style={{ flex: 1, padding: "12px", borderRadius: 999, border: "none", background: C.dark, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                      <Check size={16} /> {(editingFlowStep || step)?.key === "logo" ? "Usar esta logo" : "Usar esta foto"}
                    </button>
                    <button onClick={() => setImageDraft("")} aria-label="Trocar"
                      style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 10 }}>
                      <button onClick={() => fileRef.current?.click()}
                        style={{ flex: 1, padding: "12px", borderRadius: 999, border: `1px solid ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <ImageIcon size={16} /> {(editingFlowStep || step)?.key === "logo" ? "Escolher logo" : "Escolher foto"}
                      </button>
                      <button onClick={() => confirmImage("")}
                        style={{ flexShrink: 0, padding: "0 18px", height: 44, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
                        Pular
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ou cole o link de uma imagem"
                        onKeyDown={(e) => e.key === "Enter" && imageUrl.trim() && setImageDraft(imageUrl.trim())}
                        style={{ flex: 1, minWidth: 0, padding: "11px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14, fontFamily: "Inter" }} />
                      <button onClick={() => imageUrl.trim() && setImageDraft(imageUrl.trim())} aria-label="Usar link"
                        style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!typing && activeType === "cards" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, maxHeight: 168, overflowY: "auto" }}>
                  {cardOpts.map((o) => {
                    const on = cardSel.includes(o);
                    return (
                      <button key={o} onClick={() => toggleCard(o)}
                        style={{ display: "inline-flex", alignItems: "center", padding: "9px 14px", borderRadius: 999, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
                          border: `1px solid ${on ? C.sage : C.line}`,
                          background: on ? C.sage : "#fff",
                          color: on ? "#fff" : C.ink, transition: "all .15s" }}>
                        {o}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
                  <input value={cardCustom} onChange={(e) => setCardCustom(e.target.value)} placeholder="Adicionar outro tema..."
                    onKeyDown={(e) => e.key === "Enter" && addCustomCard()}
                    style={{ flex: 1, minWidth: 120, padding: "11px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14, fontFamily: "Inter" }} />
                  <button onClick={addCustomCard} disabled={!cardCustom.trim()} aria-label="Adicionar tema personalizado à lista" title="Adicionar tema personalizado à lista"
                    style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, cursor: cardCustom.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${cardCustom.trim() ? C.sage : C.line}`, background: cardCustom.trim() ? C.sageSoft : "#fff", color: cardCustom.trim() ? C.sage : "#C9C4B7" }}>
                    <Plus size={17} />
                  </button>
                  <button onClick={confirmCards} disabled={!cardSel.length}
                    style={{ flex: "1 0 auto", minWidth: 150, padding: "0 18px", height: 42, borderRadius: 999, border: "none", cursor: cardSel.length ? "pointer" : "default",
                      background: cardSel.length ? C.dark : "#D9D5CA", color: "#fff", fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    Continuar {cardSel.length ? `(${cardSel.length})` : ""} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
            {!editingKey && !typing && (step?.type === "text" || step?.allowText) && (
              <div>
                {(() => {
                  const activeStarters = step?.startersByTone?.[answers.tom] || step?.startersByTone?.["Acolhedor"] || step?.starters;
                  return activeStarters && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                    {activeStarters.map((s) => (
                      <button key={s.label} onClick={() => addStarter(s.template)}
                        style={{ padding: "7px 13px", borderRadius: 999, border: `1px dashed ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  );
                })()}
                <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
                  {step?.key === "sobre" ? (
                    <textarea ref={composerRef} value={draft} rows={1}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={step?.ph || "Escreva aqui..."}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(draft); } }}
                      style={{ flex: 1, minWidth: 0, padding: "12px 15px", borderRadius: 18, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14.5, fontFamily: "Inter", resize: "none", maxHeight: 220, overflowY: "auto", lineHeight: 1.5 }} />
                  ) : (
                    <input ref={composerRef} value={draft}
                      onChange={(e) => setDraft(step?.key === "whatsapp" ? formatPhoneBR(e.target.value) : e.target.value)}
                      placeholder={step?.ph || "Escreva aqui..."}
                      inputMode={step?.key === "whatsapp" ? "numeric" : undefined}
                      onKeyDown={(e) => e.key === "Enter" && submit(draft)}
                      style={{ flex: 1, minWidth: 0, padding: "12px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14.5, fontFamily: "Inter" }} />
                  )}
                  <button onClick={() => submit(draft)} aria-label="Enviar"
                    style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: "none", background: C.dark, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  /* ---- GENERATING ---- */
  if (phase === "generating") {
    return (
      <Shell>
        <div className="fade" style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Loader2 size={26} color={C.acid} className="spin" />
          </div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "0 0 10px" }}>
            Escrevendo seu site, {firstName(lead.name)}.
          </h2>
          <p style={{ color: C.sub, fontSize: 15, transition: "opacity .3s" }}>{GEN_STATUS[genLine]}</p>
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
        .prev::-webkit-scrollbar{width:8px;} .prev::-webkit-scrollbar-thumb{background:#D8D3C6;border-radius:9px;}

        /* --- grids do preview do site: colapsam em telas estreitas --- */
        .hero-grid { display:grid; grid-template-columns: 1.1fr .9fr; }
        .sobre-grid { display:grid; grid-template-columns: 1fr 1fr; }
        .spec-grid { display:grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) {
          .hero-grid, .sobre-grid, .spec-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child, .sobre-grid > div:last-child { max-width: 220px; margin: 20px auto 0; }
          .site-nav { display: none !important; }
        }
        @media (max-width: 480px) {
          .site-done-wrap { padding: 12px !important; }
          .site-actions-row button { flex: 1; }
        }
      `}</style>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
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
          <div className="site-actions-row" style={{ display: "flex", gap: 10, width: "100%", maxWidth: 320 }}>
            <button onClick={restartQuiz}
              style={{ padding: "11px 18px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 600, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>
              Recomeçar
            </button>
            <button onClick={publishSite} disabled={publishing}
              style={{ padding: "11px 20px", borderRadius: 999, border: "none", background: C.dark, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: publishing ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap" }}>
              <Check size={16} /> {publishing ? "Publicando..." : siteStatus === "published" ? "Atualizar site" : "Publicar site"}
            </button>
          </div>
        </div>
        <div className="fade" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 500 }}>Tema:</span>
          {Object.entries(THEMES).map(([key, label]) => (
            <button key={key} onClick={() => changeTheme(key)}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${(site?.theme || "classic") === key ? C.dark : C.line}`,
                background: (site?.theme || "classic") === key ? C.dark : "#fff",
                color: (site?.theme || "classic") === key ? "#fff" : C.ink,
              }}>
              {label}
            </button>
          ))}
        </div>
        {showPlanPicker && (
          <div className="fade" style={{ marginBottom: 16, padding: 18, borderRadius: 14, background: C.sageSoft, border: `1px solid ${C.line}` }}>
            <p style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 600 }}>Escolha um plano pra publicar</p>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: C.sub }}>Sua página fica no ar enquanto a assinatura estiver ativa.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => startCheckout("monthly")} disabled={checkingOut}
                style={{ flex: "1 1 180px", padding: "14px 16px", borderRadius: 12, border: `1px solid ${C.line}`, background: "#fff", cursor: checkingOut ? "default" : "pointer", textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Mensal</div>
                <div style={{ fontSize: 13, color: C.sub }}>R$ 49,90/mês</div>
              </button>
              <button onClick={() => startCheckout("yearly")} disabled={checkingOut}
                style={{ flex: "1 1 180px", padding: "14px 16px", borderRadius: 12, border: `2px solid ${C.sage}`, background: "#fff", cursor: checkingOut ? "default" : "pointer", textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.sage }}>Anual</div>
                <div style={{ fontSize: 13, color: C.sub }}>R$ 29,90/mês — cobrado R$ 358,80/ano</div>
              </button>
            </div>
            {checkingOut && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: C.sub }}>Abrindo o checkout...</p>}
          </div>
        )}
        {authError && (
          <div className="fade" style={{ marginBottom: 12, fontSize: 13, color: "#B3453A" }}>{authError}</div>
        )}
        {publishedUrl && (
          <div className="fade" style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: C.sageSoft, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: C.sage, fontWeight: 600 }}>No ar:</span>
            <a href={publishedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{publishedUrl}</a>
            <button onClick={() => navigator.clipboard?.writeText(publishedUrl)}
              style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              Copiar link
            </button>
          </div>
        )}
        <div className="prev fade" style={{ borderRadius: 18, border: `1px solid ${C.line}`, overflow: "auto", maxHeight: "calc(100vh - 120px)", background: "#fff", boxShadow: "0 24px 60px -36px rgba(0,0,0,.3)" }}>
          <ThemedSite d={site} />
        </div>
      </div>
    </div>
  );
}
