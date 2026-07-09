// Paleta de cor do site publicado — independente do tema (Clássico/Autoral).
// Compartilhado entre App.jsx e ThemeEditorial.jsx (por isso é um módulo à
// parte: os dois arquivos já se importam um ao outro). Chave = label exibido
// no quiz (mesmo padrão de "tom", "abordagem" etc — o valor salvo em
// answers.colorScheme é o label em si, não um id à parte).
// Tons propositalmente pouco vibrantes: o nicho é psicologia, então
// evitamos cores "gritantes" e ficamos em verdes, marrons, azuis e
// terracota acinzentados/pastéis.
export const COLOR_SCHEMES = {
  "Sálvia": { swatches: ["#46614D", "#8FA895", "#EAEFE9"], accent: "#46614D", accentSoft: "#EAEFE9" },
  "Terracota": { swatches: ["#B5502D", "#D68F6C", "#F3E6DC"], accent: "#B5502D", accentSoft: "#F3E6DC" },
  "Azul acinzentado": { swatches: ["#4A6670", "#8CA8AF", "#E7EEF0"], accent: "#4A6670", accentSoft: "#E7EEF0" },
  "Areia": { swatches: ["#9C7A4E", "#C7AC81", "#F3ECE0"], accent: "#9C7A4E", accentSoft: "#F3ECE0" },
  "Lavanda suave": { swatches: ["#7A6B8A", "#AEA0BC", "#EFEAF3"], accent: "#7A6B8A", accentSoft: "#EFEAF3" },
  "Terra rosada": { swatches: ["#A6675C", "#CB9C93", "#F3E4E1"], accent: "#A6675C", accentSoft: "#F3E4E1" },
};
export const DEFAULT_COLOR_SCHEME = "Sálvia";

// escurece um hex em `amount` (0-1) — usado onde o tema Autoral precisa de
// uma variante mais escura do accent (ex: texto sobre fundo claro) e a
// paleta só define accent/accentSoft.
export const darken = (hex, amount = 0.25) => {
  const n = parseInt((hex || "").replace("#", ""), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};
