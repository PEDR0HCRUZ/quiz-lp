// Novo onboarding em quiz de selecionáveis (substitui o chat). Uma pergunta
// por tela, escolha única auto-avança, múltipla espera "Continuar". Segue o
// design-system Avence (tokens abaixo). Este componente SÓ coleta as respostas
// e persiste um rascunho local; ao terminar chama onComplete(answers). O
// e-mail/OTP, publicação e tela de sucesso são ligados no App (fase seguinte).
//
// answers montado aqui (chaves alinhadas com buildSiteFromAnswers):
//   nome, titulo, especialidade[], abordagem, crp{uf,num}, foto{url,nome,w,h},
//   logo{url,nome}, modalidade, endereco, publico[], tom,
//   themeStyle{theme,colorScheme}, bio, preco{valor,mostrar}, whatsapp, instagram
import { useEffect, useRef, useState } from "react";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME } from "../colorSchemes.js";

/* ---------- tokens ---------- */
const T = {
  cream: "#F7F3EC", creamDeep: "#EFE8DC", paper: "#FFFFFF",
  ink: "#2A2622", inkSoft: "#6B635A", inkFaint: "#A79E92",
  sage: "#5E7361", sageSoft: "#DCE4DA", clay: "#B7784F",
  danger: "#A8443A", line: "#DDD4C6",
};
const DISPLAY = "'Fraunces', Georgia, serif";
const BODY = "'Inter', system-ui, sans-serif";
const DRAFT_KEY = "psipage_quiz_draft_v1";

/* ---------- dados das opções ---------- */
const TITULOS = [
  { v: "psicologa", l: "Psicóloga", d: "O mais correto tecnicamente" },
  { v: "psicologo", l: "Psicólogo" },
  { v: "dra", l: "Dra.", d: "Comum, mas não obrigatório" },
  { v: "nenhum", l: "Só o meu nome", d: "Sem título nenhum" },
];
const ESPECIALIDADES = ["Ansiedade", "Depressão", "Relacionamentos", "Luto", "Trauma", "Burnout", "Autoestima", "Maternidade", "TDAH"];
const ABORDAGENS = ["Psicanálise", "TCC", "Humanista / Gestalt", "Sistêmica", "Analítica (junguiana)", "ACT", "Comportamental", "Fenomenológica", "Outra"];
const MODALIDADES = [
  { v: "online", l: "Só online", d: "Atendimento por vídeo" },
  { v: "presencial", l: "Só presencial", d: "Consultório físico" },
  { v: "hibrido", l: "Híbrido", d: "Os dois formatos" },
];
const PUBLICOS = ["Adultos", "Casais", "Adolescentes", "Crianças", "Famílias", "Empresas"];
const TONS = [
  { v: "acolhedor", l: "Acolhedor e humano", d: "Palavras do dia a dia, nenhum jargão" },
  { v: "sobrio", l: "Sóbrio e clínico", d: "Método, critério, o que esperar" },
  { v: "moderno", l: "Moderno e leve", d: "Direto, rápido, feito para o celular" },
  { v: "sofisticado", l: "Sofisticado e discreto", d: "Poucas palavras, muito espaço" },
];
const TEMAS = [
  { v: "classic", l: "Clássico", d: "Serifada elegante, atemporal" },
  { v: "editorial", l: "Autoral", d: "Editorial e expressivo" },
];
// 24 conselhos regionais de psicologia (01ª a 24ª). Antes só ia até 12.
const CRP_UFS = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, "0"));

