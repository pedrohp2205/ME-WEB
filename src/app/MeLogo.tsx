import { color } from "@/theme/tokens";

const LOGO_SRC = "/me-logo.png";
const ASPECT = 287 / 125; // dimensões reais do asset

/** Logo oficial do ME (wordmark "me" com o batimento no "e"). Asset real do app Flutter. */
export function MeLogo({ height = 32 }: { height?: number }) {
  return (
    <img
      src={LOGO_SRC}
      alt="ME"
      height={height}
      style={{ height, width: height * ASPECT, display: "block" }}
    />
  );
}

/**
 * Lockup de marca: logo + "Médico". Usado no cabeçalho do login, na sidebar e
 * no topbar. Espelha o "ME Médico" do protótipo com a logo real.
 */
export function MeBrand({
  height = 30,
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
          Médico
        </span>
      )}
    </div>
  );
}
