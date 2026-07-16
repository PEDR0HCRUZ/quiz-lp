import React, { useEffect, useRef } from "react";
import { MessageCircle, Instagram, Mail, MapPin } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, darken } from "./colorSchemes.js";

gsap.registerPlugin(ScrollTrigger);

// tokens fixos (papel/tinta) — só o accent (musgo/terracota/etc) vem da
// paleta escolhida no quiz, igual ao padrão do tema Olosirkon.
const T = {
  linen: "#E8E1D2",
  bark: "#2E2A24",
  cream: "#FBF8F1",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');";

// as 5 etapas da "trilha" — conteúdo fixo do tema (não vem de `d`, igual ao
// texto autoral fixo que o Olosirkon já usa pra seções decorativas). Genérico
// o bastante pra qualquer abordagem, ao contrário do Olosirkon que é escrito
// só pra psicanálise.
const JOURNEY_STEPS = [
  { tag: "Escuta", title: "Um espaço sem pressa", body: "A primeira conversa não tem roteiro fechado — é sobre entender o que te trouxe até aqui, no seu tempo." },
  { tag: "Vínculo", title: "Confiança se constrói", body: "A relação terapêutica é a base do trabalho: um espaço estável, sigiloso e sem julgamentos para voltar sempre que precisar." },
  { tag: "Processo", title: "Padrões ganham nome", body: "Sessão após sessão, o que antes era confuso começa a fazer sentido — dores repetidas ganham origem, contexto e caminho." },
  { tag: "Recursos", title: "Ferramentas pra usar fora da sala", body: "O trabalho não fica preso ao consultório: você sai de cada etapa com recursos concretos pra lidar com o dia a dia." },
  { tag: "Continuidade", title: "Um cuidado que acompanha", body: "Terapia é processo, não evento único — o acompanhamento segue no seu ritmo, reavaliado sempre que a vida muda." },
];

export const TERRA_STYLE_TAG = (
  <style>{`
    ${FONT_IMPORT}
    .tk-root { font-family: 'Atkinson Hyperlegible', sans-serif; background: ${T.linen}; color: ${T.bark}; }
    .tk-root * { box-sizing: border-box; }
    .tk-display { font-family: 'Fraunces', serif; }
    .tk-mono { font-family: 'Courier Prime', monospace; }
    .tk-kicker { font-family: 'Courier Prime', monospace; text-transform: uppercase; letter-spacing: 0.3em; font-size: 11px; }

    .tk-stitch-row { height: 1.5px; width: 100%; background-image: repeating-linear-gradient(90deg, rgba(46,42,36,.4) 0 10px, transparent 10px 20px); }
    .tk-dashed-v { border: 0; border-left: 1.5px dashed rgba(46,42,36,.3); }

    .tk-hero-grid { display: grid; grid-template-columns: 1fr 1fr; min-height: 90vh; }
    .tk-journey-row { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    .tk-journey-row.tk-reverse > div:first-child { order: 2; }
    .tk-journey-row.tk-reverse > div:last-child { order: 1; }
    .tk-journey-row.tk-reverse .tk-journey-copy { text-align: right; margin-left: auto; }

    .tk-deck { position: relative; display: flex; justify-content: center; min-height: 420px; padding-top: 32px; }
    .tk-deck-card { position: relative; width: 240px; height: 360px; padding: 20px; box-shadow: 0 20px 40px -12px rgba(20,18,14,.35); transition: transform .5s cubic-bezier(.16,1,.3,1); transform-origin: bottom center; }
    .tk-deck:hover .tk-deck-card { transform: translateX(var(--fan-x)) rotate(var(--fan-r)) translateY(var(--fan-y)); }

    .tk-board { position: relative; width: 100%; min-height: 460px; }
    .tk-polaroid { position: absolute; background: ${T.cream}; padding: 10px 10px 36px; box-shadow: 0 14px 28px -8px rgba(20,18,14,.4); transition: transform .3s ease; }
    .tk-polaroid:hover { transform: rotate(0deg) scale(1.04) !important; z-index: 20; }

    @media (max-width: 860px) {
      .tk-hero-grid { grid-template-columns: 1fr; min-height: auto; }
      .tk-journey-row, .tk-journey-row.tk-reverse { grid-template-columns: 1fr !important; gap: 20px; }
      .tk-journey-row.tk-reverse > div:first-child { order: 1; }
      .tk-journey-row.tk-reverse > div:last-child { order: 2; }
      .tk-journey-row.tk-reverse .tk-journey-copy { text-align: left; margin-left: 0; }
      .tk-deck { flex-direction: column; align-items: center; gap: 16px; }
      .tk-deck:hover .tk-deck-card { transform: none; }
      .tk-deck-card { width: 100%; max-width: 320px; height: auto; }
      .tk-board { min-height: 720px; }
      .tk-nav-links { display: none !important; }
    }
  `}</style>
);

const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
const firstName = (n) => (n || "").trim().split(" ")[0] || "";
const igLink = (handle) => {
  const h = (handle || "").replace("@", "").trim();
  return h ? `https://instagram.com/${h}` : "#";
};

export function SitePreviewTerra({ d }) {
  const rootRef = useRef(null);
  const pathRef = useRef(null);
  const { accent, accentSoft } = COLOR_SCHEMES[d.colorScheme] || COLOR_SCHEMES[DEFAULT_COLOR_SCHEME];
  const accentDeep = darken(accent, 0.35);
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);
  // deck de especialidades: no máx. 4 cartas pra o leque não virar bagunça
  const deckItems = (d.specialties || []).slice(0, 4);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    const rafId = requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".tk-reveal").forEach((el) => {
        gsap.from(el, {
          y: 32, opacity: 0, duration: 0.9, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
        });
      });

      // trilha desenhada conforme a seção "jornada" passa pelo viewport —
      // equivalente ao scrub do original, sem depender de Anime.js.
      const path = pathRef.current;
      if (path) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: "#jornada", start: "top 70%", end: "bottom bottom", scrub: 0.6 },
        });
      }
    }, rootRef);

    return () => {
      ctx.revert();
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="tk-root" ref={rootRef} style={{ overflowX: "clip" }}>
      {TERRA_STYLE_TAG}

      {/* header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(232,225,210,.88)", backdropFilter: "blur(8px)", borderBottom: `1px solid rgba(46,42,36,.15)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="tk-display" style={{ fontSize: 18, fontWeight: 600 }}>{d.name}</span>
          <nav className="tk-nav-links tk-kicker" style={{ display: "flex", gap: 24 }}>
            <a href="#especialidades" style={{ color: "inherit", textDecoration: "none" }}>Especialidades</a>
            <a href="#jornada" style={{ color: "inherit", textDecoration: "none" }}>Jornada</a>
            <a href="#sobre" style={{ color: "inherit", textDecoration: "none" }}>Sobre</a>
          </nav>
          <a href={wa} target="_blank" rel="noreferrer" className="tk-kicker" style={{ color: T.linen, background: accentDeep, padding: "9px 16px", textDecoration: "none" }}>Agendar</a>
        </div>
      </div>

      {/* hero */}
      <header className="tk-hero-grid" style={{ position: "relative" }}>
        <div className="tk-dashed-v" style={{ position: "absolute", left: "50%", top: 0, bottom: 0, display: "none" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 32px", gap: 24 }}>
          <span className="tk-kicker" data-edit="badge" style={{ color: accentDeep, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 24, height: 1.5, background: accentDeep }} />{d.badge}
          </span>
          <h1 data-edit="headline" className="tk-display" style={{ fontSize: "clamp(2.6rem,6vw,4.2rem)", lineHeight: 1.04, fontWeight: 500, margin: 0, letterSpacing: "-.01em" }}>
            {d.headline}
          </h1>
          <p data-edit="subheadline" style={{ maxWidth: 420, fontSize: 16, lineHeight: 1.6, opacity: 0.82, margin: 0 }}>{d.subheadline}</p>
          <div>
            <a href={wa} target="_blank" rel="noreferrer" data-edit="whatsapp" className="tk-kicker" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: T.linen, background: accentDeep, padding: "13px 22px", textDecoration: "none" }}>
              <MessageCircle size={14} /> Iniciar conversa
            </a>
          </div>
        </div>
        <div data-edit="photo" style={{ position: "relative", overflow: "hidden", background: accentSoft, minHeight: 320 }}>
          {d.photo
            ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
            : <span className="tk-display" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, color: accentDeep, opacity: 0.5 }}>{firstName(d.name)[0] || ""}</span>}
        </div>
      </header>

      <div className="tk-stitch-row" style={{ opacity: 0.4 }} />

      {/* jornada terapêutica */}
      <section id="jornada" style={{ position: "relative", padding: "80px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto 72px", textAlign: "center" }}>
          <p className="tk-kicker tk-reveal" style={{ color: accentDeep, marginBottom: 12 }}>Como funciona</p>
          <h2 className="tk-display tk-reveal" style={{ fontSize: "clamp(2rem,4.5vw,3rem)", margin: "0 0 14px", lineHeight: 1.15 }}>A jornada terapêutica</h2>
          <p className="tk-reveal" style={{ fontSize: 15, opacity: 0.75, margin: 0 }}>Nenhum processo é linear, mas toda jornada de cuidado passa por etapas parecidas.</p>
        </div>

        <div style={{ position: "relative", maxWidth: 880, margin: "0 auto" }}>
          <svg style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0, height: "100%", display: "none" }} className="tk-vine-svg" width="100" viewBox="0 0 100 1200" preserveAspectRatio="none" fill="none">
            <path ref={pathRef} d="M50 0 C 15 140, 85 240, 50 380 C 15 520, 85 620, 50 760 C 20 880, 80 980, 50 1200"
              stroke={accentDeep} strokeWidth="2.5" strokeDasharray="2 10" strokeLinecap="round" />
          </svg>
          <style>{`@media (min-width: 861px) { .tk-vine-svg { display: block !important; } }`}</style>

          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {JOURNEY_STEPS.map((step, i) => (
              <div key={i} className={`tk-journey-row tk-reveal ${i % 2 !== 0 ? "tk-reverse" : ""}`}>
                <div className="tk-journey-copy">
                  <p className="tk-kicker" style={{ color: accentDeep, marginBottom: 8 }}>{step.tag}</p>
                  <h3 className="tk-display" style={{ fontSize: 22, margin: "0 0 8px" }}>{step.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.78, lineHeight: 1.55, margin: 0, maxWidth: 340, marginLeft: i % 2 !== 0 ? "auto" : 0 }}>{step.body}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="tk-display" style={{ fontSize: 40, color: accentSoft }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="tk-stitch-row" style={{ opacity: 0.4 }} />

      {/* especialidades — deck em leque */}
      {deckItems.length > 0 && (
        <section id="especialidades" style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto 8px" }}>
            <p className="tk-kicker tk-reveal" style={{ color: accentDeep, marginBottom: 12 }}>Onde posso ajudar</p>
            <h2 className="tk-display tk-reveal" style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", margin: "0 0 8px" }}>Especialidades clínicas</h2>
            <p className="tk-reveal" style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>Passe o mouse pra ler cada carta.</p>
          </div>
          <div className="tk-deck tk-reveal">
            {deckItems.map((s, i) => {
              const offset = i - (deckItems.length - 1) / 2;
              return (
                <div key={i} data-edit={`specialties.${i}`} className="tk-deck-card"
                  style={{
                    marginLeft: i === 0 ? 0 : -48,
                    zIndex: 50 - i,
                    background: i % 2 === 0 ? accentDeep : accent,
                    color: T.linen,
                    "--fan-x": `${offset * 130}px`,
                    "--fan-r": `${offset * 6}deg`,
                    "--fan-y": `${Math.abs(offset) * -14}px`,
                  }}>
                  <p className="tk-kicker" style={{ opacity: 0.75 }}>{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="tk-display" style={{ fontSize: 22, margin: "10px 0 10px" }}>{s.t}</h3>
                  <p style={{ fontSize: 12.5, lineHeight: 1.55, opacity: 0.92, margin: 0 }}>{s.d}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="tk-stitch-row" style={{ opacity: 0.4 }} />

      {/* sobre — mural com foto + trechos do bio/FAQ como cartões espalhados */}
      <section id="sobre" style={{ padding: "80px 24px", background: accentSoft }}>
        <div style={{ maxWidth: 900, margin: "0 auto 40px", textAlign: "center" }}>
          <p className="tk-kicker tk-reveal" style={{ color: accentDeep, marginBottom: 12 }}>Quem sou eu</p>
          <h2 className="tk-display tk-reveal" style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", margin: 0 }}>Uma escuta clínica e humana</h2>
        </div>
        <div className="tk-board tk-reveal" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="tk-polaroid" data-edit="photo" style={{ left: "4%", top: 10, width: 200, transform: "rotate(-5deg)", zIndex: 3 }}>
            {d.photo
              ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: 200, objectFit: "cover" }} />
              : <div style={{ width: "100%", height: 200, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}><span className="tk-display" style={{ color: T.linen, fontSize: 40 }}>{firstName(d.name)[0] || ""}</span></div>}
            <p className="tk-kicker" style={{ marginTop: 10, color: T.bark, fontSize: 10 }}>{d.name}</p>
          </div>
          <div className="tk-polaroid" style={{ left: "36%", top: 60, width: 220, transform: "rotate(3deg)", zIndex: 2 }}>
            <p data-edit="bio" style={{ fontSize: 12.5, lineHeight: 1.55, color: T.bark, minHeight: 140 }}>{d.bio}</p>
            <p className="tk-kicker" style={{ marginTop: 10, color: accentDeep, fontSize: 10 }}>Sobre mim</p>
          </div>
          {d.faq?.[0] && (
            <div className="tk-polaroid" style={{ left: "12%", top: 260, width: 210, transform: "rotate(4deg)", zIndex: 1 }}>
              <p className="tk-kicker" style={{ color: accentDeep, fontSize: 10, marginBottom: 8 }}>{d.faq[0].q}</p>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: T.bark, minHeight: 100 }}>{d.faq[0].a}</p>
            </div>
          )}
        </div>
      </section>

      {/* cta final */}
      <section style={{ padding: "64px 24px", background: accentDeep, color: T.linen, textAlign: "center" }}>
        <h3 className="tk-display tk-reveal" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", margin: "0 0 12px" }}>Vamos dar o primeiro passo?</h3>
        <p className="tk-reveal" style={{ opacity: 0.82, fontSize: 14, margin: "0 0 24px" }}>Agende uma conversa inicial agora mesmo.</p>
        <a href={wa} target="_blank" rel="noreferrer" data-edit="whatsapp" className="tk-kicker tk-reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.linen, color: accentDeep, padding: "13px 24px", textDecoration: "none" }}>
          <MessageCircle size={14} /> Falar no WhatsApp
        </a>
      </section>

      {/* footer */}
      <footer style={{ borderTop: `1px solid rgba(46,42,36,.15)` }}>
        {d.endereco && (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 0" }}>
            <iframe title="Localização do consultório" loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(d.endereco)}&output=embed`}
              style={{ width: "100%", height: 200, border: 0, display: "block" }} />
            <div data-edit="endereco" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.7, marginTop: 10 }}>
              <MapPin size={13} />{d.endereco}
            </div>
          </div>
        )}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div className="tk-display" style={{ fontSize: 16, fontWeight: 600 }}>{d.name}</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{d.title} · {d.modalidade}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {d.instagram && (
              <a href={igLink(d.instagram)} target="_blank" rel="noreferrer" data-edit="instagram" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.7, color: "inherit", textDecoration: "none" }}><Instagram size={14} />{d.instagram}</a>
            )}
            {d.email && (
              <a href={`mailto:${d.email}`} data-edit="email" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.7, color: "inherit", textDecoration: "none" }}><Mail size={14} />{d.email}</a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
