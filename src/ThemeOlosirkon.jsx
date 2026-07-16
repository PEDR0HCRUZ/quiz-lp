import React, { useEffect, useRef } from "react";
import { ArrowRight, MessageCircle, Instagram, Mail, Plus, MapPin } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME } from "./colorSchemes.js";

gsap.registerPlugin(ScrollTrigger);

const T = {
  gold: "#C8A24B",
  charcoal: "#22201C",
  bone: "#EFE8DC",
  acacia: "#5C6B4A",
  ochre: "#B05A2E",
};

const CONTAINER_MAX = 1200;

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Lora:ital,wght@0,400;0,500;1,400&family=Archivo:wght@400;500;600&display=swap');";

export const OLOSIRKON_STYLE_TAG = (
  <style>{`
    ${FONT_IMPORT}
    .ol-root { --cpad: 32px; font-family: 'Lora', serif; background: ${T.bone}; color: ${T.charcoal}; line-height: 1.5; }
    .ol-root * { box-sizing: border-box; }
    .ol-display { font-family: 'Fraunces', serif; }
    .ol-body { font-family: 'Lora', serif; }
    .ol-caps { font-family: 'Archivo', sans-serif; }
    .ol-kicker { font-family: 'Archivo', sans-serif; text-transform: uppercase; letter-spacing: 0.22em; font-size: 11px; }
    .ol-kicker-lg { font-family: 'Archivo', sans-serif; text-transform: uppercase; letter-spacing: 0.22em; font-size: 12px; }
    .ol-body-col { font-family: 'Lora', serif; font-size: 18.5px; line-height: 1.7; }
    .ol-gold-rule { height: 1px; background: var(--gold, ${T.gold}); }
    
    .ol-dropcap::first-letter {
      font-family: 'Fraunces', serif;
      font-weight: 400;
      font-size: 6.2rem;
      line-height: 0.78;
      float: left;
      color: ${T.ochre};
      padding: 0.35rem 0.7rem 0 0;
    }
    
    .ol-link-underline {
      background-image: linear-gradient(var(--gold, ${T.gold}), var(--gold, ${T.gold}));
      background-size: 100% 1px;
      background-repeat: no-repeat;
      background-position: 0 100%;
      padding-bottom: 2px;
    }

    /* Layout Utilities */
    .ol-flex { display: flex; }
    .ol-flex-col { display: flex; flex-direction: column; }
    .ol-items-center { align-items: center; }
    .ol-justify-between { justify-content: space-between; }
    .ol-justify-center { justify-content: center; }
    .ol-items-baseline { align-items: baseline; }
    .ol-items-end { align-items: flex-end; }
    .ol-justify-end { justify-content: flex-end; }
    .ol-gap-4 { gap: 16px; }
    .ol-gap-6 { gap: 24px; }
    .ol-gap-8 { gap: 32px; }
    .ol-gap-10 { gap: 40px; }
    .ol-gap-12 { gap: 48px; }
    
    .ol-grid { display: grid; }
    
    .ol-relative { position: relative; }
    .ol-absolute { position: absolute; }
    .ol-fixed { position: fixed; }
    .ol-inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .ol-top-0 { top: 0; }
    .ol-left-0 { left: 0; }
    .ol-right-0 { right: 0; }
    .ol-bottom-0 { bottom: 0; }
    .ol-z-50 { z-index: 50; }
    .ol-z-10 { z-index: 10; }
    
    .ol-w-full { width: 100%; }
    .ol-h-screen { height: 100vh; }
    .ol-h-full { height: 100%; }
    .ol-overflow-hidden { overflow: hidden; }
    
    .ol-px-6 { padding-left: 24px; padding-right: 24px; }
    .ol-py-5 { padding-top: 20px; padding-bottom: 20px; }
    .ol-py-24 { padding-top: 96px; padding-bottom: 96px; }
    .ol-py-40 { padding-top: 160px; padding-bottom: 160px; }
    
    .ol-mb-7 { margin-bottom: 28px; }
    .ol-mt-12 { margin-top: 48px; }
    
    /* Custom Grids for Sections */
    .ol-essay-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 48px; }
    .ol-reflection-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 40px; align-items: center; }
    .ol-method-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 40px; align-items: center; }
    .ol-areas-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 48px; }
    .ol-areas-list { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
    .ol-options-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 96px; }
    .ol-cta-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 48px; }
    .ol-footer-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 64px; }

    @media (max-width: 900px) {
      .ol-root { --cpad: 16px; }
      .ol-essay-grid, .ol-reflection-grid, .ol-method-grid, .ol-areas-grid, .ol-areas-list, .ol-options-grid, .ol-cta-grid, .ol-footer-grid {
        grid-template-columns: 1fr !important;
        gap: 32px !important;
      }
      .ol-essay-grid > div, .ol-reflection-grid > div, .ol-method-grid > div, .ol-areas-grid > div, .ol-options-grid > div, .ol-cta-grid > div, .ol-footer-grid > div {
        grid-column: span 1 !important;
        grid-column-start: auto !important;
      }
      .ol-hero-text h1 { font-size: 3.5rem !important; }
      .ol-nav-links { display: none !important; }
      .ol-reflection-grid > div:nth-child(1) { order: 2; }
      .ol-reflection-grid > div:nth-child(2) { order: 1; }
    }
  `}</style>
);

