import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Check,
  MessageCircle, Instagram, Mail, Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Avence Psi — Quiz → Site builder (prototype)                       */
/*  Cada passo do quiz preenche uma seção do site, que se monta ao      */
/*  vivo no painel da direita. Funil de canal único: WhatsApp.          */
/* ------------------------------------------------------------------ */

const C = {
  paper: "#F6F4EF",
  panel: "#FBFAF7",
  ink: "#17160F",
  sub: "#6F6A5E",
  line: "#E5E1D6",
  sage: "#46614D",
  sageSoft: "#EAEFE9",
  acid: "#B5EF00", // assinatura Avence, uso mínimo
  dark: "#14140F",
};

/* ---------------------------- defaults ---------------------------- */
const DEFAULTS = {
  name: "Dra. Marina Costa",
  title: "Psicóloga Clínica • TCC",
  crp: "CRP 07/00000",
  photo: "",
  badge: "Atendimento 100% Online",
  headline: "Equilíbrio emocional através da terapia.",
  subheadline:
    "Psicoterapia baseada em evidências, no seu ritmo. Foco em ansiedade, autoconhecimento e relações.",
  approach: "TCC",
  specialties: [
    { t: "Ansiedade", d: "Recupere o equilíbrio emocional e viva com mais tranquilidade e presença." },
    { t: "Depressão", d: "Estratégias para superar o sofrimento e resgatar a autoestima e o sentido de vida." },
    { t: "Autoconhecimento", d: "Um espaço seguro para se compreender, crescer e tomar decisões com clareza." },
    { t: "Relacionamentos", d: "Fortaleça vínculos com comunicação mais assertiva e empática." },
    { t: "Burnout", d: "Reconheça os sinais do esgotamento e construa uma rotina mais equilibrada." },
    { t: "Autoestima", d: "Reconstrua uma relação mais gentil e confiante consigo mesmo." },
  ],
  benefits: [
    { t: "Economia", d: "Sem gastos com deslocamento ou tempo perdido no trânsito." },
    { t: "Conforto", d: "Sessões no ambiente onde você se sente mais seguro." },
    { t: "Acessibilidade", d: "Atendimento para todo o Brasil — onde você estiver." },
    { t: "Privacidade", d: "Plataforma de vídeo criptografada e segura." },
  ],
  aviso: "Atendimento particular. Recibo emitido para reembolso.",
  methodTitle: "O que é a TCC?",
  methodText:
    "A Terapia Cognitivo-Comportamental trabalha a relação entre pensamentos, emoções e comportamentos — uma abordagem baseada em evidências e reconhecida internacionalmente.\n\nÉ colaborativa: terapeuta e paciente trabalham juntos para identificar padrões que geram sofrimento e desenvolver recursos mais saudáveis, favorecendo autonomia e equilíbrio.",
  bio:
    "Sou psicóloga clínica e busco proporcionar um ambiente acolhedor e seguro, onde você possa se expressar livremente, favorecendo o autoconhecimento e o desenvolvimento pessoal.",
  faq: [
    { q: "Como funciona o atendimento?", a: "As sessões são semanais, com duração de 50 minutos, por videochamada." },
    { q: "Atende online?", a: "Sim, atendo exclusivamente online para todo o Brasil." },
    { q: "Aceita convênio?", a: "O atendimento é particular. Emito recibo para reembolso." },
    { q: "Menor de idade pode agendar?", a: "Sim, mediante consentimento e acompanhamento dos responsáveis." },
  ],
  whatsapp: "5551999999999",
  waMessage: "Olá! Tenho interesse em agendar uma consulta!",
  instagram: "@seuperfil",
  email: "contato@seudominio.com.br",
};

