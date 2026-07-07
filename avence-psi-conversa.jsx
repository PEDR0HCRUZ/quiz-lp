import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Send, MessageCircle, Instagram, Mail, Check,
  Sparkles, Loader2, Pencil, X, Plus, Image as ImageIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Avence Psi — v2: onboarding conversacional + IA + captura de lead   */
/*  1) welcome (nome/email)  2) conversa suave  3) IA escreve a copy     */
/*  4) site pronto. Funil de canal único: WhatsApp.                      */
/* ------------------------------------------------------------------ */

const C = {
  paper: "#F3F1EA", panel: "#FBFAF7", ink: "#17160F", sub: "#6F6A5E",
  line: "#E5E1D6", sage: "#46614D", sageSoft: "#EAEFE9",
  acid: "#B5EF00", dark: "#14140F", bubbleUser: "#14140F",
};

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
  { key: "abordagem", bot: "Qual é a sua abordagem principal?", type: "chips", options: ["TCC", "Psicanálise", "Humanista", "Gestalt"], allowText: true, ph: "Outra..." },
  { key: "temas", bot: "Quais temas você mais atende? Selecione quantos quiser — e adicione os seus no campo abaixo.", type: "cards",
    options: ["Ansiedade", "Depressão", "Autoestima", "Autoconhecimento", "Relacionamentos", "Luto", "Estresse / Burnout", "Traumas", "Síndrome do pânico", "TOC", "Fobias", "Maternidade / Parentalidade"] },
  { key: "tom", bot: "Que tom combina mais com você?", type: "chips", options: ["Acolhedor", "Leve e próximo", "Direto", "Técnico"] },
  { key: "sobre", bot: "Me conta em poucas frases o que te move como profissional. Se quiser, use um dos começos abaixo — eu deixo bonito depois.", ph: "escreva do seu jeito...", type: "text",
    starters: ["Acredito que", "O mundo pode ser melhor através da", "Meu propósito é", "Escolhi essa profissão porque"] },
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

