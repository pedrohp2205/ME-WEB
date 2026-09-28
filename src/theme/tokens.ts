// Design tokens — fonte da verdade do visual do painel. As CORES agora apontam
// para custom properties CSS (definidas em src/theme/global.css) que trocam por
// tema claro/escuro. Os nomes de chave são os mesmos de antes, então os call
// sites (color.surface, color.primary, …) continuam funcionando sem mudança.
// radius/shadow/font seguem iguais em estrutura (shadow também troca por tema).

export const color = {
  // superfícies
  appBg: "var(--color-appBg)",
  surface: "var(--color-surface)",
  muted: "var(--color-muted)",
  mutedAlt: "var(--color-mutedAlt)",
  border: "var(--color-border)",

  // texto
  text: "var(--color-text)",
  textMuted: "var(--color-textMuted)",
  textFaint: "var(--color-textFaint)",

  // primária (coral/vermelho) — preservada em ambos os temas
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primaryHover)",
  primaryGradient: "var(--color-primaryGradient)",
  primarySoft: "var(--color-primarySoft)",
  primarySoftBorder: "var(--color-primarySoftBorder)",

  // teal / sucesso
  teal: "var(--color-teal)",
  tealAlt: "var(--color-tealAlt)",
  tealSoft: "var(--color-tealSoft)",
  tealSoftBorder: "var(--color-tealSoftBorder)",

  // atenção / warning
  warn: "var(--color-warn)",
  warnAlt: "var(--color-warnAlt)",
  warnSoft: "var(--color-warnSoft)",
  warnSoftBorder: "var(--color-warnSoftBorder)",

  // perigo
  danger: "var(--color-danger)",
  dangerSoft: "var(--color-dangerSoft)",

  // escuro (botões secundários fortes)
  ink: "var(--color-ink)",
  inkHover: "var(--color-inkHover)",
} as const;

export const radius = {
  card: "24px",
  control: "16px",
  controlSm: "14px",
  pill: "999px",
} as const;

export const shadow = {
  card: "var(--shadow-card)",
  cardHover: "var(--shadow-cardHover)",
  modal: "var(--shadow-modal)",
} as const;

export const font = {
  family: "Poppins, sans-serif",
} as const;

// Chips de status — mapa exato do protótipo (fundo, texto).
export const statusChip: Record<string, [string, string]> = {
  Agendada: [color.warnSoft, color.warn],
  Confirmada: [color.tealSoft, color.teal],
  Concluída: [color.muted, color.text],
  Cancelada: [color.dangerSoft, color.danger],
  Rascunho: [color.muted, color.textMuted],
  "Aguardando assinatura": [color.warnSoft, color.warn],
  Assinado: [color.tealSoft, color.teal],
  Pendente: [color.warnSoft, color.warn],
  Aprovado: [color.tealSoft, color.teal],
  Negado: [color.dangerSoft, color.danger],
  Revogado: [color.muted, color.textMuted],
};

export function chipColors(status: string): [string, string] {
  return statusChip[status] ?? [color.muted, color.textMuted];
}
