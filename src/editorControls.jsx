// Controles de input do editor visual — portados do editor v1
// (avence-psi-quiz.jsx). Só as peças reaproveitáveis: estilo de input, label
// e o ListEditor (add/remove de itens {t,d} ou {q,a}). Cores vêm por props
// pra seguir a paleta do painel em vez de valores fixos.
import { Plus, Trash2 } from "lucide-react";

export const inputStyle = (C) => ({
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`,
  background: "#fff", fontSize: 14, color: C.ink, outline: "none", fontFamily: "Inter, sans-serif",
  boxSizing: "border-box",
});

export function Label({ children, C }) {
  return <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>{children}</div>;
}

// items: array de objetos. withDesc=true -> {t,d} (especialidades/benefícios);
// false -> {q,a} (faq). labels = [placeholder do título, placeholder da descrição].
export function ListEditor({ items, onChange, withDesc, labels, C }) {
  const set = (i, k, v) => onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const add = () => onChange([...(items || []), withDesc ? { t: "", d: "" } : { q: "", a: "" }]);
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  const [kt, kd] = withDesc ? ["t", "d"] : ["q", "a"];
  const inp = inputStyle(C);
  return (
    <div>
      {(items || []).map((it, i) => (
        <div key={i} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input value={it[kt] || ""} onChange={(e) => set(i, kt, e.target.value)} placeholder={labels[0]}
              style={{ ...inp, fontWeight: 600 }} />
            <button onClick={() => del(i)} aria-label="Remover"
              style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub }}>
              <Trash2 size={14} />
            </button>
          </div>
          <textarea value={it[kd] || ""} onChange={(e) => set(i, kd, e.target.value)} placeholder={labels[1]} rows={2}
            style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
        </div>
      ))}
      <button onClick={add}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, border: `1px dashed ${C.sage}`, background: C.sageSoft, color: C.sage, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        <Plus size={15} /> Adicionar
      </button>
    </div>
  );
}
