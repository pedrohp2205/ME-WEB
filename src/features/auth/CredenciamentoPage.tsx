import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/app/Toast";
import * as authApi from "@/lib/api/auth";
import type { TwoFactorSetupResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getVerification, type VerificationResponse } from "@/lib/api/verification";
import { VerificacaoCadastro } from "@/features/verificacao/VerificacaoCadastro";
import { MeBrand } from "@/app/MeLogo";
import { Card, Chip, Field, GhostButton, PrimaryButton, TextInput } from "@/app/ui";
import { color, radius } from "@/theme/tokens";

/**
 * Sala de espera do credenciamento. É onde para o médico que entrou mas ainda
 * não pode atender: cadastro em análise, cadastro recusado ou 2FA pendente.
 * A guarda <RequireApproved> manda todo mundo para cá até `canPractice`.
 */
export function CredenciamentoPage() {
  const { doctor, credentialing, refreshCredentialing, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [verification, setVerification] = useState<VerificationResponse | null>(null);

  const loadVerification = useCallback(async () => {
    try {
      setVerification(await getVerification());
    } catch {
      setVerification(null);
    }
  }, []);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  // Credenciado: nada a fazer aqui.
  if (credentialing?.canPractice) return <Navigate to="/" replace />;

  async function handleCheckAgain() {
    setChecking(true);
    try {
      const c = await refreshCredentialing();
      if (c.canPractice) {
        toast("Cadastro aprovado. Bem-vindo!");
        navigate("/", { replace: true });
      } else if (c.approvalStatus === "PENDING") {
        toast("Seu cadastro continua em análise.");
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível verificar.", "err");
    } finally {
      setChecking(false);
    }
  }

  const status = credentialing?.approvalStatus ?? "PENDING";
  const precisaDeDoisFatores =
    status === "APPROVED" && credentialing?.twoFactorEnabled === false;
  const precisaVerificar = status !== "APPROVED" && verification !== null && !verification.locked;

  async function handleSubmitted() {
    await refreshCredentialing();
    await loadVerification();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: color.appBg,
        color: color.text,
        fontFamily: "Poppins, sans-serif",
        padding: "40px 20px 64px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ marginBottom: 32 }}>
          <MeBrand height={40} />
        </div>

        {status === "REJECTED" && <Recusado reason={credentialing?.approvalReason ?? null} />}

        {precisaVerificar && verification && (
          <div style={{ marginTop: status === "REJECTED" ? 16 : 0 }}>
            <VerificacaoCadastro
              verification={verification}
              onChange={setVerification}
              onSubmitted={handleSubmitted}
            />
          </div>
        )}

        {status === "PENDING" && !precisaVerificar && (
          <EmAnalise
            doctorName={doctor?.fullName ?? ""}
            crm={doctor?.crm ?? ""}
            crmUf={credentialing?.crmUf ?? null}
            council={credentialing?.council ?? "CRM"}
            checking={checking}
            onCheckAgain={handleCheckAgain}
          />
        )}

        {precisaDeDoisFatores && (
          <AtivarDoisFatores
            onActivated={async () => {
              const c = await refreshCredentialing();
              if (c.canPractice) navigate("/", { replace: true });
            }}
          />
        )}

        <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => void logout()}
            style={{
              border: "none",
              background: "none",
              color: color.textMuted,
              fontSize: 13,
              textDecoration: "underline",
              cursor: "pointer",
              padding: "6px 0",
            }}
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- em análise

function EmAnalise({
  doctorName,
  crm,
  crmUf,
  council,
  checking,
  onCheckAgain,
}: {
  doctorName: string;
  crm: string;
  crmUf: string | null;
  council: string;
  checking: boolean;
  onCheckAgain: () => void;
}) {
  return (
    <Card padding={28}>
      <Chip label="Em análise" bg={color.warnSoft} fg={color.warn} />
      <h1
        style={{
          margin: "16px 0 10px",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-.6px",
          lineHeight: 1.25,
        }}
      >
        Seu cadastro ainda não foi aprovado
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
        Recebemos seus dados e a equipe M.E Saúde está conferindo seu registro no
        conselho. Assim que a análise terminar você recebe um e-mail e o painel
        libera automaticamente — não é preciso se cadastrar de novo.
      </p>

      <Resumo doctorName={doctorName} crm={crm} crmUf={crmUf} council={council} />

      <Passos
        items={[
          { label: "Cadastro, documentos e prova de vida enviados", done: true },
          { label: `Análise do ${council} pela equipe`, done: false, current: true },
          { label: "Acesso liberado ao painel", done: false },
        ]}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
        <PrimaryButton onClick={onCheckAgain} disabled={checking}>
          {checking ? "Verificando…" : "Verificar novamente"}
        </PrimaryButton>
      </div>

      <p style={{ margin: "18px 0 0", fontSize: 12, color: color.textFaint, lineHeight: 1.6 }}>
        Dúvidas ou correção de dados: fale com o suporte em{" "}
        <a href="mailto:suporte@mesaude.com" style={{ color: color.primary }}>
          suporte@mesaude.com
        </a>
        .
      </p>
    </Card>
  );
}

function Resumo({
  doctorName,
  crm,
  crmUf,
  council,
}: {
  doctorName: string;
  crm: string;
  crmUf: string | null;
  council: string;
}) {
  const linhas: Array<[string, string]> = [
    ["Nome", doctorName || "—"],
    [council, crm ? `${crm}${crmUf ? ` / ${crmUf}` : ""}` : "—"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        padding: "14px 16px",
        background: color.muted,
        border: `1px solid ${color.border}`,
        borderRadius: radius.control,
      }}
    >
      {linhas.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12, color: color.textMuted }}>{k}</span>
          <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function Passos({
  items,
}: {
  items: Array<{ label: string; done: boolean; current?: boolean }>;
}) {
  return (
    <ol style={{ listStyle: "none", margin: "20px 0 0", padding: 0, display: "grid", gap: 12 }}>
      {items.map((s) => (
        <li key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 22,
              height: 22,
              flex: "none",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 600,
              color: s.done ? "#fff" : s.current ? color.warn : color.textFaint,
              background: s.done ? color.teal : s.current ? color.warnSoft : color.muted,
              border: `1px solid ${
                s.done ? color.teal : s.current ? color.warnSoftBorder : color.border
              }`,
            }}
          >
            {s.done ? "✓" : ""}
          </span>
          <span
            style={{
              fontSize: 13,
              color: s.done || s.current ? color.text : color.textFaint,
              fontWeight: s.current ? 500 : 400,
            }}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ------------------------------------------------------------------ recusado

function Recusado({ reason }: { reason: string | null }) {
  return (
    <Card padding={28}>
      <Chip label="Não aprovado" bg={color.dangerSoft} fg={color.danger} />
      <h1
        style={{
          margin: "16px 0 10px",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-.6px",
          lineHeight: 1.25,
        }}
      >
        Seu cadastro não foi aprovado
      </h1>
      <p style={{ margin: "0 0 18px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
        A equipe M.E Saúde analisou seus dados e não liberou o acesso ao painel.
      </p>

      {reason && (
        <div
          style={{
            padding: "14px 16px",
            background: color.dangerSoft,
            border: `1px solid ${color.dangerSoft}`,
            borderRadius: radius.control,
            fontSize: 13,
            lineHeight: 1.6,
            color: color.text,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: color.danger, marginBottom: 6 }}>
            Motivo informado
          </div>
          {reason}
        </div>
      )}

      <p style={{ margin: "18px 0 0", fontSize: 13, color: color.textMuted, lineHeight: 1.7 }}>
        Corrija os documentos abaixo e envie de novo para uma nova análise. Se
        tiver dúvidas, fale com o suporte em{" "}
        <a href="mailto:suporte@mesaude.com" style={{ color: color.primary }}>
          suporte@mesaude.com
        </a>
        .
      </p>
    </Card>
  );
}

// --------------------------------------------------------------------- 2FA

function AtivarDoisFatores({ onActivated }: { onActivated: () => Promise<void> }) {
  const { toast } = useToast();
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      setSetup(await authApi.setupTwoFactor());
      setCode("");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível iniciar o 2FA.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!/^\d{6}$/.test(code)) {
      toast("O código deve ter 6 dígitos.", "err");
      return;
    }
    setBusy(true);
    try {
      await authApi.activateTwoFactor(code);
      toast("Verificação em duas etapas ativada.");
      await onActivated();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Código inválido. Tente novamente.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding={28}>
      <Chip label="Cadastro aprovado" bg={color.tealSoft} fg={color.teal} />
      <h1
        style={{
          margin: "16px 0 10px",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-.6px",
          lineHeight: 1.25,
        }}
      >
        Falta ativar a verificação em duas etapas
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
        O painel lida com prontuário e documentos assinados, então o acesso exige
        um segundo fator. Use um app autenticador (Google Authenticator, Authy) e
        confirme o código para liberar o painel.
      </p>

      {!setup ? (
        <PrimaryButton onClick={start} disabled={busy}>
          {busy ? "Iniciando…" : "Ativar agora"}
        </PrimaryButton>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Segredo (chave manual)">
            <div style={monoBoxStyle}>{setup.secret}</div>
          </Field>
          <Field label="URL otpauth">
            <div style={{ ...monoBoxStyle, fontSize: 12, color: color.textMuted }}>
              {setup.otpauthUri}
            </div>
          </Field>
          <Field label="Código de 6 dígitos">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              style={{
                height: 52,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 8,
                textAlign: "center",
                maxWidth: 220,
              }}
            />
          </Field>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <PrimaryButton onClick={confirm} disabled={busy}>
              {busy ? "Ativando…" : "Confirmar e entrar"}
            </PrimaryButton>
            <GhostButton onClick={() => setSetup(null)} disabled={busy}>
              Cancelar
            </GhostButton>
          </div>
        </div>
      )}
    </Card>
  );
}

const monoBoxStyle: React.CSSProperties = {
  padding: "12px 14px",
  border: `1px solid ${color.border}`,
  borderRadius: radius.control,
  background: color.muted,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 15,
  letterSpacing: 1,
  wordBreak: "break-all",
};
