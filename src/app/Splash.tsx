import { color } from "@/theme/tokens";

/** Tela cheia de carregamento (validação de sessão, callbacks). */
export function Splash({ label = "Carregando…" }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: color.appBg,
        color: color.text,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          border: `3px solid ${color.primarySoft}`,
          borderTopColor: color.primary,
          animation: "spin .9s linear infinite",
        }}
      />
      <div style={{ fontSize: 14, color: color.textMuted }}>{label}</div>
    </div>
  );
}
