const TITLE_PREFIXES = /^(dra?\.?|doutora?)\s+/i;

export function slugify(name) {
  const base = (name || "")
    .trim()
    .replace(TITLE_PREFIXES, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacríticas do NFD)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "psi";
}

export function withSuffix(slug, n) {
  return n <= 1 ? slug : `${slug}-${n}`;
}
