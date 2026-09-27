import { color } from "@/theme/tokens";
import { Icon } from "@/app/icons";

/** Mesmo critério de senha usado no cadastro do médico. */
export const PASSWORD_RULES: Array<{ label: string; ok: (s: string) => boolean }> = [
  { label: "Pelo menos 8 caracteres", ok: (s) => s.length >= 8 },
  { label: "Uma letra maiúscula", ok: (s) => /[A-Z]/.test(s) },
  { label: "Uma letra minúscula", ok: (s) => /[a-z]/.test(s) },
  { label: "Um número", ok: (s) => /\d/.test(s) },
  {
    label: "Um caractere especial",
    ok: (s) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s),
  },
];

export function passwordProblem(s: string): string {
  const falha = PASSWORD_RULES.find((r) => !r.ok(s));
  return falha ? `A senha precisa de: ${falha.label.toLowerCase()}.` : "";
}

/** Checklist visual das regras (verde quando cumprida). */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.ok(value);
        return (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: ok ? color.teal : color.textFaint,
            }}
          >
            <span
              style={{ width: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              {ok ? <Icon name="check" size={12} /> : "•"}
            </span>
            {r.label}
          </div>
        );
      })}
    </div>
  );
}
