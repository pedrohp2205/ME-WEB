/** Iniciais para avatares — ignora honoríficos (Dr., Dra.) e pega 2 letras. */
export function initials(fullName: string): string {
  const words = fullName
    .split(" ")
    .filter((w) => w.length > 1 && !w.includes("."));
  const source = words.length ? words : fullName.split(" ").filter(Boolean);
  return source
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Primeiro nome útil (ignora honorífico) — para saudações. */
export function firstName(fullName: string): string {
  const words = fullName.split(" ").filter((w) => w.length > 1 && !w.includes("."));
  return words[0] ?? fullName.split(" ")[0] ?? "";
}
