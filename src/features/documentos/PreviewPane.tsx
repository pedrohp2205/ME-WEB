import type { DocumentPreview } from "@/lib/api/medicalDocuments";
import { color, radius } from "@/theme/tokens";

/**
 * Renderiza cada via do preview em um iframe isolado (sandbox sem scripts),
 * para exibir o HTML do backend com segurança.
 */
export function PreviewPane({ copies }: { copies: DocumentPreview[] }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {copies.map((c, i) => (
        <div
          key={i}
          style={{
            border: `1px solid ${color.border}`,
            borderRadius: radius.control,
            overflow: "hidden",
            background: color.surface,
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: `1px solid ${color.border}`,
              background: color.muted,
              fontSize: 12,
              fontWeight: 600,
              color: color.textMuted,
            }}
          >
            {c.copyLabel}
          </div>
          <iframe
            title={c.copyLabel || `Via ${i + 1}`}
            sandbox=""
            srcDoc={c.bodyHtml}
            style={{ width: "100%", height: 420, border: "none", background: "#fff" }}
          />
        </div>
      ))}
    </div>
  );
}
