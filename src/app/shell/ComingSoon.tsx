import { color, radius } from "@/theme/tokens";
import { PageTitle } from "@/app/ui";

/** Placeholder das telas que serão ligadas nas próximas partes do plano. */
export function ComingSoon({
  title,
  part,
}: {
  title: string;
  part: string;
}) {
  return (
    <div style={{ animation: "up .25s ease-out" }}>
      <PageTitle title={title} />
      <div
        style={{
          padding: 40,
          textAlign: "center",
          border: `1px dashed ${color.border}`,
          borderRadius: radius.card,
          background: color.muted,
          color: color.textMuted,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Esta tela será conectada à M.E-API na <strong>{part}</strong> do plano de
        integração.
      </div>
    </div>
  );
}
