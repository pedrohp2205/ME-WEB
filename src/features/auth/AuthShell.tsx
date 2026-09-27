import type { ReactNode } from "react";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { MeBrand } from "@/app/MeLogo";
import { color } from "@/theme/tokens";

/**
 * Casca das telas de auth: mesmo split-screen do Login/Cadastro (formulário
 * centrado e estreito à direita + coluna de arte à esquerda no desktop).
 */
export function AuthShell({
  children,
  artHeading,
  maxWidth = 420,
}: {
  children: ReactNode;
  artHeading?: string;
  maxWidth?: number;
}) {
  const twoColumns = useWindowWidth() >= 1024;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: twoColumns ? "1fr 1fr" : "1fr",
        alignItems: "stretch",
        background: color.appBg,
        color: color.text,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          gridColumn: twoColumns ? 2 : "auto",
          gridRow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
        }}
      >
        <div style={{ width: "100%", maxWidth, animation: "up .3s ease-out" }}>
          <div style={{ marginBottom: 32 }}>
            <MeBrand height={44} showLabel={false} />
          </div>
          {children}
        </div>
      </div>

      {twoColumns && (
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            position: "relative",
            overflow: "hidden",
            background: color.appBg,
          }}
        >
          <img
            src="/login-illustration.png"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "bottom",
              display: "block",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 140,
              background:
                "linear-gradient(to left, #FFFDFB 0%, rgba(255,253,251,0.6) 45%, rgba(255,253,251,0) 100%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "44px 56px 0" }}>
            <div style={{ maxWidth: 420 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-.7px",
                  lineHeight: 1.22,
                  color: color.primary,
                }}
              >
                {artHeading ?? "Agenda, atendimento e documentos assinados em um só lugar."}
              </h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Link discreto (voltar ao login, pedir novo link, etc.). */
export function AuthLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "none",
        color: color.primary,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "underline",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