/* ----------------------------- steps ------------------------------ */
/* type: text | textarea | photo | list | benefits | faq | contact   */
const STEPS = [
  {
    section: "footer",
    eyebrow: "Identidade",
    q: "Como você se apresenta?",
    help: "Seu nome vira o logo, e o registro aparece no rodapé e no cabeçalho.",
    fields: [
      { key: "name", label: "Nome", ph: "Dra. Marina Costa" },
      { key: "title", label: "Título / abordagem", ph: "Psicóloga Clínica • TCC" },
      { key: "crp", label: "Registro", ph: "CRP 07/00000" },
    ],
  },
  {
    section: "hero",
    eyebrow: "Topo do site",
    q: "Qual a primeira frase que a pessoa lê?",
    help: "O selo é a modalidade. A headline precisa ser curta e emocional — a promessa central.",
    fields: [
      { key: "badge", label: "Selo de modalidade", ph: "Atendimento 100% Online" },
      { key: "headline", label: "Headline", ph: "Equilíbrio emocional através da terapia." },
    ],
  },
  {
    section: "hero",
    eyebrow: "Topo do site",
    q: "Explique em uma frase para quem você atende.",
    help: "Abordagem + os temas em que você tem foco. É o que qualifica o visitante certo.",
    fields: [{ key: "subheadline", label: "Subtítulo", type: "textarea", ph: "Foco em..." }],
  },
  {
    section: "hero",
    eyebrow: "Topo do site",
    q: "Sua foto profissional.",
    help: "Cole o link de uma imagem. Sem foto, mantemos um espaço elegante com suas iniciais.",
    fields: [{ key: "photo", type: "photo", label: "URL da foto", ph: "https://..." }],
  },
  {
    section: "especialidades",
    eyebrow: "Especialidades",
    q: "Quais temas você atende?",
    help: "Cada card é uma dor + o resultado que a terapia traz. 4 a 6 funciona melhor.",
    fields: [{ key: "specialties", type: "list", label: "Especialidades" }],
  },
  {
    section: "online",
    eyebrow: "Diferenciais",
    q: "Por que escolher o seu atendimento?",
    help: "Os 4 pilares que reduzem objeção. Ajuste os títulos e descrições.",
    fields: [
      { key: "benefits", type: "benefits", label: "Benefícios" },
      { key: "aviso", label: "Aviso de condições", ph: "Atendimento particular..." },
    ],
  },
  {
    section: "metodologia",
    eyebrow: "Metodologia",
    q: "Explique sua abordagem.",
    help: "Constrói autoridade técnica. O título usa o nome da sua abordagem.",
    fields: [
      { key: "methodTitle", label: "Título", ph: "O que é a TCC?" },
      { key: "methodText", label: "Texto", type: "textarea", ph: "Descreva..." },
    ],
  },
  {
    section: "sobre",
    eyebrow: "Sobre",
    q: "Quem é você?",
    help: "Fale de formação e da experiência que você quer proporcionar. Tom humano.",
    fields: [{ key: "bio", label: "Bio", type: "textarea", ph: "Sou psicóloga..." }],
  },
  {
    section: "faq",
    eyebrow: "Dúvidas",
    q: "Quais dúvidas você quebra antes da consulta?",
    help: "As objeções mais comuns. Menos atrito = mais agendamento.",
    fields: [{ key: "faq", type: "faq", label: "Perguntas frequentes" }],
  },
  {
    section: "contato",
    eyebrow: "Conversão",
    q: "Para onde vai o botão principal?",
    help: "Todo CTA leva ao WhatsApp com essa mensagem já escrita. É o coração do funil.",
    fields: [
      { key: "whatsapp", label: "WhatsApp (só números, com DDI)", ph: "5551999999999" },
      { key: "waMessage", label: "Mensagem pré-preenchida", type: "textarea", ph: "Olá! Tenho interesse..." },
    ],
  },
  {
    section: "footer",
    eyebrow: "Contato",
    q: "Onde mais te encontram?",
    help: "Aparece no formulário e no rodapé.",
    fields: [
      { key: "instagram", label: "Instagram", ph: "@seuperfil" },
      { key: "email", label: "E-mail", ph: "contato@..." },
    ],
  },
];

