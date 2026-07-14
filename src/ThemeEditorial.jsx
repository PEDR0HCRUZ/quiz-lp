import { useState } from "react";
import { ArrowRight, MessageCircle, Instagram, Mail, Check, MapPin, Plus } from "lucide-react";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, darken } from "./colorSchemes.js";

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
  sand: "#EAD9BE",
  line: "#E2D3B8",
  sub: "#79695A",
};

const CONTAINER_MAX = 1180;
const CONTAINER_PAD = 32;
const READ_MAX = 760;
// respiro lateral que encolhe no mobile via CSS var (definida no style tag).
const CPAD = `var(--cpad, ${CONTAINER_PAD}px)`;

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600;700&display=swap');";

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")";

export const EDITORIAL_STYLE_TAG = (
  <style>{`
    ${FONT_IMPORT}
    .ed-root { --cpad: 32px; }
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
      .ed-root { --cpad: 16px; }
      .ed-hero-grid,.ed-spec-grid,.ed-sobre-grid,.ed-diff-grid{grid-template-columns:1fr !important;}
      .ed-hero-grid{gap:32px;}
      .ed-hero-photo{order:-1; max-width:360px; margin:0 auto;}
      .ed-nav{display:none !important;}
    }
  `}</style>
);

const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
const initials = (n) =>
  (n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const firstName = (n) => (n || "").trim().split(" ")[0] || "";
const igLink = (handle) => {
  const h = (handle || "").trim();
  if (!h) return "";
  if (/^https?:\/\//i.test(h)) return h;
  return `https://instagram.com/${h.replace(/^@/, "")}`;
};

const wrap = (extra) => ({ maxWidth: CONTAINER_MAX, margin: "0 auto", padding: `0 ${CPAD}`, ...extra });

function Ornament({ color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}>
      <span style={{ width: 22, height: 1, background: color }} />
      <span style={{ width: 5, height: 5, borderRadius: 1, background: color, transform: "rotate(45deg)" }} />
    </span>
  );
}

export function SitePreviewEditorial({ d }) {
  const [openFaq, setOpenFaq] = useState(0);
  const { accent, accentSoft } = COLOR_SCHEMES[d.colorScheme] || COLOR_SCHEMES[DEFAULT_COLOR_SCHEME];
  const accentDeep = darken(accent, 0.22);
  // bloco de contraste (metodologia) — versão bem escura do accent, no lugar
  // do marrom fixo que ignorava a paleta escolhida.
  const blockDark = darken(accent, 0.58);
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);

  const Btn = ({ children, primary, big }) => (
    <a href={wa} target="_blank" rel="noreferrer" data-edit="whatsapp" style={{
      display: "inline-flex", alignItems: "center", gap: 9,
      padding: big ? "15px 26px" : "12px 21px", borderRadius: 3,
      fontSize: big ? 14.5 : 13, fontWeight: 600, textDecoration: "none", letterSpacing: ".01em",
      background: primary ? accent : "transparent",
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
        <div style={wrap({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `16px ${CPAD}` })}>
          {d.logo
            ? <img src={d.logo} alt={d.name} data-edit="logo" style={{ height: 26, maxWidth: 160, objectFit: "contain" }} />
            : <span className="ed-serif" data-edit="name" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 20 }}>{d.name}</span>}
          <nav className="ed-nav" style={{ display: "flex", gap: 22, fontSize: 12.5, color: T.sub, letterSpacing: ".02em" }}>
            <a href="#especialidades" style={{ color: "inherit", textDecoration: "none" }}>Especialidades</a>
            <a href="#metodo" style={{ color: "inherit", textDecoration: "none" }}>Método</a>
            <a href="#sobre" style={{ color: "inherit", textDecoration: "none" }}>Sobre</a>
            <a href="#duvidas" style={{ color: "inherit", textDecoration: "none" }}>Dúvidas</a>
          </nav>
          <Btn primary><MessageCircle size={14} /> Agendar</Btn>
        </div>
      </div>

      {/* hero */}
      <div className="ed-hero-grid" style={wrap({ padding: `72px ${CPAD} 64px` })}>
        <div className="ed-fade">
          <span data-edit="badge" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: accentDeep, background: accentSoft, padding: "6px 13px", borderRadius: 2 }}>
            {d.badge}
          </span>
          <h1 className="ed-serif" data-edit="headline" style={{ fontStyle: "italic", fontWeight: 400, fontSize: "clamp(34px, 4.6vw, 54px)", lineHeight: 1.04, margin: "22px 0 16px", letterSpacing: "-.01em" }}>
            {d.headline}
          </h1>
          <p data-edit="subheadline" style={{ color: T.sub, maxWidth: 420, margin: "0 0 28px", fontSize: 15.5 }}>{d.subheadline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn primary big>Iniciar jornada <ArrowRight size={15} /></Btn>
            <Btn big>Saiba mais</Btn>
          </div>
        </div>
        <div className="ed-hero-photo ed-fade" style={{ position: "relative", animationDelay: ".15s" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translate(14px, 14px)", background: accent, borderRadius: 2 }} />
          <div data-edit="photo" style={{ position: "relative", aspectRatio: "3/4", borderRadius: 2, overflow: "hidden", border: `1px solid ${T.ink}`, background: accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {d.photo
              ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span className="ed-serif" style={{ fontStyle: "italic", fontSize: 50, color: accentDeep, opacity: .6 }}>{initials(d.name)}</span>}
          </div>
        </div>
      </div>

      {/* especialidades */}
      <div id="especialidades" style={{ background: T.panel, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, scrollMarginTop: 70 }}>
        <div style={wrap({ padding: `56px ${CPAD}` })}>
          <Ornament color={accent} />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 32, margin: "0 0 28px" }}>Especialidades clínicas</h2>
          <div className="ed-spec-grid">
            {d.specialties.map((s, i) => (
              <div key={i} data-edit={`specialties.${i}`} style={{ position: "relative", overflow: "hidden", background: T.paper, border: `1px solid ${T.line}`, borderRadius: 3, padding: "26px 20px 20px" }}>
                <span className="ed-serif" style={{ position: "absolute", top: -10, right: 6, fontStyle: "italic", fontSize: 68, color: accent, opacity: .13, lineHeight: 1, userSelect: "none" }}>
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
      <div className="ed-diff-grid" style={wrap({ padding: `60px ${CPAD}` })}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translate(-10px, 10px)", background: T.sand, borderRadius: 2 }} />
          <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 2, overflow: "hidden", border: `1px solid ${T.ink}` }}>
            <img src="/media/diferenciais-quente.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <div>
          <Ornament color={accent} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: accentDeep, margin: "0 0 8px" }}>Psicologia online</p>
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, margin: "0 0 20px" }}>Por que esse atendimento?</h2>
          {d.benefits.map((b, i) => (
            <div key={i} data-edit={`benefits.${i}`} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <span style={{ marginTop: 2, flexShrink: 0, width: 20, height: 20, borderRadius: 99, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={12} color={T.paper} />
              </span>
              <p style={{ margin: 0, fontSize: 14 }}><b>{b.t}</b> — <span style={{ color: T.sub }}>{b.d}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* metodologia */}
      <div id="metodo" style={{ background: blockDark, color: "#EFE7DA", scrollMarginTop: 70 }}>
        <div style={wrap({ padding: `60px ${CPAD}`, maxWidth: READ_MAX + CONTAINER_PAD * 2 })}>
          <Ornament color={accentSoft} />
          <h2 className="ed-serif" data-edit="methodTitle" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 30, margin: "0 0 18px", color: "#FBF5EA" }}>{d.methodTitle}</h2>
          <div data-edit="methodText">
            {d.methodText.split("\n\n").map((p, i) => (
              <p key={i} style={{ color: "rgba(255,255,255,.72)", margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.7 }}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      {/* sobre */}
      <div id="sobre" className="ed-sobre-grid" style={wrap({ padding: `60px ${CPAD}`, scrollMarginTop: 70 })}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translate(12px, -12px)", background: T.sand, borderRadius: 2 }} />
          <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 2, overflow: "hidden", border: `1px solid ${T.ink}` }}>
            <img src="/media/sobre-quente.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <div>
          <Ornament color={accent} />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, margin: "0 0 16px" }}>Uma escuta clínica e humana.</h2>
          <p data-edit="bio" style={{ color: T.sub, fontSize: 14.5, marginBottom: 22 }}>{d.bio}</p>
          <Btn primary><MessageCircle size={14} /> Agende uma consulta</Btn>
        </div>
      </div>

      {/* faq */}
      <div id="duvidas" style={{ background: T.panel, borderTop: `1px solid ${T.line}`, scrollMarginTop: 70 }}>
        <div style={wrap({ padding: `56px ${CPAD}`, maxWidth: READ_MAX + CONTAINER_PAD * 2 })}>
          <Ornament color={accent} />
          <h2 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, margin: "0 0 20px" }}>Perguntas frequentes</h2>
          {d.faq.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} data-edit={`faq.${i}`} style={{ borderTop: `1px solid ${T.line}`, padding: "16px 0" }}>
                <button onClick={() => setOpenFaq(open ? -1 : i)}
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer", fontWeight: 600, fontSize: 14.5, background: "none", border: "none", padding: 0, margin: 0, color: T.ink, textAlign: "left", font: "inherit" }}>
                  <span style={{ display: "flex", gap: 12 }}>
                    <span className="ed-serif" style={{ fontStyle: "italic", color: accent }}>{String(i + 1).padStart(2, "0")}</span>{f.q}
                  </span>
                  <Plus size={15} color={T.sub} style={{ flexShrink: 0, transition: "transform .15s", transform: open ? "rotate(45deg)" : "none" }} />
                </button>
                <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .25s ease" }}>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ margin: "10px 0 0 30px", color: T.sub, fontSize: 13.5 }}>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* investimento — só aparece se a pessoa optou por mostrar o valor no quiz */}
      {d.preco?.mostrar && d.preco?.valor != null && (
        <div style={wrap({ padding: `60px ${CPAD} 0` })}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between", background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, padding: "28px 30px" }}>
            <div>
              <Ornament color={accent} />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: accentDeep, margin: "0 0 6px" }}>Investimento</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                <span className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 40, color: T.ink, lineHeight: 1 }}>R$ {d.preco.valor}</span>
                <span style={{ fontSize: 14, color: T.sub }}>por sessão</span>
              </div>
            </div>
            <Btn primary><MessageCircle size={14} /> Agendar</Btn>
          </div>
        </div>
      )}
      {/* cta final */}
      <div style={wrap({ padding: `60px ${CPAD}` })}>
        <div style={{ background: accent, borderRadius: 4, padding: "44px 32px", color: T.paper, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <span className="ed-serif" style={{ position: "absolute", top: -30, left: -10, fontStyle: "italic", fontSize: 160, opacity: .12, lineHeight: 1 }}>”</span>
          <h3 className="ed-serif" style={{ fontStyle: "italic", fontWeight: 400, fontSize: 30, margin: "0 0 10px", position: "relative" }}>Vamos dar o primeiro passo?</h3>
          <p style={{ color: "#F3D9CB", fontSize: 14, margin: "0 0 22px", position: "relative" }}>Agende uma conversa inicial agora mesmo.</p>
          <a href={wa} target="_blank" rel="noreferrer" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 26px", borderRadius: 3, background: T.paper, color: accentDeep, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            <MessageCircle size={16} /> Falar no WhatsApp
          </a>
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: `1px solid ${T.line}` }}>
        {d.endereco && (
          <div style={wrap({ padding: `26px ${CPAD} 0` })}>
            <iframe title="Localização do consultório" loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(d.endereco)}&output=embed`}
              style={{ width: "100%", height: 200, border: 0, borderRadius: 3, display: "block" }} />
            <div data-edit="endereco" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.sub, marginTop: 10 }}>
              <MapPin size={13} />{d.endereco}
            </div>
          </div>
        )}
        <div style={wrap({ padding: `26px ${CPAD}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 })}>
          <div>
            <div className="ed-serif" style={{ fontStyle: "italic", fontSize: 17 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{d.title} · {d.modalidade}</div>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {d.instagram && (
              <a href={igLink(d.instagram)} target="_blank" rel="noreferrer" data-edit="instagram" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: T.sub, textDecoration: "none" }}><Instagram size={14} />{d.instagram}</a>
            )}
            {d.email && (
              <a href={`mailto:${d.email}`} data-edit="email" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: T.sub, textDecoration: "none" }}><Mail size={14} />{d.email}</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
