import { useState } from "react";
import { useToast } from "@/app/Toast";
import * as authApi from "@/lib/api/auth";
import type { TwoFactorSetupResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { color, radius } from "@/theme/tokens";
import { Card, Field, GhostButton, PrimaryButton, SectionTitle, TextInput } from "@/app/ui";

type Mode = "idle" | "enabling" | "disabling";

function errMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

const codeInputStyle = {
  height: 52,
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: 8,
  textAlign: "center" as const,
  maxWidth: 220,
};

export function TwoFactorSection() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setMode("idle");
    setSetup(null);
    setCode("");
  }

  async function startEnable() {
    setBusy(true);
    try {
      const s = await authApi.setupTwoFactor();
      setSetup(s);
      setMode("enabling");
      setCode("");
    } catch (e) {
      toast(errMessage(e, "Não foi possível iniciar o 2FA."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    if (!/^\d{6}$/.test(code)) {
      toast("O código deve ter 6 dígitos.", "err");
      return;
    }
    setBusy(true);
    try {
      await authApi.activateTwoFactor(code);
      toast("Verificação em duas etapas ativada.");
      reset();
    } catch (e) {
      toast(errMessage(e, "Código inválido. Tente novamente."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    if (!/^\d{6}$/.test(code)) {
      toast("O código deve ter 6 dígitos.", "err");
      return;
    }
    setBusy(true);
    try {
      await authApi.disableTwoFactor(code);
      toast("Verificação em duas etapas desativada.");
      reset();
    } catch (e) {
      toast(errMessage(e, "Código inválido. Tente novamente."), "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Segurança · verificação em duas etapas</SectionTitle>

      {mode === "idle" && (
        <>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
            Proteja o acesso ao painel com um aplicativo autenticador (Google Authenticator,
            Authy, etc.).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <PrimaryButton onClick={startEnable} disabled={busy}>
              {busy ? "Iniciando…" : "Ativar 2FA"}
            </PrimaryButton>
            <GhostButton onClick={() => setMode("disabling")}>Desativar 2FA</GhostButton>
          </div>
        </>
      )}

      {mode === "enabling" && setup && (
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
            Adicione a chave abaixo no seu app autenticador (inserindo o segredo manualmente ou
            colando a URL <code>otpauth</code>) e digite o código gerado para confirmar.
          </p>

          <Field label="Segredo (chave manual)">
            <div
              style={{
                padding: "12px 14px",
                border: `1px solid ${color.border}`,
                borderRadius: radius.control,
                background: color.muted,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 15,
                letterSpacing: 2,
                wordBreak: "break-all",
              }}
            >
              {setup.secret}
            </div>
          </Field>

          <Field label="URL otpauth">
            <div
              style={{
                padding: "12px 14px",
                border: `1px solid ${color.border}`,
                borderRadius: radius.control,
                background: color.muted,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12,
                color: color.textMuted,
                wordBreak: "break-all",
              }}
            >
              {setup.otpauthUri}
            </div>
          </Field>

          <Field label="Código de 6 dígitos">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              style={codeInputStyle}
            />
          </Field>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <PrimaryButton onClick={confirmEnable} disabled={busy}>
              {busy ? "Ativando…" : "Confirmar e ativar"}
            </PrimaryButton>
            <GhostButton onClick={reset}>Cancelar</GhostButton>
          </div>
        </div>
      )}

      {mode === "disabling" && (
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
            Digite um código atual do seu app autenticador para desativar o 2FA.
          </p>
          <Field label="Código de 6 dígitos">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              style={codeInputStyle}
            />
          </Field>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <PrimaryButton onClick={confirmDisable} disabled={busy}>
              {busy ? "Desativando…" : "Desativar 2FA"}
            </PrimaryButton>
            <GhostButton onClick={reset}>Cancelar</GhostButton>
          </div>
        </div>
      )}
    </Card>
  );
}
