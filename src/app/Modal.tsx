import type { ReactNode } from "react";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { color } from "@/theme/tokens";

/** Modal responsivo — bottom-sheet no mobile, centralizado no desktop. */
export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  maxWidth = 700,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  const isMobile = useWindowWidth() < 768;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(33,30,28,.42)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : "28px 20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: isMobile ? "94vh" : "88vh",
          background: color.surface,
          borderRadius: isMobile ? "28px 28px 0 0" : 24,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(33,30,28,0.24)",
          animation: "up .22s ease-out",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 22px",
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow && (
              <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 500 }}>
                {eyebrow}
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.3px", marginTop: eyebrow ? 2 : 0 }}>
              {title}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 38,
              height: 38,
              flex: "none",
              border: `1px solid ${color.border}`,
              borderRadius: 999,
              background: color.surface,
              fontSize: 16,
              color: color.textMuted,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>{children}</div>

        {footer && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              padding: "16px 22px",
              borderTop: `1px solid ${color.border}`,
              justifyContent: "flex-end",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
