import { ArrowRight, MessageCircle, Instagram, Mail, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tema "Autoral" — editorial quente, terracota sobre marfim.          */
/*  Segunda opção de tema pro site publicado. Recebe os mesmos dados    */
/*  (d) que o tema clássico (SitePreview em App.jsx) — não altera nada  */
/*  lá, é só uma visualização alternativa do mesmo conteúdo.            */
/* ------------------------------------------------------------------ */

const T = {
  ink: "#211A15",
  paper: "#FBF5EA",
  panel: "#F4ECDD",
  rust: "#B5502D",
  rustDeep: "#8A3A20",
  sand: "#EAD9BE",
  line: "#E2D3B8",
  sub: "#79695A",
};

const CONTAINER_MAX = 1180;
const CONTAINER_PAD = 32;
const READ_MAX = 760;

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600;700&display=swap');";

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")";

export const EDITORIAL_STYLE_TAG = (
  <style>{`
    ${FONT_IMPORT}
    .ed-root *{box-sizing:border-box;}
    .ed-root details summary::-webkit-details-marker{display:none;}
    .ed-serif{font-family:'Instrument Serif', serif;}
    .ed-fade{animation:edFadeUp .8s cubic-bezier(.16,1,.3,1) both;}
    @keyframes edFadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
    .ed-hero-grid{display:grid;grid-template-columns:1.25fr .95fr;gap:56px;align-items:center;}
    .ed-spec-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
    .ed-sobre-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
    .ed-diff-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:44px;align-items:center;}
    @media (max-width: 720px) {
      .ed-hero-grid,.ed-spec-grid,.ed-sobre-grid,.ed-diff-grid{grid-template-columns:1fr !important;}
      .ed-hero-grid{gap:32px;}
      .ed-hero-photo{order:-1; max-width:240px; margin:0 auto;}
      .ed-nav{display:none !important;}
    }
  `}</style>
);

const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
const initials = (n) =>
  (n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const firstName = (n) => (n || "").trim().split(" ")[0] || "";

const wrap = (extra) => ({ maxWidth: CONTAINER_MAX, margin: "0 auto", padding: `0 ${CONTAINER_PAD}px`, ...extra });

function Ornament({ color = T.rust }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}>
      <span style={{ width: 22, height: 1, background: color }} />
      <span style={{ width: 5, height: 5, borderRadius: 1, background: color, transform: "rotate(45deg)" }} />
    </span>
  );
}