const waLink = (num, msg) =>
  `https://wa.me/${(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg || "")}`;
const firstName = (n) => (n || "").trim().split(" ")[0] || "";

export function SitePreviewOlosirkon({ d }) {
  const rootRef = useRef(null);
  const { accent } = COLOR_SCHEMES[d.colorScheme] || COLOR_SCHEMES[DEFAULT_COLOR_SCHEME];
  const wa = waLink(d.whatsapp, d.waMessage || `Olá, ${firstName(d.name)}! Tenho interesse em agendar uma consulta.`);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.06, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      // Hero Parallax
      gsap.to("#hero-img", {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.to("#hero-text", {
        yPercent: -22,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });

      // Reveal animations
      gsap.utils.toArray(".ol-reveal").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" }
        });
      });

      // Image reveals
      gsap.utils.toArray(".ol-reveal-img").forEach((el) => {
        const img = el.querySelector("img");
        if (img) {
          gsap.from(img, {
            scale: 1.15,
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
          });
        }
      });
    }, rootRef);

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div className="ol-root" ref={rootRef} style={{
      background: T.bone, color: T.charcoal, overflowX: "clip",
      '--gold': accent,
    }}>
      {OLOSIRKON_STYLE_TAG}

      {/* Nav */}
      <nav className="ol-fixed ol-top-0 ol-left-0 ol-right-0 ol-z-50" style={{ mixBlendMode: 'difference' }}>
        <div className="ol-flex ol-items-center ol-justify-between ol-px-6 ol-py-5" style={{ paddingLeft: 'clamp(24px, 4vw, 48px)', paddingRight: 'clamp(24px, 4vw, 48px)' }}>
          <a href="#" className="ol-display no-underline" style={{ fontSize: '1.5rem', color: '#EFE8DC', letterSpacing: '-0.02em' }}>{d.name}</a>
          <div className="ol-nav-links ol-flex ol-items-center ol-gap-10 ol-kicker" style={{ color: '#EFE8DC' }}>
            <a href="#especialidades" className="hover:opacity-60 no-underline text-inherit">Especialidades</a>
            <a href="#metodo" className="hover:opacity-60 no-underline text-inherit">Método</a>
            <a href="#sobre" className="hover:opacity-60 no-underline text-inherit">Sobre</a>
            <a href="#duvidas" className="hover:opacity-60 no-underline text-inherit">Dúvidas</a>
            <a href={wa} target="_blank" rel="noreferrer" className="ol-px-6 ol-py-2 transition-colors no-underline" style={{ border: '1px solid #EFE8DC', color: '#EFE8DC', fontSize: '10px', letterSpacing: '0.3em' }}>AGENDAR</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header id="hero" className="ol-relative ol-h-screen ol-w-full ol-overflow-hidden" style={{ background: '#22201C' }}>
        <div className="ol-absolute ol-inset-0" style={{ zIndex: 0 }}>
          <img id="hero-img" src={d.photo || "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&w=2000&q=80&fit=crop"} alt="Cenário" className="ol-w-full" style={{ objectFit: 'cover', opacity: 0.6, height: '120%' }} />
        </div>
        <div className="ol-absolute ol-inset-0" style={{ background: 'linear-gradient(90deg, #22201C 0%, rgba(34,32,28,0.6) 40%, transparent 100%)' }}></div>
        <div id="hero-text" className="ol-relative ol-z-10 ol-h-full ol-px-6 ol-flex ol-flex-col ol-justify-center" style={{ maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(24px, 8vw, 96px)' }}>
          <p className="ol-kicker-lg ol-mb-7" style={{ color: 'var(--gold)' }}>{d.badge}</p>
          <h1 className="ol-display font-light" style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)', lineHeight: '0.92', letterSpacing: '-0.02em', color: '#EFE8DC', maxWidth: '900px', margin: 0 }}>
            {d.headline?.split('psicanálise')[0]}
            <span className="italic" style={{ color: 'var(--gold)' }}>{d.headline?.includes('psicanálise') ? 'psicanálise' : ''}</span>
          </h1>
          <div className="ol-gold-rule ol-mb-7" style={{ width: '128px', marginTop: '40px' }}></div>
          <p className="ol-body italic" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', color: '#EFE8DC', opacity: 0.9, maxWidth: '512px', lineHeight: '1.6', margin: 0 }}>{d.subheadline}</p>
          <div className="ol-mt-12">
            <a href={wa} target="_blank" rel="noreferrer" className="ol-flex ol-items-center ol-gap-4 no-underline" style={{ color: '#EFE8DC' }}>
              <span className="ol-kicker" style={{ transition: 'color 0.3s' }}>Falar no WhatsApp</span>
              <div style={{ width: '48px', height: '1px', background: '#EFE8DC', transition: 'width 0.3s' }}></div>
            </a>
          </div>
        </div>
        <div className="ol-absolute ol-z-10 ol-flex ol-items-center ol-gap-4" style={{ bottom: '40px', right: '40px' }}>
          <span className="ol-kicker" style={{ color: '#EFE8DC' }}>Explore</span>
          <div style={{ width: '64px', height: '1px', background: 'var(--gold)' }}></div>
        </div>
      </header>

      {/* Sobre / Essay */}
      <section id="sobre" className="ol-px-6 ol-py-24" style={{ paddingTop: 'clamp(96px, 15vw, 160px)', paddingBottom: 'clamp(96px, 15vw, 160px)', maxWidth: '1440px', margin: '0 auto' }}>
        <div className="ol-essay-grid">
          <div style={{ gridColumn: 'span 2' }}>
            <p className="ol-kicker ol-reveal" style={{ color: 'var(--gold)' }}>Capítulo Um</p>
            <p className="ol-display italic ol-reveal" style={{ fontSize: '1.5rem', color: T.acacia, marginTop: '12px' }}>O Silêncio que Fala</p>
          </div>
          <div style={{ gridColumn: '4 / span 5' }}>
            <p className="ol-body-col ol-dropcap ol-reveal" data-edit="bio">{d.bio}</p>
          </div>
          <div style={{ gridColumn: '10 / span 3' }}>
            <p className="ol-kicker ol-reveal" style={{ color: T.ochre }}>A Prática</p>
            <p className="ol-body italic ol-reveal" style={{ fontSize: '1rem', color: T.acacia, marginTop: '16px', lineHeight: '1.6' }}>
              "A psicanálise é, em essência, uma cura pelo amor." — Esta máxima nos lembra que o vínculo terapêutico é o solo onde a transformação se torna possível.
            </p>
          </div>
        </div>
      </section>

      {/* Reflection */}
      <section className="ol-py-12" style={{ paddingBottom: 'clamp(48px, 10vw, 96px)' }}>
        <div className="ol-reflection-grid">
          <div style={{ gridColumn: '2 / span 4', padding: '0 24px' }}>
            <p className="ol-kicker ol-reveal" style={{ color: 'var(--gold)' }}>Presença e Escuta</p>
            <p className="ol-body-col ol-reveal" style={{ marginTop: '24px' }}>
              O setting analítico é um espaço de suspensão. Onde o julgamento dá lugar à curiosidade analítica. Cada gesto, cada pausa e cada esquecimento tornam-se material de trabalho para a construção de uma vida mais autêntica.
            </p>
          </div>
          <div className="ol-reveal-img ol-overflow-hidden" style={{ gridColumn: '7 / span 6' }}>
            <img src="https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1600&q=80" alt="Reflexão" className="ol-w-full" style={{ height: '70vh', objectFit: 'cover' }} />
            <p className="ol-kicker ol-reveal" style={{ marginTop: '16px', textAlign: 'right', paddingRight: '24px', opacity: 0.4 }}>A subjetividade em foco — Fotografia, {d.name}</p>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="ol-relative ol-py-24 ol-px-6" style={{ background: '#22201C', paddingTop: 'clamp(96px, 15vw, 160px)', paddingBottom: 'clamp(96px, 15vw, 160px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <blockquote className="ol-display italic font-light ol-reveal" style={{ fontSize: 'clamp(2.5rem, 5.5vw, 5rem)', lineHeight: '1.05', color: '#EFE8DC', margin: '0 0 0 -8px', maxWidth: '1000px' }}>
            <span style={{ color: 'var(--gold)' }}>“</span>
            Olhe para as profundezas da sua própria alma e aprenda primeiro a se <span className="italic" style={{ color: 'var(--gold)' }}>conhecer</span>.
            <span style={{ color: 'var(--gold)' }}>”</span>
          </blockquote>
          <p className="ol-kicker ol-reveal" style={{ marginTop: '48px', color: 'var(--gold)' }}>— Sigmund Freud</p>
        </div>
      </section>

      {/* Method */}
      <section id="metodo" className="ol-py-24" style={{ paddingBottom: 'clamp(96px, 15vw, 160px)' }}>
        <div className="ol-method-grid">
          <div className="ol-reveal-img ol-overflow-hidden" style={{ gridColumn: 'span 7' }}>
            <img src="https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&cs=tinysrgb&w=1600&q=80" alt="Método" className="ol-w-full" style={{ height: '75vh', objectFit: 'cover', filter: 'grayscale(0.2)' }} />
            <p className="ol-kicker ol-reveal" style={{ marginTop: '16px', paddingLeft: '24px', opacity: 0.4 }}>O laço analítico — Fotografia, {d.name}</p>
          </div>
          <div style={{ gridColumn: '9 / span 4', padding: '0 24px' }}>
            <p className="ol-kicker ol-reveal" style={{ color: 'var(--gold)' }}>O Método</p>
            <h2 className="ol-display ol-reveal" style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', lineHeight: '1.2', color: T.charcoal, marginTop: '16px', margin: 0 }}>
              {d.methodTitle}
            </h2>
            <div className="ol-body-col ol-reveal" style={{ marginTop: '24px' }}>
              {d.methodText?.split('\\n\\n').map((p, i) => <p key={i} style={{ marginBottom: '16px' }}>{p}</p>)}
            </div>
          </div>
        </div>
      </section>

      {/* Especialidades / Areas */}
      <section id="especialidades" className="ol-px-6 ol-py-24" style={{ background: 'rgba(255, 255, 255, 0.3)', borderTop: '1px solid rgba(200, 162, 75, 0.1)', borderBottom: '1px solid rgba(200, 162, 75, 0.1)', paddingTop: 'clamp(96px, 15vw, 160px)', paddingBottom: 'clamp(96px, 15vw, 160px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="ol-areas-grid" style={{ marginBottom: '80px' }}>
            <div style={{ gridColumn: 'span 8' }}>
              <h2 className="ol-display ol-reveal" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: '0.9', color: T.charcoal, margin: 0 }}>
                Áreas de <span className="italic" style={{ color: 'var(--gold)' }}>Aprofundamento</span>
              </h2>
            </div>
            <div className="ol-flex ol-items-end" style={{ gridColumn: 'span 4' }}>
              <p className="ol-kicker ol-reveal" style={{ color: T.ochre, marginBottom: '8px' }}>Frentes Clínicas</p>
            </div>
          </div>
          <div className="ol-areas-list">
            {d.specialties?.map((s, i) => (
              <div key={i} className={`ol-reveal ${i % 2 !== 0 ? 'ol-mt-12' : ''}`}>
                <div className="ol-flex ol-items-baseline ol-gap-6" style={{ marginBottom: '24px' }}>
                  <span className="ol-display" style={{ fontSize: '3rem', color: 'rgba(200, 162, 75, 0.3)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="ol-display" style={{ fontSize: '1.875rem', margin: 0 }}>{s.t}</h4>
                </div>
                <p className="ol-body-col" style={{ opacity: 0.8, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atendimento / Options */}
      <section id="duvidas" className="ol-px-6 ol-py-24" style={{ paddingTop: 'clamp(96px, 15vw, 160px)', paddingBottom: 'clamp(96px, 15vw, 160px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="ol-options-grid">
            <div style={{ gridColumn: 'span 7' }}>
              <div className="ol-reveal-img ol-overflow-hidden" style={{ marginBottom: '32px', background: '#D3D3D3' }}>
                <img src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&w=1600&q=80&fit=crop" alt="Presencial" className="ol-w-full" style={{ height: '60vh', objectFit: 'cover' }} />
              </div>
              <h3 className="ol-display ol-reveal" style={{ fontSize: '2.25rem', color: T.charcoal, margin: 0 }}>Presencial Porto Alegre</h3>
              <p className="ol-body-col ol-reveal" style={{ marginTop: '16px', maxWidth: '576px' }}>
                Sessões realizadas em consultório privativo no bairro Auxiliadora. Um ambiente neutro e seguro projetado para o rigor da escuta analítica.
              </p>
              <div className="ol-reveal" style={{ marginTop: '32px', borderLeft: '1px solid var(--gold)', paddingLeft: '32px', paddingTop: '4px', paddingBottom: '4px' }}>
                <p className="ol-kicker" style={{ color: 'var(--gold)', margin: 0 }}>Investimento</p>
                <p className="ol-display" style={{ fontSize: '1.875rem', marginTop: '4px', color: T.charcoal, margin: 0 }}>
                  R$ {d.preco?.valor || '250'} <span className="ol-body italic" style={{ fontSize: '1rem', opacity: 0.6 }}>por sessão</span>
                </p>
              </div>
            </div>
            <div style={{ gridColumn: '9 / span 4', marginTop: '192px' }}>
              <div className="ol-reveal-img ol-overflow-hidden" style={{ marginBottom: '32px', background: '#D3D3D3' }}>
                <img src="https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Online" className="ol-w-full" style={{ height: '50vh', objectFit: 'cover', filter: 'grayscale(1)' }} />
              </div>
              <h3 className="ol-display ol-reveal" style={{ fontSize: '2.25rem', color: T.charcoal, margin: 0 }}>Atendimento Online</h3>
              <p className="ol-body-col ol-reveal" style={{ marginTop: '16px' }}>
                A profundidade da psicanálise acessível de qualquer lugar do mundo. Sessões por vídeo com absoluto sigilo e infraestrutura digital segura.
              </p>
              <div className="ol-reveal" style={{ marginTop: '32px', borderLeft: '1px solid var(--gold)', paddingLeft: '32px', paddingTop: '4px', paddingBottom: '4px' }}>
                <p className="ol-kicker" style={{ color: 'var(--gold)', margin: 0 }}>Investimento</p>
                <p className="ol-display" style={{ fontSize: '1.875rem', marginTop: '4px', color: T.charcoal, margin: 0 }}>
                  R$ {d.preco?.valor || '250'} <span className="ol-body italic" style={{ fontSize: '1rem', opacity: 0.6 }}>por sessão</span>
                </p>
              </div>
              <a href={wa} target="_blank" rel="noreferrer" className="ol-link-underline ol-kicker ol-reveal no-underline" style={{ display: 'inline-block', marginTop: '32px', color: T.charcoal }}>Conversar no WhatsApp →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="ol-py-40 ol-px-6" style={{ background: '#22201C', paddingTop: 'clamp(128px, 20vw, 208px)', paddingBottom: 'clamp(128px, 20vw, 208px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="ol-cta-grid">
            <div style={{ gridColumn: 'span 8' }}>
              <p className="ol-kicker ol-reveal" style={{ color: 'var(--gold)', marginBottom: '32px' }}>O próximo passo</p>
              <h2 className="ol-display ol-reveal" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', lineHeight: '0.9', color: '#EFE8DC', margin: 0 }}>
                A cura começa pela <span className="italic" style={{ color: 'var(--gold)' }}>palavra</span>
              </h2>
            </div>
            <div className="ol-flex ol-flex-col ol-justify-end" style={{ gridColumn: 'span 4' }}>
              <p className="ol-body-col italic ol-reveal" style={{ fontSize: '1.25rem', color: '#EFE8DC', opacity: 0.8, marginBottom: '40px', margin: 0 }}>
                Agende uma conversa inicial para compreender como o processo psicanalítico pode atuar em sua vida.
              </p>
              <a href={wa} target="_blank" rel="noreferrer" className="ol-display ol-reveal no-underline" style={{ display: 'inline-block', padding: '24px 40px', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '1.5rem', textAlign: 'center', transition: 'all 0.3s' }}>
                Agendar via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#22201C', color: '#EFE8DC' }}>
        <div className="ol-px-6 ol-py-24" style={{ paddingTop: 'clamp(96px, 15vw, 128px)', paddingBottom: 'clamp(96px, 15vw, 128px)', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="ol-gold-rule ol-w-full" style={{ marginBottom: '64px', opacity: 0.3 }}></div>
          <div className="ol-footer-grid">
            <div style={{ gridColumn: 'span 6' }}>
              <p className="ol-kicker" style={{ color: 'var(--gold)', marginBottom: '24px' }}>Psicoterapia</p>
              <h2 className="ol-display font-light" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '0.95', color: '#EFE8DC', margin: 0 }}>
                {d.name} <span className="italic" style={{ color: 'var(--gold)' }}>Psicanálise</span>
              </h2>
              <p className="ol-body-col" style={{ marginTop: '32px', maxWidth: '448px', opacity: 0.7, margin: 0 }}>
                {d.title}. Atendimento {d.modalidade === 'online' ? '100% Online' : d.modalidade === 'presencial' ? 'Presencial' : 'Híbrido'} especializado em subjetividade e sofrimento psíquico.
              </p>
              <a href={`mailto:${d.email}`} className="ol-link-underline ol-display ol-reveal no-underline" style={{ display: 'inline-block', marginTop: '32px', fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', fontStyle: 'italic', color: '#EFE8DC', transition: 'color 0.3s' }}>
                {d.email}
              </a>
            </div>
            <div style={{ gridColumn: '8 / span 3' }}>
              <p className="ol-kicker" style={{ color: 'var(--gold)', marginBottom: '24px' }}>Localização</p>
              <p className="ol-body-col" style={{ fontSize: '1rem', opacity: 0.7, lineHeight: '1.6', margin: 0 }}>
                {d.endereco || 'Atendimento Online'}
              </p>
              <p className="ol-kicker" style={{ color: 'var(--gold)', marginTop: '40px', marginBottom: '24px' }}>Disponibilidade</p>
              <p className="ol-body-col" style={{ fontSize: '1rem', opacity: 0.7, lineHeight: '1.6', margin: 0 }}>
                Segunda a Sexta<br />{d.modalidade === 'online' ? 'Somente Online' : d.modalidade === 'presencial' ? 'Somente Presencial' : 'Presencial e Online'}
              </p>
            </div>
            <div style={{ gridColumn: '11 / span 2' }}>
              <p className="ol-kicker" style={{ color: 'var(--gold)', marginBottom: '24px' }}>Acesso</p>
              <ul className="ol-body-col" style={{ fontSize: '1rem', opacity: 0.7, listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '12px' }}><a href="#especialidades" className="no-underline text-inherit hover:text-[var(--gold)] transition-colors">Especialidades</a></li>
                <li style={{ marginBottom: '12px' }}><a href="#metodo" className="no-underline text-inherit hover:text-[var(--gold)] transition-colors">Método</a></li>
                <li style={{ marginBottom: '12px' }}><a href="#sobre" className="no-underline text-inherit hover:text-[var(--gold)] transition-colors">Sobre</a></li>
                <li><a href="#duvidas" className="no-underline text-inherit hover:text-[var(--gold)] transition-colors">Dúvidas</a></li>
              </ul>
            </div>
          </div>
          <div className="ol-gold-rule ol-w-full" style={{ marginTop: '96px', marginBottom: '40px', opacity: 0.3 }}></div>
          <div className="ol-flex" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
            <div className="ol-flex" style={{ flexDirection: 'column', gap: '4px' }}>
              <p className="ol-display" style={{ fontSize: '1.5rem', tracking: '-0.02em', color: '#EFE8DC', margin: 0 }}>{d.name}</p>
              <p className="ol-kicker" style={{ fontSize: '8px', opacity: 0.4, margin: 0 }}>{d.title} · {d.crp} · {d.modalidade}</p>
            </div>
            <p className="ol-kicker" style={{ fontSize: '10px', opacity: 0.5, margin: 0 }}>© 2026 Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
