import { useCallback, useRef, useState } from "react";
import {
  completeLiveness,
  getVerification,
  startLiveness,
  submitVerification,
  uploadDocument,
  type VerificationDocument,
  type VerificationResponse,
} from "@/lib/api/verification";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/Toast";
import { Modal } from "@/app/Modal";
import { Card, Chip, GhostButton, PrimaryButton } from "@/app/ui";
import { color, radius } from "@/theme/tokens";
import { LivenessCapture } from "./LivenessCapture";
import { QrHandoff } from "./QrHandoff";

type FaceMode = "computer" | "phone" | null;

export function VerificacaoCadastro({
  verification,
  onChange,
  onSubmitted,
}: {
  verification: VerificationResponse;
  onChange: (v: VerificationResponse) => void;
  onSubmitted: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [faceMode, setFaceMode] = useState<FaceMode>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFaceVerified = useCallback(() => {
    setFaceMode(null);
    toast("Prova de vida concluída.");
    getVerification()
      .then(onChange)
      .catch(() => undefined);
  }, [onChange, toast]);

  async function submit() {
    setSubmitting(true);
    try {
      onChange(await submitVerification());
      toast("Documentos enviados para análise.");
      await onSubmitted();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível enviar.", "err");
    } finally {
      setSubmitting(false);
    }
  }

  const required = verification.documents.filter((d) => d.required);
  const optional = verification.documents.filter((d) => !d.required);

  return (
    <Card padding={28}>
      <Chip label="Falta pouco" bg={color.warnSoft} fg={color.warn} />
      <h1 style={{ margin: "16px 0 10px", fontSize: 26, fontWeight: 600, letterSpacing: "-.6px", lineHeight: 1.25 }}>
        Confirme a sua identidade
      </h1>
      <p style={{ margin: "0 0 22px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
        Envie as fotos dos seus documentos e faça a prova de vida. A equipe M.E Saúde compara o seu rosto com
        a foto dos documentos antes de liberar o painel.
      </p>

      <Etapa numero={1} titulo="Documentos">
        <div style={{ display: "grid", gap: 10 }}>
          {required.map((d) => (
            <DocumentoItem key={d.type} documento={d} onUploaded={onChange} />
          ))}
          {optional.length > 0 && (
            <div style={{ fontSize: 12, color: color.textFaint, margin: "6px 0 -2px" }}>Opcionais</div>
          )}
          {optional.map((d) => (
            <DocumentoItem key={d.type} documento={d} onUploaded={onChange} />
          ))}
        </div>
      </Etapa>

      <Etapa numero={2} titulo="Prova de vida">
        {verification.faceVerified ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <Chip label="Concluída" bg={color.tealSoft} fg={color.teal} />
            <span style={{ color: color.textMuted }}>Rosto verificado.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: color.textMuted, lineHeight: 1.7 }}>
              Leva menos de um minuto. Escolha onde fazer:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <PrimaryButton onClick={() => setFaceMode("computer")}>Usar a câmera deste computador</PrimaryButton>
              <GhostButton onClick={() => setFaceMode("phone")}>Fazer pelo celular (QR code)</GhostButton>
            </div>
            {verification.lastFaceVerification?.status === "FAILED" && (
              <div style={{ fontSize: 12, color: color.danger }}>
                A última tentativa não foi aprovada. Tente de novo com mais luz e o rosto centralizado.
              </div>
            )}
          </div>
        )}
      </Etapa>

      <Etapa numero={3} titulo="Enviar para análise" ultima>
        {verification.missing.length > 0 && (
          <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 13, color: color.textMuted, lineHeight: 1.8 }}>
            {verification.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <PrimaryButton onClick={submit} disabled={!verification.readyToSubmit || submitting}>
          {submitting ? "Enviando…" : "Enviar para análise"}
        </PrimaryButton>
      </Etapa>

      {faceMode === "computer" && (
        <Modal title="Prova de vida" eyebrow="Câmera deste computador" onClose={() => setFaceMode(null)} maxWidth={640}>
          <LivenessCapture
            consentAlreadyGiven={verification.biometricConsentGiven}
            start={startLiveness}
            complete={completeLiveness}
            onFinished={onFaceVerified}
          />
        </Modal>
      )}

      {faceMode === "phone" && (
        <Modal title="Prova de vida pelo celular" eyebrow="Leia o QR code" onClose={() => setFaceMode(null)} maxWidth={480}>
          <QrHandoff onVerified={onFaceVerified} />
        </Modal>
      )}
    </Card>
  );
}

function Etapa({
  numero,
  titulo,
  ultima,
  children,
}: {
  numero: number;
  titulo: string;
  ultima?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: "18px 0",
        borderTop: `1px solid ${color.border}`,
        borderBottom: ultima ? "none" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 600,
            background: color.primarySoft,
            color: color.primary,
          }}
        >
          {numero}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{titulo}</span>
      </div>
      {children}
    </section>
  );
}

function DocumentoItem({
  documento,
  onUploaded,
}: {
  documento: VerificationDocument;
  onUploaded: (v: VerificationResponse) => void;
}) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onlyImage = documento.type === "COUNCIL_CARD_FRONT" || documento.type === "ID_DOCUMENT_FRONT";

  async function send(file: File) {
    setBusy(true);
    try {
      onUploaded(await uploadDocument(documento.type, file));
      toast(`${documento.label} enviado.`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível enviar o arquivo.", "err");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        border: `1px solid ${color.border}`,
        borderRadius: radius.control,
        background: documento.uploaded ? color.tealSoft : color.muted,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {documento.label}
          {documento.required && <span style={{ color: color.primary }}> *</span>}
        </div>
        <div style={{ fontSize: 12, color: color.textMuted, marginTop: 2 }}>
          {documento.uploaded
            ? "Enviado"
            : onlyImage
              ? "Foto JPG ou PNG, até 5 MB, com o rosto visível"
              : "JPG, PNG ou PDF, até 10 MB"}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={onlyImage ? "image/jpeg,image/png" : "image/jpeg,image/png,application/pdf"}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void send(file);
        }}
      />
      <GhostButton onClick={() => input.current?.click()} disabled={busy} style={{ height: 38, padding: "0 16px" }}>
        {busy ? "Enviando…" : documento.uploaded ? "Trocar" : "Enviar"}
      </GhostButton>
    </div>
  );
}
