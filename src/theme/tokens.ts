// Design tokens — fonte da verdade extraída do protótipo "Painel do Medico ME.dc.html".
// NÃO redesenhe: estes valores são o visual aprovado. Reuse-os em todos os componentes.

export const color = {
  // superfícies
  appBg: "#FFFDFB",
  surface: "#FFFFFF",
  muted: "#FBF6F3",
  mutedAlt: "#F4EDE9",
  border: "#EFE8E3",

  // texto
  text: "#211E1C",
  textMuted: "#79716B",
  textFaint: "#B7ADA6",

  // primária (coral/vermelho)
  primary: "#EB5057",
  primaryHover: "#C23A45",
  primaryGradient: "linear-gradient(135deg,#EB5057,#F7826E)",
  primarySoft: "#FFECEA",
  primarySoftBorder: "#F8D7D3",

  // teal / sucesso
  teal: "#0E7E70",
  tealAlt: "#1EA896",
  tealSoft: "#E5F4F0",
  tealSoftBorder: "#C7E5DD",

  // atenção / warning
  warn: "#B45309",
  warnAlt: "#F59E0B",
  warnSoft: "#FEF6E7",
  warnSoftBorder: "#F6E1BC",

  // perigo
  danger: "#DC2626",
  dangerSoft: "#FEECEC",

  // escuro (botões secundários fortes)
  ink: "#211E1C",
  inkHover: "#3A3532",
} as const;

export const radius = {
  card: "24px",
  control: "16px",
  controlSm: "14px",
  pill: "999px",
} as const;

export const shadow = {
  card: "0 8px 24px rgba(33,30,28,0.08)",
  cardHover: "0 14px 30px rgba(33,30,28,0.1)",
  modal: "0 8px 24px rgba(33,30,28,0.24)",
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