/* ---------- passos (a ordem do quiz) ---------- */
const STEPS = [
  { key: "nome", type: "text", title: "Como você se chama?", hint: "É o nome que vai aparecer no topo do site.", label: "Nome completo", placeholder: "Mariana Silva" },
  { key: "titulo", type: "single", title: "Como quer ser chamada no site?", hint: "Dá para mudar isso depois, a qualquer momento.", options: TITULOS },
  { key: "especialidade", type: "chips", title: "Qual é a sua especialidade?", hint: "Escolha quantas fizerem sentido — são elas que dizem para quem o site fala.", options: ESPECIALIDADES },
  { key: "abordagem", type: "cards", title: "Qual a sua abordagem?", hint: "Aparece na seção que explica como você trabalha.", options: ABORDAGENS },
  { key: "crp", type: "crp", title: "E o seu registro profissional?", hint: "O CFP exige que o CRP apareça no site. Ele vai no rodapé." },
  { key: "imagens", type: "photologo", title: "Sua foto e o seu logo", hint: "A foto é o que mais pesa na decisão de marcar. O logo é opcional." },
  { key: "modalidade", type: "single", title: "Como você atende?", hint: "Isso define se o site mostra endereço, videochamada, ou os dois.", options: MODALIDADES },
  { key: "endereco", type: "endereco", title: "Onde fica o seu consultório?", hint: "Opcional. Se deixar em branco, o site não mostra endereço nem mapa.", when: (a) => a.modalidade && a.modalidade !== "online" },
  { key: "publico", type: "chips", title: "Com quem você trabalha?", hint: "Selecione quantos fizerem sentido.", options: PUBLICOS },
  { key: "tom", type: "single", title: "Que tom o site deve ter?", hint: "É a primeira coisa que alguém sente ao abrir a página.", options: TONS },
  { key: "themeStyle", type: "themepalette", title: "O visual do site", hint: "Escolha o estilo e a paleta. Dá para trocar tudo depois." },
  { key: "bio", type: "area", title: "O que você diria para quem está em dúvida?", hint: "Escreva como se falasse com uma pessoa só. Duas ou três frases bastam.", label: "Sobre você", max: 320, optional: true, placeholder: "Ex.: Atendo pessoas que sentem que a ansiedade está tomando espaço demais. Meu trabalho é te ajudar a entender de onde ela vem — no seu tempo." },
  { key: "preco", type: "price", title: "Quanto custa uma sessão?", hint: "Você decide se isso aparece no site ou não." },
  { key: "contato", type: "contato", title: "Para onde vão os contatos?", hint: "O botão do site abre uma conversa no WhatsApp já com a mensagem escrita." },
];

/* ---------- estilos reaproveitados ---------- */
const inputBase = {
  width: "100%", font: "inherit", color: T.ink, background: T.paper,
  border: `1px solid ${T.line}`, borderRadius: 12, padding: "14px 15px",
  outline: "none", fontFamily: BODY, boxSizing: "border-box",
};
const legendStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 7, color: T.ink };
const helpStyle = { fontSize: 13, color: T.inkSoft, marginTop: 8 };

