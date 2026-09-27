import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/app/Toast";
import * as authApi from "@/lib/api/auth";
import type { TwoFactorSetupResponse } from "@/lib/api/auth";
import * as verificationApi from "@/lib/api/verification";
import {
  FACE_DOCUMENT_TYPES,
  type LivenessSession,
  type VerificationDocument,
  type VerificationDocumentType,
  type VerificationOverview,
} from "@/lib/api/verification";
import { ApiError } from "@/lib/api/errors";
import { Icon } from "@/app/icons";
import { MeBrand } from "@/app/MeLogo";
import { Card, Chip, Field, GhostButton, PrimaryButton, SectionTitle, TextInput } from "@/app/ui";
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

  const status = credentialing?.approvalStatus ?? "PENDING";
  const precisaDeDoisFatores =
    status === "APPROVED" && credentialing?.twoFactorEnabled === false;

  // Overview de verificação: dirige o fluxo guiado (documentos/biometria/enviar).
  // Não é necessário quando já está aprovado (falta só o 2FA).
  const [overview, setOverview] = useState<VerificationOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(!precisaDeDoisFatores);

  const reloadOverview = useCallback(async () => {
    try {
      setOverview(await verificationApi.getVerification());
    } catch {
      setOverview(null); // sem overview -> cai no comportamento por status
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    if (precisaDeDoisFatores) {
      setLoadingOverview(false);
      return;
    }
    void reloadOverview();
  }, [precisaDeDoisFatores, reloadOverview]);

  const handleCheckAgain = useCallback(async () => {
    setChecking(true);
    try {
      const c = await refreshCredentialing();
      await reloadOverview();
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
  }, [navigate, refreshCredentialing, reloadOverview, toast]);

  // Enviado para análise: recarrega overview + credenciamento e mostra "Em análise".
  const handleSubmitted = useCallback(async () => {
    await reloadOverview();
    await refreshCredentialing().catch(() => {});
  }, [reloadOverview, refreshCredentialing]);

  // Credenciado: nada a fazer aqui.
  if (credentialing?.canPractice) return <Navigate to="/" replace />;

  const submitted = Boolean(overview?.locked || overview?.submittedAt);

  function renderContent() {
    if (precisaDeDoisFatores) {
      return (
        <AtivarDoisFatores
          onActivated={async () => {
            const c = await refreshCredentialing();
            if (c.canPractice) navigate("/", { replace: true });
          }}
        />
      );
    }

    if (loadingOverview) return <Carregando />;

    if (status === "REJECTED") {
      return (
        <>
          <Recusado reason={credentialing?.approvalReason ?? overview?.approvalReason ?? null} />
          {overview && !overview.locked && (
            <div style={{ marginTop: 16 }}>
              <VerificationFlow
                overview={overview}
                onReload={reloadOverview}
                onSubmitted={handleSubmitted}
                redo
              />
            </div>
          )}
        </>
      );
    }

    if (overview && submitted) {
      return (
        <EmAnalise
          doctorName={doctor?.fullName ?? ""}
          crm={doctor?.crm ?? ""}
          crmUf={doctor?.councilUf ?? credentialing?.crmUf ?? null}
          council={doctor?.council}
          councilNumber={doctor?.councilNumber}
          checking={checking}
          onCheckAgain={handleCheckAgain}
        />
      );
    }

    if (overview) {
      return (
        <VerificationFlow overview={overview} onReload={reloadOverview} onSubmitted={handleSubmitted} />
      );
    }

    // Fallback (overview indisponível): estado por status.
    return (
      <EmAnalise
        doctorName={doctor?.fullName ?? ""}
        crm={doctor?.crm ?? ""}
        crmUf={doctor?.councilUf ?? credentialing?.crmUf ?? null}
        council={doctor?.council}
        councilNumber={doctor?.councilNumber}
        checking={checking}
        onCheckAgain={handleCheckAgain}
      />
    );
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

        {renderContent()}

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

function Carregando() {
  return (
    <Card padding={28}>
      <p style={{ margin: 0, fontSize: 14, color: color.textMuted }}>Carregando sua verificação…</p>
    </Card>
  );
}

// ---------------------------------------------------------------- em análise

function EmAnalise({
  doctorName,
  crm,
  crmUf,
  council,
  councilNumber,
  checking,
  onCheckAgain,
}: {
  doctorName: string;
  crm: string;
  crmUf: string | null;
  council?: string;
  councilNumber?: string;
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

      <Resumo
        doctorName={doctorName}
        crm={crm}
        crmUf={crmUf}
        council={council}
        councilNumber={councilNumber}
      />

      <Passos
        items={[
          { label: "Cadastro enviado", done: true },
          { label: "Análise do registro no conselho", done: false, current: true },
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
  councilNumber,
}: {
  doctorName: string;
  crm: string;
  crmUf: string | null;
  council?: string;
  councilNumber?: string;
}) {
  const registro = councilNumber ?? crm;
  const registroValor = registro ? `${registro}${crmUf ? ` / ${crmUf}` : ""}` : "—";
  const linhas: Array<[string, string]> = [
    ["Nome", doctorName || "—"],
    [council ?? "Registro", registroValor],
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
            {s.done && <Icon name="check" size={13} />}
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
        Se você acha que houve um engano ou quer corrigir alguma informação, fale
        com o suporte em{" "}
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

// --------------------------------------------------------- fluxo de verificação

/**
 * Fluxo guiado de credenciamento real: enviar documentos, fazer a prova de vida
 * e mandar para análise. Dirigido pelo overview do backend (não crava regras no
 * front). `redo` = reabertura após recusa.
 */
function VerificationFlow({
  overview,
  onReload,
  onSubmitted,
  redo,
}: {
  overview: VerificationOverview;
  onReload: () => Promise<void>;
  onSubmitted: () => Promise<void>;
  redo?: boolean;
}) {
  const { toast } = useToast();
  const [busyDoc, setBusyDoc] = useState<VerificationDocumentType | null>(null);
  const [consent, setConsent] = useState(overview.biometricConsentGiven);
  const [session, setSession] = useState<LivenessSession | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requiredDone = overview.documents
    .filter((d) => d.required)
    .every((d) => d.uploaded);

  // Passo atual, derivado do overview.
  const stage: "documentos" | "biometria" | "enviar" | "analise" =
    overview.submittedAt || overview.locked
      ? "analise"
      : overview.readyToSubmit
        ? "enviar"
        : requiredDone
          ? "biometria"
          : "documentos";

  async function upload(type: VerificationDocumentType, file: File) {
    setBusyDoc(type);
    try {
      await verificationApi.uploadVerificationDocument(type, file);
      toast("Documento enviado.");
      await onReload();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível enviar o documento.",
        "err",
      );
    } finally {
      setBusyDoc(null);
    }
  }

  async function startLive() {
    if (!consent) {
      toast("Marque o consentimento biométrico para continuar.", "err");
      return;
    }
    setLiveBusy(true);
    try {
      setSession(await verificationApi.startLiveness(consent));
      toast("Sessão de prova de vida iniciada.");
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível iniciar a prova de vida.",
        "err",
      );
    } finally {
      setLiveBusy(false);
    }
  }

  async function completeLive() {
    if (!session) return;
    setLiveBusy(true);
    try {
      // >>> PRODUÇÃO: é AQUI, entre iniciar e concluir, que entra a captura
      //     biométrica por câmera do provedor externo (SDK): prova de vida +
      //     match facial contra os documentos de rosto enviados. Só depois de a
      //     captura passar chamamos o complete. Em DEV o provedor é MOCK e o
      //     complete já aprova (desde que COUNCIL_CARD_FRONT e ID_DOCUMENT_FRONT
      //     tenham sido enviados).
      await verificationApi.completeLiveness(session.id);
      toast("Prova de vida concluída.");
      setSession(null);
      await onReload();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível concluir a prova de vida.",
        "err",
      );
    } finally {
      setLiveBusy(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      await verificationApi.submitVerification();
      toast("Cadastro enviado para análise.");
      await onSubmitted();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível enviar para análise.",
        "err",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding={28}>
      <Chip
        label={redo ? "Corrigir e reenviar" : "Verificação do cadastro"}
        bg={color.warnSoft}
        fg={color.warn}
      />
      <h1
        style={{
          margin: "16px 0 10px",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-.6px",
          lineHeight: 1.25,
        }}
      >
        Conclua a verificação para liberar o painel
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
        Envie seus documentos e faça a prova de vida. Depois é só mandar para a
        análise da equipe M.E Saúde.
      </p>

      <Passos
        items={[
          { label: "Documentos", done: requiredDone, current: stage === "documentos" },
          { label: "Prova de vida", done: overview.faceVerified, current: stage === "biometria" },
          { label: "Enviar para análise", done: false, current: stage === "enviar" },
          { label: "Em análise", done: false, current: stage === "analise" },
          { label: "Aprovado", done: false },
        ]}
      />

      {/* Documentos */}
      <div style={{ marginTop: 26 }}>
        <SectionTitle>Documentos</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {overview.documents.map((doc) => (
            <DocRow
              key={doc.type}
              doc={doc}
              busy={busyDoc === doc.type}
              onFile={(f) => void upload(doc.type, f)}
            />
          ))}
        </div>
      </div>

      {/* Biometria */}
      <div style={{ marginTop: 26 }}>
        <SectionTitle>Prova de vida (biometria)</SectionTitle>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: color.textMuted, lineHeight: 1.7 }}>
          A captura por câmera é feita no app/produção pelo provedor de biometria.
          Aqui no painel de desenvolvimento a validação é simulada: inicie e conclua.
        </p>

        {overview.faceVerified ? (
          <Chip label="Prova de vida concluída" bg={color.tealSoft} fg={color.teal} />
        ) : !session ? (
          <>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                fontSize: 13,
                color: color.text,
                lineHeight: 1.6,
                marginBottom: 14,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, flex: "none", accentColor: color.primary }}
              />
              <span>
                Autorizo o uso dos meus dados biométricos (imagem facial) para a
                verificação de identidade, conforme a política de privacidade.
              </span>
            </label>
            <PrimaryButton onClick={startLive} disabled={liveBusy || !consent}>
              {liveBusy ? "Iniciando…" : "Iniciar prova de vida"}
            </PrimaryButton>
          </>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                padding: "12px 14px",
                background: color.muted,
                border: `1px solid ${color.border}`,
                borderRadius: radius.control,
                fontSize: 13,
                color: color.textMuted,
                lineHeight: 1.6,
              }}
            >
              Sessão iniciada ({session.provider}). No app a câmera abriria agora
              para a captura; aqui é só concluir para simular a aprovação.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <PrimaryButton onClick={completeLive} disabled={liveBusy}>
                {liveBusy ? "Concluindo…" : "Concluir prova de vida"}
              </PrimaryButton>
              <GhostButton onClick={() => setSession(null)} disabled={liveBusy}>
                Cancelar
              </GhostButton>
            </div>
          </div>
        )}
      </div>

      {/* Enviar */}
      <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1px solid ${color.border}` }}>
        <SectionTitle>Enviar para análise</SectionTitle>
        {!overview.readyToSubmit && overview.missing.length > 0 && (
          <p style={{ margin: "0 0 14px", fontSize: 13, color: color.textMuted, lineHeight: 1.7 }}>
            Ainda falta: {overview.missing.join(", ")}.
          </p>
        )}
        <PrimaryButton onClick={submit} disabled={!overview.readyToSubmit || submitting}>
          {submitting ? "Enviando…" : "Enviar para análise"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

function DocRow({
  doc,
  busy,
  onFile,
}: {
  doc: VerificationDocument;
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = FACE_DOCUMENT_TYPES.has(doc.type)
    ? "image/jpeg,image/png"
    : "image/jpeg,image/png,application/pdf";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: color.muted,
        border: `1px solid ${doc.uploaded ? color.tealSoftBorder : color.border}`,
        borderRadius: radius.control,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{doc.label}</span>
          {doc.uploaded ? (
            <Chip label="Enviado" bg={color.tealSoft} fg={color.teal} />
          ) : doc.required ? (
            <Chip label="Obrigatório" bg={color.warnSoft} fg={color.warn} />
          ) : (
            <Chip label="Opcional" bg={color.muted} fg={color.textMuted} />
          )}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: color.textMuted }}>
          {doc.uploaded
            ? [
                doc.uploadedAt ? `Enviado em ${formatDate(doc.uploadedAt)}` : "Enviado",
                formatBytes(doc.sizeBytes),
              ]
                .filter(Boolean)
                .join(" · ")
            : FACE_DOCUMENT_TYPES.has(doc.type)
              ? "Foto nítida (JPG ou PNG)."
              : "JPG, PNG ou PDF."}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.currentTarget.value = ""; // permite reenviar o mesmo arquivo
          if (f) onFile(f);
        }}
      />
      <GhostButton onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? "Enviando…" : doc.uploaded ? "Substituir" : "Enviar"}
      </GhostButton>
    </div>
  );
}

function formatBytes(n: number | null): string {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}
