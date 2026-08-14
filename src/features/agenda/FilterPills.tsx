import { color } from "@/theme/tokens";

/** Linha de pílulas de filtro/aba — ativo em ink, inativos em branco. */
export function FilterPills({
  options,
  value,
  onChange,
  size = 40,
  labelOf,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  size?: number;
  labelOf?: (v: string) => string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              height: size,
              padding: "0 16px",
              border: `1px solid ${active ? color.ink : color.border}`,
              borderRadius: 999,
              background: active ? color.ink : color.surface,
              color: active ? "#fff" : color.textMuted,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .18s",
            }}
          >
            {labelOf ? labelOf(opt) : opt}
          </button>
        );
      })}
    </div>
  );
}