export default function OnboardingQuiz({ onComplete, initialAnswers }) {
  const [i, setI] = useState(0);
  const [a, setA] = useState(() => initialAnswers || loadDraft() || {});
  const [focusTick, setFocusTick] = useState(0);
  // espelho do estado mais recente pra `advance` ler as respostas atualizadas
  // (ex: a condicional do endereço depende da modalidade recém-escolhida).
  const aRef = useRef(a);
  aRef.current = a;

  const step = STEPS[i];
  const total = STEPS.length + 1; // + tela de e-mail (ligada no App depois)

  // persiste rascunho local (sem os dados binários de imagem, pra não estourar
  // a cota do localStorage — a imagem fica em memória; o rascunho no Supabase
  // guardará tudo na fase seguinte).
  useEffect(() => { saveDraft(a); }, [a]);

  const set = (key, val) => setA((prev) => ({ ...prev, [key]: val }));

  const visible = (idx) => { const s = STEPS[idx]; return !s.when || s.when(aRef.current); };
  const nextIndex = (from) => { let n = from + 1; while (n < STEPS.length && !visible(n)) n++; return n; };
  const prevIndex = (from) => { let n = from - 1; while (n > 0 && !visible(n)) n--; return n; };

  const advance = () => {
    const n = nextIndex(i);
    if (n < STEPS.length) { setI(n); setFocusTick((t) => t + 1); window.scrollTo({ top: 0 }); }
    else onComplete?.(aRef.current);
  };
  const back = () => { if (i > 0) { setI(prevIndex(i)); setFocusTick((t) => t + 1); window.scrollTo({ top: 0 }); } };

  const ok = gate(step, a);
  const progress = Math.round((i / total) * 100);

  return (
    <div style={{ minHeight: "100vh", background: T.cream, color: T.ink, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 18, display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.sage }} />PsiPage
        </div>
        <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 500 }}>
          {i + 1} / {total}
        </div>
      </header>
      <div style={{ height: 3, background: T.creamDeep }}>
        <div style={{ height: "100%", width: `${progress}%`, background: T.sage, transition: "width .45s cubic-bezier(.4,0,.2,1)" }} />
      </div>

      <main style={{ flex: 1, display: "flex", justifyContent: "center", padding: "44px 24px 72px" }}>
        <div style={{ width: "100%", maxWidth: 600 }} key={i}>
          <div style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: T.clay, fontWeight: 600, marginBottom: 13 }}>
            Passo {i + 1} de {total}
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(24px,4.2vw,32px)", lineHeight: 1.2, letterSpacing: "-.02em", marginBottom: 6 }}>{step.title}</h2>
          <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 22 }}>{step.hint}</p>

          <StepBody step={step} a={a} set={set} onEnter={() => ok && advance()} focusTick={focusTick} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
            <button type="button" onClick={back} style={{ ...ghostBtn, visibility: i === 0 ? "hidden" : "visible" }}>Voltar</button>
            <button type="button" onClick={advance} disabled={!ok} style={primaryBtn(ok)}>Continuar</button>
            {(step.optional || step.type === "crp" || step.type === "photologo" || step.type === "endereco") && (
              <button type="button" onClick={advance} style={skipBtn}>{skipLabel(step)}</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- corpo de cada tipo de passo ---------- */
function StepBody({ step, a, set, onEnter, focusTick }) {
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) setTimeout(() => inputRef.current.focus(), 60); }, [focusTick, step.key]);

  if (step.type === "text") {
    return (
      <div>
        <label style={legendStyle}>{step.label}</label>
        <input ref={inputRef} type="text" placeholder={step.placeholder} value={a[step.key] || ""}
          onChange={(e) => set(step.key, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()} style={inputBase} />
      </div>
    );
  }

  if (step.type === "single") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {step.options.map((o) => {
          const on = a[step.key] === o.v;
          return (
            <button key={o.v} type="button" onClick={() => set(step.key, o.v)} style={choiceStyle(on)}>
              <span style={markStyle(on, false)}>{on && <span style={markDot(false)} />}</span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <b style={{ display: "block", fontWeight: 500 }}>{o.l}</b>
                {o.d && <small style={{ display: "block", color: T.inkSoft, fontSize: 13, lineHeight: 1.45 }}>{o.d}</small>}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === "chips") {
    const sel = a[step.key] || [];
    const toggle = (o) => { const s = new Set(sel); s.has(o) ? s.delete(o) : s.add(o); set(step.key, [...s]); };
    return (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {step.options.map((o) => (
            <button key={o} type="button" onClick={() => toggle(o)} style={chipStyle(sel.includes(o))}>{o}</button>
          ))}
        </div>
        <p style={helpStyle}>{sel.length} selecionada{sel.length === 1 ? "" : "s"}</p>
      </div>
    );
  }

  if (step.type === "cards") {
    // escolha única em grade de 2 colunas (rótulos curtos, sem descrição) — pra
    // muitas opções não deixarem a página comprida como uma lista empilhada.
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {step.options.map((o) => {
          const val = typeof o === "string" ? o : o.v;
          const label = typeof o === "string" ? o : o.l;
          const on = a[step.key] === val;
          return (
            <button key={val} type="button" onClick={() => set(step.key, val)} style={{ ...choiceStyle(on), padding: "14px 16px", gap: 11 }}>
              <span style={markStyle(on)}>{on && <span style={markDot()} />}</span>
              <span style={{ flex: 1, textAlign: "left", fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === "crp") {
    const v = a.crp || { uf: "07", num: "" };
    return (
      <div>
        <span style={legendStyle}>Região</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 20 }}>
          {CRP_UFS.map((u) => (
            <button key={u} type="button" onClick={() => set("crp", { ...v, uf: u })} style={chipStyle(v.uf === u)}>{u}</button>
          ))}
        </div>
        <label style={legendStyle}>Número do registro</label>
        <div style={affixStyle}>
          <span style={affixPre}>CRP {v.uf}/</span>
          <input ref={inputRef} type="text" inputMode="numeric" placeholder="123456" value={v.num}
            onChange={(e) => set("crp", { uf: v.uf, num: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            onKeyDown={(e) => e.key === "Enter" && onEnter()} style={affixInput} />
        </div>
      </div>
    );
  }

  if (step.type === "photologo") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <ImagePicker label="Sua foto" hint="Do peito para cima, olhando para a câmera. JPG, PNG ou WEBP · até 5 MB · mín. 800×800." value={a.foto} minSize onPick={(img) => set("foto", img)} onClear={() => set("foto", null)} round />
        <ImagePicker label="Seu logo (opcional)" hint="Se tiver uma marca ou logotipo, envie aqui. PNG com fundo transparente fica melhor." value={a.logo} onPick={(img) => set("logo", img)} onClear={() => set("logo", null)} />
      </div>
    );
  }

  if (step.type === "endereco") {
    return (
      <div>
        <label style={legendStyle}>Endereço do consultório</label>
        <input ref={inputRef} type="text" placeholder="Rua Exemplo, 123 — Bairro, Cidade/UF" value={a.endereco || ""}
          onChange={(e) => set("endereco", e.target.value)} onKeyDown={(e) => e.key === "Enter" && onEnter()} style={inputBase} />
        <p style={helpStyle}>Pode pular. Sem endereço, o site não mostra mapa nem localização — bom se você atende presencial mas não quer expor o endereço.</p>
      </div>
    );
  }

  if (step.type === "themepalette") {
    const v = a.themeStyle || { theme: "classic", colorScheme: DEFAULT_COLOR_SCHEME };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <span style={legendStyle}>Estilo</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TEMAS.map((t) => {
              const on = v.theme === t.v;
              return (
                <button key={t.v} type="button" onClick={() => set("themeStyle", { ...v, theme: t.v })} style={choiceStyle(on)}>
                  <span style={markStyle(on, false)}>{on && <span style={markDot(false)} />}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>
                    <b style={{ display: "block", fontWeight: 500 }}>{t.l}</b>
                    <small style={{ display: "block", color: T.inkSoft, fontSize: 13 }}>{t.d}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span style={legendStyle}>Paleta de cores</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(COLOR_SCHEMES).map(([label, sc]) => {
              const on = v.colorScheme === label;
              return (
                <button key={label} type="button" onClick={() => set("themeStyle", { ...v, colorScheme: label })}
                  title={label}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px 9px 10px", borderRadius: 999, cursor: "pointer", background: on ? T.sageSoft : T.paper, border: `1px solid ${on ? T.sage : T.line}`, fontFamily: BODY, fontSize: 13, fontWeight: 500, color: T.ink }}>
                  <span style={{ display: "flex" }}>
                    {sc.swatches.map((c, k) => (
                      <span key={k} style={{ width: 16, height: 16, borderRadius: "50%", background: c, marginLeft: k ? -6 : 0, border: "1.5px solid #fff" }} />
                    ))}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step.type === "area") {
    const val = a[step.key] || "";
    return (
      <div>
        <label style={legendStyle}>{step.label}</label>
        <textarea ref={inputRef} maxLength={step.max} placeholder={step.placeholder} value={val}
          onChange={(e) => set(step.key, e.target.value)} style={{ ...inputBase, minHeight: 120, resize: "vertical", lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 12 }}>
          <span style={{ ...helpStyle, margin: 0 }}>Sem ideia? Pule — escrevemos um texto a partir das suas respostas e você ajusta depois no editor.</span>
          <span style={{ fontSize: 12, color: T.inkFaint, flex: "none" }}>{val.length} / {step.max}</span>
        </div>
      </div>
    );
  }

  if (step.type === "price") {
    const v = a.preco || { valor: 180, mostrar: true };
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ ...legendStyle, margin: 0 }}>Valor da sessão</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 21, color: T.sage }}>R$ {v.valor}</span>
        </div>
        <input type="range" min="80" max="500" step="10" value={v.valor}
          onChange={(e) => set("preco", { ...v, valor: +e.target.value })} style={{ width: "100%", accentColor: T.sage }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.inkFaint, marginTop: 9 }}>
          <span>R$ 80</span><span>R$ 500</span>
        </div>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, cursor: "pointer", border: `1px solid ${T.line}`, borderRadius: 12, background: T.paper, padding: "15px 17px", marginTop: 20 }}>
          <span>
            <b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Mostrar o valor no site</b>
            <small style={{ color: T.inkSoft, fontSize: 13 }}>Quem vê o preço antes chega mais decidido.</small>
          </span>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <input type="checkbox" checked={v.mostrar} onChange={(e) => set("preco", { ...v, mostrar: e.target.checked })} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
            <span style={{ width: 48, height: 28, borderRadius: 999, background: v.mostrar ? T.sage : T.line, padding: 3, transition: "background .18s" }}>
              <span style={{ display: "block", width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.16)", transform: v.mostrar ? "translateX(20px)" : "none", transition: "transform .18s" }} />
            </span>
          </span>
        </label>
      </div>
    );
  }

  if (step.type === "contato") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={legendStyle}>WhatsApp</label>
          <div style={affixStyle}>
            <span style={affixPre}>+55</span>
            <input ref={inputRef} type="tel" inputMode="numeric" placeholder="51 90000-0000" value={a.whatsapp || ""}
              onChange={(e) => set("whatsapp", maskPhone(e.target.value))} style={affixInput} />
          </div>
          <p style={helpStyle}>Mensagem pronta: “Olá! Vi seu site e gostaria de marcar uma sessão.”</p>
        </div>
        <div>
          <label style={legendStyle}>Instagram <span style={{ fontWeight: 400, color: T.inkFaint }}>opcional</span></label>
          <div style={affixStyle}>
            <span style={affixPre}>@</span>
            <input type="text" placeholder="seu.perfil" value={a.instagram || ""}
              onChange={(e) => set("instagram", e.target.value.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase())} style={affixInput} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ---------- input de imagem (foto/logo) ---------- */
function ImagePicker({ label, hint, value, onPick, onClear, minSize, round }) {
  const ref = useRef(null);
  const [err, setErr] = useState("");
  const handle = (file) => {
    setErr("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr(`Essa imagem tem ${(file.size / 1048576).toFixed(1)} MB — o limite é 5 MB.`); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (minSize && (img.width < 800 || img.height < 800)) {
        setErr(`Essa foto tem ${img.width}×${img.height}. Precisa de pelo menos 800×800 para não sair borrada.`);
        return;
      }
      const r = new FileReader();
      r.onload = () => onPick({ url: r.result, nome: file.name, w: img.width, h: img.height });
      r.readAsDataURL(file);
    };
    img.src = url;
  };
  if (value?.url) {
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "center", border: `1px solid ${T.line}`, borderRadius: 16, background: T.paper, padding: 14 }}>
        <div style={{ width: 84, height: 84, flex: "none", borderRadius: round ? "50%" : 12, background: `url(${value.url}) center/cover`, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ display: "block", fontWeight: 500, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value.nome}</b>
          {value.w && <small style={{ color: T.inkFaint, fontSize: 12.5 }}>{value.w}×{value.h}</small>}
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <button type="button" onClick={() => ref.current?.click()} style={{ background: "none", border: 0, font: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", color: T.sage }}>Trocar</button>
            <button type="button" onClick={onClear} style={{ background: "none", border: 0, font: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", color: T.danger }}>Remover</button>
          </div>
        </div>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => handle(e.target.files[0])} />
      </div>
    );
  }
  return (
    <div>
      <label style={{ position: "relative", display: "block", border: `1.5px dashed ${T.line}`, borderRadius: 16, background: T.paper, padding: "26px 22px", textAlign: "center", cursor: "pointer" }}>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={(e) => handle(e.target.files[0])} />
        <b style={{ display: "block", fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{label}</b>
        <small style={{ display: "block", color: T.inkSoft, fontSize: 13 }}>{hint}</small>
      </label>
      {err && <p style={{ fontSize: 13, color: T.danger, marginTop: 8 }}>{err}</p>}
    </div>
  );
}

/* ---------- helpers de estilo/estado ---------- */
const affixStyle = { display: "flex", border: `1px solid ${T.line}`, borderRadius: 12, background: T.paper, overflow: "hidden" };
const affixPre = { display: "grid", placeItems: "center", padding: "0 14px", background: T.cream, color: T.inkSoft, fontSize: 14, borderRight: `1px solid ${T.line}`, whiteSpace: "nowrap" };
const affixInput = { border: 0, borderRadius: 0, flex: 1, minWidth: 0, font: "inherit", padding: "14px 15px", outline: "none", fontFamily: BODY, background: "transparent", color: T.ink };

const choiceStyle = (on) => ({
  display: "flex", alignItems: "center", gap: 13, width: "100%",
  background: on ? T.sageSoft : T.paper, border: `1px solid ${on ? T.sage : T.line}`,
  borderRadius: 12, padding: "16px 18px", font: "inherit", color: "inherit", cursor: "pointer",
  fontFamily: BODY,
});
const markStyle = (on) => ({ width: 20, height: 20, flex: "none", border: `1.5px solid ${on ? T.sage : T.line}`, borderRadius: "50%", display: "grid", placeItems: "center", background: T.paper });
const markDot = () => ({ width: 9, height: 9, borderRadius: "50%", background: T.sage });
const chipStyle = (on) => ({
  font: "inherit", fontFamily: BODY, fontSize: 14, fontWeight: 500, cursor: "pointer",
  padding: "10px 18px", borderRadius: 999,
  border: `1px solid ${on ? T.sage : T.line}`, background: on ? T.sage : T.paper, color: on ? T.cream : T.ink,
});
const primaryBtn = (enabled) => ({
  font: "inherit", fontFamily: BODY, fontWeight: 500, borderRadius: 999, padding: "13px 26px",
  cursor: enabled ? "pointer" : "not-allowed", border: "1px solid transparent",
  background: T.ink, color: T.cream, opacity: enabled ? 1 : 0.35,
});
const ghostBtn = { font: "inherit", fontFamily: BODY, fontWeight: 500, borderRadius: 999, padding: "13px 8px", cursor: "pointer", border: "1px solid transparent", background: "transparent", color: T.inkSoft };
const skipBtn = { background: "none", border: 0, font: "inherit", fontFamily: BODY, fontSize: 13, color: T.inkSoft, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer", padding: "4px 0" };

function skipLabel(step) {
  if (step.type === "crp") return "Ainda não tenho registro (em formação)";
  if (step.type === "photologo") return "Adicionar imagens depois";
  if (step.type === "endereco") return "Não quero mostrar endereço";
  if (step.type === "area") return "Pular — escrevo um texto pra você";
  return "Pular";
}

function gate(step, a) {
  const v = a[step.key];
  switch (step.type) {
    case "text": return !!(v && v.trim().length > 1);
    case "single": return !!v;
    case "cards": return !!v;
    case "chips": return !!(v && v.length);
    case "crp": return !!(v && v.num && v.num.length >= 4);
    case "photologo": return true;
    case "endereco": return true;
    case "themepalette": return true;
    case "area": return true;
    case "price": return true;
    case "contato": return !!(a.whatsapp && a.whatsapp.replace(/\D/g, "").length >= 10);
    default: return true;
  }
}

function maskPhone(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* ---------- rascunho local (só campos não-binários) ---------- */
function saveDraft(a) {
  try {
    const slim = { ...a };
    if (slim.foto) slim.foto = { nome: slim.foto.nome }; // sem o dataURL
    if (slim.logo) slim.logo = { nome: slim.logo.nome };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(slim));
  } catch { /* cota cheia — ignora */ }
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    // imagens não sobrevivem no localStorage: descarta os stubs sem url
    if (a.foto && !a.foto.url) delete a.foto;
    if (a.logo && !a.logo.url) delete a.logo;
    return a;
  } catch { return null; }
}
