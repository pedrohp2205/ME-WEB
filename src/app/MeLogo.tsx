import { color } from "@/theme/tokens";

// Ícone oficial do "me": badge coral quadrado (1:1), cantos já arredondados e
// transparentes no próprio PNG. width = height.
const LOGO_SRC = "/me-icon.png";

/** Marca do ME — ícone quadrado "me" (badge coral). Proporção 1:1. */
export function MeLogo({ height = 32 }: { height?: number }) {
  return (
    <img
      src={LOGO_SRC}
      alt="ME"
      width={height}
      height={height}
      style={{ width: height, height, display: "block", objectFit: "contain" }}
    />
  );
}

/**
 * Lockup de marca: ícone quadrado + "Saúde" ("me Saúde"). Usado no login,
 * cadastro, credenciamento e no header do painel.
 */
export function MeBrand({
  height = 32,
  labelSize = 15,
  showLabel = true,
}: {
  height?: number;
  labelSize?: number;
  showLabel?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <MeLogo height={height} />
      {showLabel && (
        <span
          style={{
            fontSize: labelSize,
            fontWeight: 500,
            color: color.textMuted,
            letterSpacing: "-.2px",
            whiteSpace: "nowrap",
          }}
        >
          Saúde
        </span>
      )}
    </div>
  );
}