export function SitePreviewEditorial({ d }) {
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);

  const Btn = ({ children, primary, big }) => (
    <a href={wa} target="_blank" rel="noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 9,
      padding: big ? "15px 26px" : "12px 21px", borderRadius: 3,
      fontSize: big ? 14.5 : 13, fontWeight: 600, textDecoration: "none", letterSpacing: ".01em",
      background: primary ? T.rust : "transparent",
      color: primary ? T.paper : T.ink,
      border: primary ? "none" : `1px solid ${T.ink}`,
      transition: "transform .2s ease, background .2s ease",
    }}>{children}</a>
  );

  return (
    <div className="ed-root" style={{
      fontFamily: "'Work Sans', sans-serif", color: T.ink, background: T.paper, fontSize: 14.5, lineHeight: 1.6,
      backgroundImage: NOISE_BG,
    }}>
      {EDITORIAL_STYLE_TAG}

      {/* header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(251,245,234,.88)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.line}` }}>
        <div style={wrap({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `16px ${CONTAINER_PAD}px` })}>
          {d.logo
            ? <img src={d.logo} alt={d.name} style={{ height: 26, maxWidth: 160, objectFit: "contain" }} />
            : <span className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 20 }}>{d.name}</span>}
          <nav className="ed-nav" style={{ display: "flex", gap: 22, fontSize: 12.5, color: T.sub, letterSpacing: ".02em" }}>
            <span>Especialidades</span><span>Método</span><span>Sobre</span><span>Dúvidas</span>
          </nav>
          <Btn primary><MessageCircle size={14} /> Agendar</Btn>
        </div>
      </div>

      {/* hero */}
      <div className="ed-hero-grid" style={wrap({ padding: `72px ${CONTAINER_PAD}px 64px` })}>
        <div className="ed-fade">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: T.rustDeep, background: T.sand, padding: "6px 13px", borderRadius: 2 }}>
            {d.badge}
          </span>
          <h1 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: "clamp(34px, 4.6vw, 54px)", lineHeight: 1.04, margin: "22px 0 16px", letterSpacing: "-.01em" }}>
            {d.headline}
          </h1>
          <p style={{ color: T.sub, maxWidth: 420, margin: "0 0 28px", fontSize: 15.5 }}>{d.subheadline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn primary big>Iniciar jornada <ArrowRight size={15} /></Btn>
            <Btn big>Saiba mais</Btn>
          </div>
        </div>
        <div className="ed-hero-photo ed-fade" style={{ position: "relative", animationDelay: ".15s" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translate(14px, 14px)", background: T.rust, borderRadius: 2 }} />
          <div style={{ position: "relative", aspectRatio: "3/4", borderRadius: 2, overflow: "hidden", border: `1px solid ${T.ink}`, background: T.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {d.photo
              ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span className="ed-serif" style={{ fontStyle: "italic", fontSize: 50, color: T.rustDeep, opacity: .6 }}>{initials(d.name)}</span>}
          </div>
        </div>
      </div>

      {/* especialidades */}
      <div style={{ background: T.panel, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
        <div style={wrap({ padding: `56px ${CONTAINER_PAD}px` })}>
          <Ornament />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 32, margin: "0 0 28px" }}>Especialidades clínicas</h2>
          <div className="ed-spec-grid">
            {d.specialties.map((s, i) => (
              <div key={i} style={{ position: "relative", overflow: "hidden", background: T.paper, border: `1px solid ${T.line}`, borderRadius: 3, padding: "26px 20px 20px" }}>
                <span className="ed-serif" style={{ position: "absolute", top: -10, right: 6, fontStyle: "italic", fontSize: 68, color: T.rust, opacity: .13, lineHeight: 1, userSelect: "none" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", position: "relative" }}>{s.t}</h3>
                <p style={{ fontSize: 13, color: T.sub, margin: 0, lineHeight: 1.55, position: "relative" }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* diferenciais */}
      <div className="ed-diff-grid" style={wrap({ padding: `60px ${CONTAINER_PAD}px` })}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translate(-10px, 10px)", background: T.sand, borderRadius: 2 }} />
          <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 2, border: `1px solid ${T.ink}`, background: `linear-gradient(160deg, ${T.panel}, ${T.sand})` }} />
        </div>
        <div>
          <Ornament />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, margin: "0 0 20px" }}>Por que esse atendimento?</h2>
          {d.benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <span style={{ marginTop: 2, flexShrink: 0, width: 20, height: 20, borderRadius: 99, background: T.rust, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={12} color={T.paper} />
              </span>
              <p style={{ margin: 0, fontSize: 14 }}><b>{b.t}</b> — <span style={{ color: T.sub }}>{b.d}</span></p>
            </div>
          ))}
          {d.aviso && <p style={{ marginTop: 18, fontSize: 12.5, color: T.sub, fontStyle: "italic" }}>{d.aviso}</p>}
        </div>
      </div>

      {/* metodologia */}
      <div style={{ background: T.ink, color: "#EFE7DA" }}>
        <div style={wrap({ padding: `60px ${CONTAINER_PAD}px`, maxWidth: READ_MAX + CONTAINER_PAD * 2 })}>
          <Ornament color="#D98A66" />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 30, margin: "0 0 18px", color: "#FBF5EA" }}>{d.methodTitle}</h2>
          {d.methodText.split("\n\n").map((p, i) => (
            <p key={i} style={{ color: "#C9BEAF", margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.7 }}>{p}</p>
          ))}
        </div>
      </div>

      {/* sobre */}
      <div className="ed-sobre-grid" style={wrap({ padding: `60px ${CONTAINER_PAD}px` })}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translate(12px, -12px)", background: T.sand, borderRadius: 2 }} />
          <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 2, overflow: "hidden", border: `1px solid ${T.ink}`, background: T.panel, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {d.photo
              ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span className="ed-serif" style={{ fontStyle: "italic", fontSize: 44, color: T.rustDeep, opacity: .5 }}>{initials(d.name)}</span>}
          </div>
        </div>
        <div>
          <Ornament />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, margin: "0 0 16px" }}>Uma escuta clínica e humana.</h2>
          <p style={{ color: T.sub, fontSize: 14.5, marginBottom: 22 }}>{d.bio}</p>
          <Btn primary><MessageCircle size={14} /> Agende uma consulta</Btn>
        </div>
      </div>

      {/* faq */}
      <div style={{ background: T.panel, borderTop: `1px solid ${T.line}` }}>
        <div style={wrap({ padding: `56px ${CONTAINER_PAD}px`, maxWidth: READ_MAX + CONTAINER_PAD * 2 })}>
          <Ornament />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, margin: "0 0 20px" }}>Perguntas frequentes</h2>
          {d.faq.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${T.line}`, padding: "16px 0" }} open={i === 0}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14.5, listStyle: "none", display: "flex", gap: 12 }}>
                <span className="ed-serif" style={{ fontStyle: "italic", color: T.rust }}>{String(i + 1).padStart(2, "0")}</span>{f.q}
              </summary>
              <p style={{ margin: "10px 0 0 30px", color: T.sub, fontSize: 13.5 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* cta final */}
      <div style={wrap({ padding: `60px ${CONTAINER_PAD}px` })}>
        <div style={{ background: T.rust, borderRadius: 4, padding: "44px 32px", color: T.paper, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <span className="ed-serif" style={{ position: "absolute", top: -30, left: -10, fontStyle: "italic", fontSize: 160, opacity: .12, lineHeight: 1 }}>”</span>
          <h3 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 30, margin: "0 0 10px", position: "relative" }}>Vamos dar o primeiro passo?</h3>
          <p style={{ color: "#F3D9CB", fontSize: 14, margin: "0 0 22px", position: "relative" }}>Agende uma conversa inicial agora mesmo.</p>
          <a href={wa} target="_blank" rel="noreferrer" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 26px", borderRadius: 3, background: T.paper, color: T.rustDeep, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            <MessageCircle size={16} /> Falar no WhatsApp
          </a>
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: `1px solid ${T.line}` }}>
        <div style={wrap({ padding: `26px ${CONTAINER_PAD}px`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 })}>
          <div>
            <div className="ed-serif" style={{ fontStyle: "italic", fontSize: 17 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{d.title} · {d.modalidade}</div>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: T.sub }}><Instagram size={14} />{d.instagram}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: T.sub }}><Mail size={14} />{d.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