/* -------------------------- AI copywriter ------------------------- */
async function generateCopy(input) {
  const sys =
    "Você é redator sênior de UX para landing pages de psicólogos no Brasil. " +
    "A partir de informações estratégicas esparsas, escreve copy calorosa, ética e em português do Brasil. " +
    "REGRAS DO CFP (obrigatórias): nunca prometa cura ou resultado garantido, nada de sensacionalismo, " +
    "sem superlativos vazios, sem termos que gerem falsas expectativas. Tom humano e sóbrio. " +
    "Responda SOMENTE com JSON válido, sem markdown, sem comentários.";
  const user =
    `Dados do profissional:\n` +
    `- Nome: ${input.name}\n- Título/registro: ${input.title}\n- Modalidade: ${input.modalidade}\n` +
    `- Abordagem: ${input.abordagem}\n- Temas atendidos: ${input.temas}\n- Tom desejado: ${input.tom}\n` +
    `- Sobre (rascunho cru): ${input.sobre}\n\n` +
    `Gere o JSON com EXATAMENTE estas chaves (seja conciso):\n` +
    `{"badge": "selo curto de modalidade","headline":"frase curta e emocional, máx 7 palavras",` +
    `"subheadline":"1 frase de posicionamento",` +
    `"specialties":[{"t":"use EXATAMENTE cada tema desta lista, na mesma ordem, sem renomear","d":"1 frase de dor+resultado no tom ${input.tom}"}] — a lista de temas é: ${input.temas},` +
    `"benefits":[{"t":"palavra","d":"1 frase"} (4 itens)],"aviso":"condições (particular/reembolso)",` +
    `"methodTitle":"O que é a ${input.abordagem}?","methodText":"2 parágrafos separados por \\n\\n",` +
    `"bio":"reescreva o rascunho cru em 2-3 frases elegantes na 1a pessoa","faq":[{"q":"pergunta","a":"resposta"} (4 itens)]}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text").map((b) => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{"), end = clean.lastIndexOf("}");
    const parsed = JSON.parse(clean.slice(start, end + 1));
    return { ...DEFAULTS, ...parsed };
  } catch (e) {
    // Fallback resiliente: usa template + o que foi captado
    return {
      ...DEFAULTS,
      badge: input.modalidade === "Presencial" ? "Atendimento presencial" : "Atendimento 100% Online",
      methodTitle: `Sobre a ${input.abordagem}`,
      bio: input.sobre || DEFAULTS.bio,
    };
  }
}

/* =========================== SITE PREVIEW ========================== */
function SitePreview({ d }) {
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);
  const Btn = ({ children, primary }) => (
    <a href={wa} target="_blank" rel="noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 19px", borderRadius: 999,
      fontSize: 13, fontWeight: 600, textDecoration: "none",
      background: primary ? C.sage : "transparent", color: primary ? "#fff" : C.ink,
      border: primary ? "none" : `1px solid ${C.line}`,
    }}>{children}</a>
  );
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: C.ink, background: "#fff", fontSize: 14, lineHeight: 1.55 }}>
      {/* header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px" }}>
        <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>{d.name}</span>
        <nav className="site-nav" style={{ display: "flex", gap: 16, fontSize: 12, color: C.sub }}><span>Especialidades</span><span>Método</span><span>Sobre</span><span>Dúvidas</span></nav>
        <Btn primary><MessageCircle size={14} /> Agendar</Btn>
      </div>
      {/* hero */}
      <div className="hero-grid" style={{ padding: "46px 22px 40px", gap: 28, alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: C.sage, background: C.sageSoft, padding: "5px 11px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: C.sage }} />{d.badge}
          </span>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, lineHeight: 1.08, margin: "16px 0 12px", letterSpacing: "-.01em" }}>{d.headline}</h1>
          <p style={{ color: C.sub, maxWidth: 380, margin: "0 0 22px" }}>{d.subheadline}</p>
          <div style={{ display: "flex", gap: 10 }}><Btn primary>Iniciar jornada <ArrowRight size={14} /></Btn><Btn>Saiba mais</Btn></div>
        </div>
        <div style={{ aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: `linear-gradient(160deg, ${C.sageSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {d.photo
            ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontFamily: "Fraunces, serif", fontSize: 46, color: C.sage, opacity: .55 }}>{initials(d.name)}</span>}
        </div>
      </div>
      {/* especialidades */}
      <div style={{ padding: "40px 22px", background: C.panel }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, margin: 0 }}>Foco em resultados</p>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 22px" }}>Especialidades clínicas</h2>
        <div className="spec-grid" style={{ gap: 14 }}>
          {d.specialties.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px" }}>
              <span style={{ fontFamily: "Fraunces, serif", fontSize: 13, color: C.sage }}>{String(i + 1).padStart(2, "0")}</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "6px 0" }}>{s.t}</h3>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
      {/* metodologia */}
      <div style={{ padding: "40px 22px", background: C.dark, color: "#EDEBE3" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.acid, margin: 0 }}>Abordagem</p>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 16px" }}>{d.methodTitle}</h2>
        {d.methodText.split("\n\n").map((p, i) => (
          <p key={i} style={{ maxWidth: 560, color: "#C7C4BA", margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>{p}</p>
        ))}
      </div>
      {/* sobre */}
      <div className="sobre-grid" style={{ padding: "40px 22px", gap: 26, alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, margin: 0 }}>Quem sou eu</p>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "8px 0 14px" }}>Uma escuta clínica e humana.</h2>
          <p style={{ color: C.sub, fontSize: 13.5, marginBottom: 18 }}>{d.bio}</p>
          <Btn primary><MessageCircle size={14} /> Agende uma consulta</Btn>
        </div>
        <div style={{ aspectRatio: "4/5", borderRadius: 16, overflow: "hidden", background: `linear-gradient(160deg, ${C.sageSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {d.photo
            ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontFamily: "Fraunces, serif", fontSize: 40, color: C.sage, opacity: .5 }}>{initials(d.name)}</span>}
        </div>
      </div>
      {/* faq */}
      <div style={{ padding: "40px 22px", background: C.panel }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 18px" }}>Perguntas frequentes</h2>
        {d.faq.map((f, i) => (
          <details key={i} style={{ borderTop: `1px solid ${C.line}`, padding: "13px 0" }} open={i === 0}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14, listStyle: "none" }}>{f.q}</summary>
            <p style={{ margin: "8px 0 0", color: C.sub, fontSize: 13 }}>{f.a}</p>
          </details>
        ))}
      </div>
      {/* cta final */}
      <div style={{ padding: "40px 22px" }}>
        <div style={{ background: C.dark, borderRadius: 16, padding: 30, color: "#fff", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>Vamos dar o primeiro passo?</h3>
          <p style={{ color: "#B7B4AA", fontSize: 13, margin: "0 0 18px" }}>Agende uma conversa inicial agora mesmo.</p>
          <a href={wa} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 999, background: C.acid, color: C.ink, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <MessageCircle size={15} /> Falar no WhatsApp
          </a>
        </div>
      </div>
      {/* footer */}
      <div style={{ padding: "26px 22px", borderTop: `1px solid ${C.line}`, background: C.panel, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
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
  );
}

/* --------- Shell e Brand em escopo de módulo (estáveis) ---------- */
/* Definir estes DENTRO do App faz o React remontar tudo a cada tecla, */
/* o que fazia o input perder o foco. Fora do App, a identidade é fixa. */
const Shell = ({ children }) => (
  <div className="shell-outer" style={{ background: C.paper, fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;} details summary::-webkit-details-marker{display:none;}
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
  const [phase, setPhase] = useState("welcome"); // welcome | chat | generating | site
  const [lead, setLead] = useState({ name: "", email: "" });
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
  // seleção de cards (etapa de temas) — multi-seleção
  const [cardSel, setCardSel] = useState([]);
  const [cardOpts, setCardOpts] = useState(CARDS_STEP ? CARDS_STEP.options : []);
  const [cardCustom, setCardCustom] = useState("");
  // foto de perfil
  const [photoDraft, setPhotoDraft] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  // etapas "specialty" e "crp": especialidade e registro, cada uma leve e isolada
  const [specialtySel, setSpecialtySel] = useState("");
  const [specialtyCustom, setSpecialtyCustom] = useState("");
  const [crpPrefix, setCrpPrefix] = useState("07");
  const [crpNumber, setCrpNumber] = useState("");
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const composerRef = useRef(null);

  const step = FLOW[stepIdx];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  // bot fala com "digitando"
  const botSay = (text) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: uid(), role: "bot", text }]);
    }, 700);
  };

  const startChat = () => {
    if (!lead.name.trim() || !/\S+@\S+\.\S+/.test(lead.email)) return;
    setPhase("chat");
    const t = FLOW[0].bot.replace("{first}", firstName(lead.name));
    botSay(t);
  };

  const advance = (merged) => {
    const nextIdx = stepIdx + 1;
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

  // --- especialidade (etapa isolada, leve) ---
  const confirmSpecialty = () => {
    const spec = (specialtyCustom.trim() || specialtySel).trim();
    if (!spec) return;
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
    setMsgs((m) => [...m, { id: uid(), role: "user", text: crp, key: "crp" }]);
    const merged = { ...answers, crp };
    setAnswers(merged);
    setCrpNumber("");
    advance(merged);
  };
  const confirmNoCrp = () => {
    setMsgs((m) => [...m, { id: uid(), role: "user", text: "Ainda não tenho registro (em formação)", key: "crp" }]);
    const merged = { ...answers, crp: "" };
    setAnswers(merged);
    setCrpNumber("");
    advance(merged);
  };

  // --- foto de perfil ---
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhotoDraft(r.result);
    r.readAsDataURL(f);
  };
  const confirmPhoto = (val) => {
    setMsgs((m) => [...m, { id: uid(), role: "user", text: val ? "📷 Foto adicionada" : "Seguir sem foto por enquanto", key: "photo", photo: val || "" }]);
    const merged = { ...answers, photo: val || "" };
    setAnswers(merged);
    setPhotoDraft(""); setPhotoUrl("");
    advance(merged);
  };

  // --- editar uma resposta já enviada ---
  const startEdit = (m) => {
    if (m.role !== "user" || !m.key || typing) return;
    setEditingId(m.id);
    setEditDraft(m.text);
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
    submit(cardSel.join(", "));
    setCardSel([]);
  };

  // --- adicionar início sugerido ao texto ---
  const addStarter = (text) => {
    setDraft((d) => (d.trim() ? d.trimEnd() + " " : "") + text + " ");
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const runGeneration = async (all) => {
    setPhase("generating");
    // título final: especialidade + registro (ou "em formação" se ainda não tiver CRP)
    const title = all.crp ? `${all.specialty} • ${all.crp}` : `${all.specialty} • Em formação`;
    const input = {
      name: lead.name, title, modalidade: all.modalidade,
      abordagem: all.abordagem, temas: all.temas, tom: all.tom, sobre: all.sobre,
    };
    // status rotativo
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % GEN_STATUS.length; setGenLine(i); }, 900);
    const copy = await generateCopy(input);
    clearInterval(iv);

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

    setSite({
      ...copy,
      specialties: finalSpecialties,
      badge,
      methodTitle,
      name: lead.name, email: lead.email, title,
      modalidade: all.modalidade, whatsapp: all.whatsapp, instagram: all.instagram,
      photo: all.photo || "",
      waMessage: `Olá! Vi seu site e tenho interesse em agendar uma consulta.`,
    });
    setPhase("site");
  };

  /* -------- render por fase -------- */
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
              <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder="Dra. Marina Costa"
                style={{ width: "100%", padding: "13px 15px", borderRadius: 11, border: `1px solid ${C.line}`, background: "#fff", fontSize: 15, fontFamily: "Inter" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>Seu melhor e-mail</div>
              <input value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="voce@email.com"
                onKeyDown={(e) => e.key === "Enter" && startChat()}
                style={{ width: "100%", padding: "13px 15px", borderRadius: 11, border: `1px solid ${C.line}`, background: "#fff", fontSize: 15, fontFamily: "Inter" }} />
            </div>
          </div>
          <button onClick={startChat} disabled={!ok}
            style={{ marginTop: 22, width: "100%", padding: "14px", borderRadius: 999, border: "none", cursor: ok ? "pointer" : "default", background: ok ? C.dark : "#D9D5CA", color: "#fff", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .2s" }}>
            Começar a conversa <ArrowRight size={17} />
          </button>
          <p style={{ fontSize: 11.5, color: C.sub, textAlign: "center", margin: "14px 0 0" }}>
            Ao continuar, você entra na lista da Avence Psi. Sem spam.
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
              const editable = m.role === "user" && m.key && m.key !== "photo";
              if (editingId === m.id) {
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", width: "88%", justifyContent: "flex-end" }}>
                      <input autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)}
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
            {!typing && step?.type === "chips" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: step.allowText ? 10 : 0 }}>
                {step.options.map((o) => (
                  <button key={o} onClick={() => submit(o)}
                    style={{ padding: "9px 15px", borderRadius: 999, border: `1px solid ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>{o}</button>
                ))}
              </div>
            )}
            {!typing && step?.type === "specialty" && (
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
            {!typing && step?.type === "crp" && (
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
            {!typing && step?.type === "image" && (
              <div>
                <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
                {photoDraft ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <img src={photoDraft} alt="" style={{ width: 54, height: 54, borderRadius: 12, objectFit: "cover", border: `1px solid ${C.line}` }} />
                    <button onClick={() => confirmPhoto(photoDraft)}
                      style={{ flex: 1, padding: "12px", borderRadius: 999, border: "none", background: C.dark, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                      <Check size={16} /> Usar esta foto
                    </button>
                    <button onClick={() => setPhotoDraft("")} aria-label="Trocar"
                      style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 10 }}>
                      <button onClick={() => fileRef.current?.click()}
                        style={{ flex: 1, padding: "12px", borderRadius: 999, border: `1px solid ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <ImageIcon size={16} /> Escolher foto
                      </button>
                      <button onClick={() => confirmPhoto("")}
                        style={{ flexShrink: 0, padding: "0 18px", height: 44, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
                        Pular
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                      <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="ou cole o link de uma imagem"
                        onKeyDown={(e) => e.key === "Enter" && photoUrl.trim() && setPhotoDraft(photoUrl.trim())}
                        style={{ flex: 1, minWidth: 0, padding: "11px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14, fontFamily: "Inter" }} />
                      <button onClick={() => photoUrl.trim() && setPhotoDraft(photoUrl.trim())} aria-label="Usar link"
                        style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!typing && step?.type === "cards" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, maxHeight: 168, overflowY: "auto" }}>
                  {cardOpts.map((o) => {
                    const on = cardSel.includes(o);
                    return (
                      <button key={o} onClick={() => toggleCard(o)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 999, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
                          border: `1px solid ${on ? C.sage : C.line}`,
                          background: on ? C.sage : "#fff",
                          color: on ? "#fff" : C.ink, transition: "all .15s" }}>
                        {on && <Check size={14} />}{o}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
                  <input value={cardCustom} onChange={(e) => setCardCustom(e.target.value)} placeholder="Adicionar outro tema..."
                    onKeyDown={(e) => e.key === "Enter" && addCustomCard()}
                    style={{ flex: 1, minWidth: 120, padding: "11px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14, fontFamily: "Inter" }} />
                  <button onClick={addCustomCard} aria-label="Adicionar tema"
                    style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.sage}`, background: C.sageSoft, color: C.sage, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            {!typing && (step?.type === "text" || step?.allowText) && (
              <div>
                {step?.starters && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                    {step.starters.map((s) => (
                      <button key={s} onClick={() => addStarter(s)}
                        style={{ padding: "7px 13px", borderRadius: 999, border: `1px dashed ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
                        {s}…
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
                  <input ref={composerRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={step?.ph || "Escreva aqui..."}
                    onKeyDown={(e) => e.key === "Enter" && submit(draft)}
                    style={{ flex: 1, minWidth: 0, padding: "12px 15px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", fontSize: 14.5, fontFamily: "Inter" }} />
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
        *{box-sizing:border-box;} details summary::-webkit-details-marker{display:none;}
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
              <div style={{ fontSize: 13, color: C.sub }}>A IA escreveu tudo a partir das suas respostas. Role para conferir.</div>
            </div>
          </div>
          <div className="site-actions-row" style={{ display: "flex", gap: 10, width: "100%", maxWidth: 320 }}>
            <button onClick={() => { setPhase("welcome"); setMsgs([]); setStepIdx(0); setAnswers({}); setSite(null); }}
              style={{ padding: "11px 18px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 600, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>
              Recomeçar
            </button>
            <button style={{ padding: "11px 20px", borderRadius: 999, border: "none", background: C.dark, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap" }}>
              <Check size={16} /> Publicar site
            </button>
          </div>
        </div>
        <div className="prev fade" style={{ borderRadius: 18, border: `1px solid ${C.line}`, overflow: "auto", maxHeight: "calc(100vh - 120px)", background: "#fff", boxShadow: "0 24px 60px -36px rgba(0,0,0,.3)" }}>
          <SitePreview d={site} />
        </div>
      </div>
    </div>
  );
}
