import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { Field, PrimaryButton, TextInput } from "@/app/ui";
import { color, radius } from "@/theme/tokens";
import { AuthShell, AuthLink } from "./AuthShell";
import { PasswordChecklist, passwordProblem } from "./passwordRules";

export function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errPass, setErrPass] = useState("");
  const [errConfirm, setErrConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [tokenError, setTokenError] = useState(false); // sugere pedir novo link
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const p = passwordProblem(password);
    const c = confirm !== password ? "As senhas não conferem." : "";
    setErrPass(p);
    setErrConfirm(c);
    setFormError("");
    setTokenError(false);
    if (p || c) return;

    setBusy(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError) {
        // 422 = token inválido/expirado/já usado; 400 = senha fraca (validação).
        setFormError(e.message);
        if (e.isBusinessRule) setTokenError(true);
      } else {
        setFormError("Não foi possível redefinir a senha. Tente novamente.");
      }
    } finally {
      setBusy(false);
    }
  }

  // Sem token na URL — link incompleto/quebrado.
  if (!token) {
    return (
      <AuthShell artHeading="Crie uma nova senha e volte ao seu painel.">
        <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
          Link inválido ou incompleto
        </h1>
        <p style={{ margin: "0 0 22px", color: color.textMuted, fontSize: 14, lineHeight: 1.7 }}>
          Este link de redefinição não veio completo. Peça um novo link para redefinir sua senha.
        </p>
        <PrimaryButton onClick={() => navigate("/esqueci-senha")} style={{ width: "100%" }}>
          Pedir um novo link
        </PrimaryButton>
        <div style={{ marginTop: 20, fontSize: 13, textAlign: "center" }}>
          <AuthLink onClick={() => navigate("/login")}>Voltar ao login</AuthLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell artHeading="Crie uma nova senha e volte ao seu painel.">
      {done ? (
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
            Tudo certo
          </span>
          <h1 style={{ margin: "16px 0 10px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
            Senha redefinida com sucesso
          </h1>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
            Sua senha foi atualizada. Agora é só entrar no painel com a nova senha.
          </p>
          <PrimaryButton onClick={() => navigate("/login", { replace: true })} style={{ width: "100%" }}>
            Ir para o login
          </PrimaryButton>
        </div>
      ) : (
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
            Redefinir senha
          </h1>
          <p style={{ margin: "0 0 24px", color: color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Escolha uma nova senha para a sua conta.
          </p>

          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Nova senha">
              <TextInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errPass && (
                <div style={{ fontSize: 12, color: color.danger, marginTop: 6 }}>{errPass}</div>
              )}
              <PasswordChecklist value={password} />
            </Field>
            <Field label="Confirmar nova senha">
              <TextInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && void submit()}
              />
              {errConfirm && (
                <div style={{ fontSize: 12, color: color.danger, marginTop: 6 }}>{errConfirm}</div>
              )}
            </Field>
          </div>

          {formError && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 12px",
                background: color.dangerSoft,
                borderRadius: radius.controlSm,
                fontSize: 13,
                color: color.danger,
                lineHeight: 1.5,
              }}
            >
              {formError}
              {tokenError && (
                <div style={{ marginTop: 8 }}>
                  <AuthLink onClick={() => navigate("/esqueci-senha")}>Pedir um novo link</AuthLink>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <PrimaryButton onClick={() => void submit()} disabled={busy} style={{ width: "100%" }}>
              {busy ? "Redefinindo…" : "Redefinir senha"}
            </PrimaryButton>
          </div>

          <div style={{ marginTop: 20, fontSize: 13, textAlign: "center" }}>
            <AuthLink onClick={() => navigate("/login")}>Voltar ao login</AuthLink>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
