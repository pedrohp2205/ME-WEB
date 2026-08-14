/** Centavos -> "180,00" (sem símbolo). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Centavos -> "R$ 180,00". */
export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return "R$ " + centsToInput(cents);
}

/**
 * Texto em reais ("180", "180,00", "1.234,50") -> centavos inteiros.
 * Retorna null se não for um número válido e positivo.
 */
export function inputToCents(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}
