const TITLE_PREFIXES = /^(dra?\.?|doutora?)\s+/i;

export function slugify(name) {
  const base = (name || "")
    .trim()
    .replace(TITLE_PREFIXES, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacríticas do NFD)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-") // mantém hífen e underline; resto vira hífen
    .replace(/-{2,}/g, "-") // colapsa hífens repetidos
    .replace(/^[-_]+|[-_]+$/g, ""); // apara separadores nas pontas
  return base || "psi";
}

// Sanitização "ao vivo" pro input do slug enquanto a pessoa digita: mantém
// letras, números, hífen e underline (inclusive no fim, pra dar pra digitar
// "meu-nome") e NÃO apara as pontas nem colapsa — isso fica pro slugify() no
// confirmar. É o que conserta o "não deixa digitar traço/underline" e o pulo
// de cursor ao editar a primeira letra (o transform só mexia no valor).
export function slugLive(v) {
  return (v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export function withSuffix(slug, n) {
  return n <= 1 ? slug : `${slug}-${n}`;
}

// Slug curto e aleatório pro site no trial (antes de pagar). No fluxo novo a
// pessoa só escolhe o slug bonito depois de assinar, no admin — até lá o site
// fica num endereço aleatório. Alfabeto sem caracteres ambíguos (0/o/1/l/i)
// pra não confundir na hora de digitar ou ditar o link.
const SAFE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export function randomSlug(len = 7) {
  const n = SAFE_ALPHABET.length;
  const bytes = (typeof crypto !== "undefined" && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint32Array(len))
    : Array.from({ length: len }, () => Math.floor(Math.random() * 2 ** 32));
  let s = "";
  for (let i = 0; i < len; i++) s += SAFE_ALPHABET[bytes[i] % n];
  return s;
}
