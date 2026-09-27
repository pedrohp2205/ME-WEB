import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { Field, PrimaryButton, TextInput } from "@/app/ui";
import { color, radius } from "@/theme/tokens";
import { AuthShell, AuthLink } from "./AuthShell";

const NEUTRAL_SUCCESS =
  "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Verifique sua caixa de entrada.";

export function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErrEmail("Informe um e-mail válido.");
      return;
    }
    setErrEmail("");
    setFormError("");
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      // Mensagem SEMPRE neutra — não revela se a conta existe.
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError && e.isRateLimited) {
        setFormError(
          "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        );
      } else {
        setFormError(
          e instanceof ApiError ? e.message : "Não foi possível enviar agora. Tente novamente.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell artHeading="Recupere o acesso ao seu painel em poucos passos.">
      {sent ? (
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 26,
              padding: "0 12px",
              borderRadius: 999,
              background: color.tealSoft,
              color: color.teal,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            E-mail enviado
          </span>
          <h1 style={{ margin: "16px 0 10px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
            Verifique sua caixa de entrada
          </h1>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
            {NEUTRAL_SUCCESS}
          </p>
          <PrimaryButton onClick={() => navigate("/login")} style={{ width: "100%" }}>
            Voltar ao login
          </PrimaryButton>
        </div>
      ) : (
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
            Esqueci minha senha
          </h1>
          <p style={{ margin: "0 0 24px", color: color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
          </p>

          <Field label="E-mail">
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="voce@clinica.com.br"
              autoComplete="email"
              onKeyDown={(e) => e.key === "Enter" && void submit()}
            />
            {errEmail && (
              <div style={{ fontSize: 12, color: color.danger, marginTop: 6 }}>{errEmail}</div>
            )}
          </Field>

          {formError && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: color.dangerSoft,
                borderRadius: radius.controlSm,
                fontSize: 13,
                color: color.danger,
                lineHeight: 1.5,
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <PrimaryButton onClick={() => void submit()} disabled={busy} style={{ width: "100%" }}>
              {busy ? "Enviando…" : "Enviar link de redefinição"}
            </PrimaryButton>
          </div>

          <div style={{ marginTop: 20, fontSize: 13, color: color.textMuted, textAlign: "center" }}>
            <AuthLink onClick={() => navigate("/login")}>Voltar ao login</AuthLink>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