/* --------------------------- utilities ---------------------------- */
const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
const initials = (n) =>
  (n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* =========================== SITE PREVIEW ========================== */
function SitePreview({ d, active, refs }) {
  const wa = waLink(d.whatsapp, d.waMessage);
  const Section = ({ id, children, style }) => (
    <section
      ref={(el) => (refs.current[id] = el)}
      style={{
        position: "relative",
        transition: "box-shadow .4s, outline-color .4s",
        outline: "2px solid transparent",
        outlineColor: active === id ? C.acid : "transparent",
        outlineOffset: -2,
        borderRadius: active === id ? 10 : 0,
        ...style,
      }}
    >
      {children}
    </section>
  );

  const Btn = ({ children, primary }) => (
    <a
      href={wa}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "12px 20px", borderRadius: 999, fontSize: 13, fontWeight: 600,
        textDecoration: "none", letterSpacing: ".01em",
        background: primary ? C.sage : "transparent",
        color: primary ? "#fff" : C.ink,
        border: primary ? "none" : `1px solid ${C.line}`,
      }}
    >
      {children}
    </a>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: C.ink, background: "#fff", fontSize: 14, lineHeight: 1.55 }}>
      {/* HEADER */}
      <Section id="header" style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px" }}>
          <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>{d.name || "Seu nome"}</span>
          <nav style={{ display: "flex", gap: 18, fontSize: 12, color: C.sub }}>
            <span>Especialidades</span><span>Metodologia</span><span>Sobre</span><span>Dúvidas</span>
          </nav>
          <Btn primary><MessageCircle size={14} /> Agendar</Btn>
        </div>
      </Section>

      {/* HERO */}
      <Section id="hero" style={{ padding: "48px 22px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 28, alignItems: "center" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: C.sage, background: C.sageSoft, padding: "5px 11px", borderRadius: 999, letterSpacing: ".02em" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: C.sage }} />{d.badge}
            </span>
            <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, lineHeight: 1.08, margin: "16px 0 12px", letterSpacing: "-.01em" }}>{d.headline}</h1>
            <p style={{ color: C.sub, maxWidth: 380, margin: "0 0 22px" }}>{d.subheadline}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn primary>Iniciar jornada <ArrowRight size={14} /></Btn>
              <Btn>Saiba mais</Btn>
            </div>
          </div>
          <div style={{ aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: `linear-gradient(160deg, ${C.sageSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {d.photo
              ? <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: "Fraunces, serif", fontSize: 48, color: C.sage, opacity: .6 }}>{initials(d.name)}</span>}
          </div>
        </div>
      </Section>

      {/* ESPECIALIDADES */}
      <Section id="especialidades" style={{ padding: "40px 22px", background: C.panel }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, margin: 0 }}>Foco em resultados</p>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 24px" }}>Especialidades clínicas</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {d.specialties.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 16px 18px" }}>
              <span style={{ fontFamily: "Fraunces, serif", fontSize: 13, color: C.sage }}>{String(i + 1).padStart(2, "0")}</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "6px 0 6px" }}>{s.t}</h3>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ONLINE / DIFERENCIAIS */}
      <Section id="online" style={{ padding: "40px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: ".8fr 1.2fr", gap: 26, alignItems: "center" }}>
          <div style={{ aspectRatio: "1/1", borderRadius: 16, background: `linear-gradient(160deg, #E8E4DA, ${C.sageSoft})` }} />
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 16px" }}>Por que esse atendimento?</h2>
            {d.benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 11 }}>
                <span style={{ marginTop: 3, flexShrink: 0, width: 18, height: 18, borderRadius: 99, background: C.sageSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={11} color={C.sage} />
                </span>
                <p style={{ margin: 0, fontSize: 13 }}><b>{b.t}:</b> <span style={{ color: C.sub }}>{b.d}</span></p>
              </div>
            ))}
            {d.aviso && <p style={{ marginTop: 16, fontSize: 12, color: C.sub, fontStyle: "italic" }}>{d.aviso}</p>}
          </div>
        </div>
      </Section>

      {/* METODOLOGIA */}
      <Section id="metodologia" style={{ padding: "40px 22px", background: C.dark, color: "#EDEBE3" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.acid, margin: 0 }}>Abordagem</p>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, margin: "8px 0 16px" }}>{d.methodTitle}</h2>
        {d.methodText.split("\n\n").map((p, i) => (
          <p key={i} style={{ maxWidth: 560, color: "#C7C4BA", margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.6 }}>{p}</p>
        ))}
      </Section>

      {/* SOBRE */}
      <Section id="sobre" style={{ padding: "40px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, margin: 0 }}>Quem sou eu</p>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "8px 0 14px" }}>Uma escuta clínica e humana.</h2>
            <p style={{ color: C.sub, fontSize: 13.5, marginBottom: 18 }}>{d.bio}</p>
            <Btn primary><MessageCircle size={14} /> Agende uma consulta</Btn>
          </div>
          <div style={{ aspectRatio: "4/5", borderRadius: 16, background: `linear-gradient(160deg, ${C.sageSoft}, #E8E4DA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {d.photo
              ? <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: "Fraunces, serif", fontSize: 40, color: C.sage, opacity: .5 }}>{initials(d.name)}</span>}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" style={{ padding: "40px 22px", background: C.panel }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, margin: "0 0 18px" }}>Perguntas frequentes</h2>
        {d.faq.map((f, i) => (
          <details key={i} style={{ borderTop: `1px solid ${C.line}`, padding: "13px 0" }} open={i === 0}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14, listStyle: "none" }}>{f.q}</summary>
            <p style={{ margin: "8px 0 0", color: C.sub, fontSize: 13 }}>{f.a}</p>
          </details>
        ))}
      </Section>

      {/* CONTATO */}
      <Section id="contato" style={{ padding: "40px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.sage, margin: 0 }}>Fale comigo</p>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, margin: "8px 0 14px" }}>Envie uma mensagem</h2>
            {["Nome", "E-mail", "Mensagem"].map((l) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>{l}</div>
                <div style={{ height: l === "Mensagem" ? 52 : 32, border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel }} />
              </div>
            ))}
          </div>
          <div style={{ background: C.dark, borderRadius: 16, padding: 26, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>Vamos dar o primeiro passo?</h3>
            <p style={{ color: "#B7B4AA", fontSize: 13, margin: "0 0 18px" }}>Agende uma conversa inicial agora mesmo.</p>
            <a href={wa} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", padding: "12px 20px", borderRadius: 999, background: C.acid, color: C.ink, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              <MessageCircle size={15} /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <Section id="footer" style={{ padding: "28px 22px", borderTop: `1px solid ${C.line}`, background: C.panel }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{d.title}<br />{d.crp} · Atendimento online para todo o Brasil.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.sub }}><Instagram size={14} />{d.instagram}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.sub }}><Mail size={14} />{d.email}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ============================ INPUTS ============================== */
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.line}`,
  background: "#fff", fontSize: 15, color: C.ink, outline: "none", fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
};
const Label = ({ children }) => (
  <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>{children}</div>
);

function ListEditor({ items, onChange, withDesc, labels }) {
  const set = (i, k, v) => onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const add = () => onChange([...items, withDesc ? { t: "", d: "" } : { q: "", a: "" }]);
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  const [kt, kd] = withDesc ? ["t", "d"] : ["q", "a"];
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input value={it[kt]} onChange={(e) => set(i, kt, e.target.value)} placeholder={labels[0]}
              style={{ ...inputStyle, fontWeight: 600 }} />
            <button onClick={() => del(i)} aria-label="Remover"
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub }}>
              <Trash2 size={15} />
            </button>
          </div>
          <textarea value={it[kd]} onChange={(e) => set(i, kd, e.target.value)} placeholder={labels[1]} rows={2}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      ))}
      <button onClick={add}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 999, border: `1px dashed ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        <Plus size={15} /> Adicionar
      </button>
    </div>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [d, setD] = useState(DEFAULTS);
  const refs = useRef({});
  const total = STEPS.length;
  const cur = STEPS[step];
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const el = refs.current[cur?.section];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, cur]);

  const next = () => (step < total - 1 ? setStep(step + 1) : setDone(true));
  const back = () => (done ? setDone(false) : setStep(Math.max(0, step - 1)));

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        details summary::-webkit-details-marker { display:none; }
        input:focus, textarea:focus { border-color:${C.sage} !important; }
        .fade { animation: fade .45s ease both; }
        @keyframes fade { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:none;} }
        .prev::-webkit-scrollbar { width:7px; } .prev::-webkit-scrollbar-thumb { background:#D8D3C6; border-radius:9px; }
        @media (max-width: 900px){ .grid { grid-template-columns:1fr !important; } .prev { max-height:380px !important; } }
      `}</style>

      <div className="grid" style={{ display: "grid", gridTemplateColumns: "minmax(360px, 460px) 1fr", minHeight: "100vh" }}>
        {/* ---------------- LEFT: QUIZ ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", padding: "28px 34px", borderRight: `1px solid ${C.line}` }}>
          {/* brand + progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: C.acid }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-.01em" }}>Avence <span style={{ color: C.sage }}>Psi</span></span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: C.sub }}>
              {done ? "Pronto" : `${step + 1} / ${total}`}
            </span>
          </div>
          <div style={{ height: 3, background: C.line, borderRadius: 9, marginBottom: 34, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${done ? 100 : ((step + 1) / total) * 100}%`, background: C.acid, borderRadius: 9, transition: "width .45s" }} />
          </div>

          {done ? (
            <div className="fade" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.sageSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <Sparkles size={22} color={C.sage} />
              </div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.15 }}>
                Seu site está montado.
              </h2>
              <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
                Tudo o que você respondeu já virou um funil completo — do topo ao WhatsApp. O próximo passo é publicar em <b>{d.name.split(" ").slice(-1)[0].toLowerCase()}.com.br</b>.
              </p>
              <a href={waLink(d.whatsapp, d.waMessage)} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 9, alignSelf: "flex-start", padding: "13px 22px", borderRadius: 999, background: C.dark, color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
                Testar o botão do funil <ArrowRight size={16} />
              </a>
              <button onClick={back} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.sub, fontSize: 13, cursor: "pointer", padding: 0 }}>
                ← Voltar e editar
              </button>
            </div>
          ) : (
            <div key={step} className="fade" style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sage, margin: "0 0 12px" }}>{cur.eyebrow}</p>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 25, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.18, letterSpacing: "-.01em" }}>{cur.q}</h2>
              <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.55, margin: "0 0 26px" }}>{cur.help}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {cur.fields.map((f) => {
                  if (f.type === "list")
                    return <div key={f.key}><ListEditor items={d.specialties} onChange={(v) => set("specialties", v)} withDesc labels={["Tema (ex: Ansiedade)", "O que a terapia traz"]} /></div>;
                  if (f.type === "benefits")
                    return <div key={f.key}><ListEditor items={d.benefits} onChange={(v) => set("benefits", v)} withDesc labels={["Benefício", "Descrição"]} /></div>;
                  if (f.type === "faq")
                    return <div key={f.key}><ListEditor items={d.faq} onChange={(v) => set("faq", v)} labels={["Pergunta", "Resposta"]} /></div>;
                  if (f.type === "textarea")
                    return (
                      <div key={f.key}>
                        <Label>{f.label}</Label>
                        <textarea value={d[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.ph} rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
                      </div>
                    );
                  if (f.type === "photo")
                    return (
                      <div key={f.key}>
                        <Label>{f.label}</Label>
                        <input value={d[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.ph} style={inputStyle} />
                        <p style={{ fontSize: 12, color: C.sub, margin: "8px 0 0" }}>Sem link? Mantemos suas iniciais num bloco elegante.</p>
                      </div>
                    );
                  return (
                    <div key={f.key}>
                      <Label>{f.label}</Label>
                      <input value={d[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.ph} style={inputStyle} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* nav */}
          {!done && (
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={back} disabled={step === 0}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 18px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: step === 0 ? "#C9C4B7" : C.ink, fontWeight: 600, fontSize: 14, cursor: step === 0 ? "default" : "pointer" }}>
                <ArrowLeft size={16} /> Voltar
              </button>
              <button onClick={next}
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 18px", borderRadius: 999, border: "none", background: C.dark, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {step === total - 1 ? "Ver site pronto" : "Continuar"} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ---------------- RIGHT: LIVE PREVIEW ---------------- */}
        <div style={{ padding: 22, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: C.sub, fontSize: 12 }}>
            <span style={{ display: "flex", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: "#E4B9A8" }} />
              <span style={{ width: 9, height: 9, borderRadius: 99, background: "#EAD9A0" }} />
              <span style={{ width: 9, height: 9, borderRadius: 99, background: "#B7D4B0" }} />
            </span>
            <span style={{ marginLeft: 6 }}>{(d.name.split(" ").slice(-1)[0] || "seusite").toLowerCase()}.com.br</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.sage, fontWeight: 600 }}>● pré-visualização ao vivo</span>
          </div>
          <div className="prev" style={{ flex: 1, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "auto", background: "#fff", boxShadow: "0 18px 50px -30px rgba(0,0,0,.25)", maxHeight: "calc(100vh - 90px)" }}>
            <SitePreview d={d} active={done ? null : cur.section} refs={refs} />
          </div>
        </div>
      </div>
    </div>
  );
}
