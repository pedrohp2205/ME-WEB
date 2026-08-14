import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/app/Modal";
import { Chip, GhostButton, PrimaryButton, TextInput } from "@/app/ui";
import { useToast } from "@/app/Toast";
import * as docsApi from "@/lib/api/medicalDocuments";
import type { MedicalDocument, DocumentPreview } from "@/lib/api/medicalDocuments";
import { ApiError } from "@/lib/api/errors";
import { docStatusChip, docStatusLabel, docTypeLabel, isSignedLike } from "@/lib/domain/document";
import { downloadBlob } from "@/lib/download";
import { dateBR, timeLocal } from "@/lib/format/datetime";
import { PreviewPane } from "./PreviewPane";
import { color, radius } from "@/theme/tokens";

function msg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}
function maskCpf(cpf: string | null): string {
  if (!cpf) return "";
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `***.***.${d.slice(6, 9)}-**` : cpf;
}

const POLL_INTERVAL = 1500;
const POLL_MAX = 20;
const SIGN_CONTEXT_KEY = "me.signContext";

export function DocumentDetailModal({
  document,
  onClose,
  onChanged,
}: {
  document: MedicalDocument;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const [doc, setDoc] = useState<MedicalDocument>(document);
  const [preview, setPreview] = useState<DocumentPreview[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let alive = true;
    docsApi
      .preview(doc.id)
      .then((p) => alive && setPreview(p))
      .catch((e) => alive && setPreviewError(msg(e, "Não foi possível carregar a pré-visualização.")));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [bg, fg] = docStatusChip(doc.status);
  const signed = isSignedLike(doc.status);
  const canSign = doc.status === "DRAFT" || doc.status === "AWAITING_SIGNATURE";
  const canCancel = doc.status !== "SIGNED" && doc.status !== "ISSUED" && doc.status !== "CANCELED";

  async function sign() {
    setBusy(true);
    try {
      const res = await docsApi.requestSignature(doc.id);
      if (res.requiresRedirectApproval && res.authorizationUrl) {
        sessionStorage.setItem(
          SIGN_CONTEXT_KEY,
          JSON.stringify({ appointmentId: doc.appointmentId, docId: doc.id }),
        );
        window.location.href = res.authorizationUrl;
        return;
      }
      setAwaiting(true);
      for (let i = 0; i < POLL_MAX; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        if (!mounted.current) return;
        let fresh: MedicalDocument;
        try {
          fresh = await docsApi.getById(doc.id);
        } catch {
          continue;
        }
        if (fresh.status === "SIGNED" || fresh.status === "ISSUED") {
          setDoc(fresh);
          setAwaiting(false);
          onChanged();
          toast("Documento assinado.");
          return;
        }
        if (fresh.status === "DRAFT" || fresh.status === "CANCELED") {
          setDoc(fresh);
          setAwaiting(false);
          onChanged();
          toast("A assinatura não foi concluída.", "err");
          return;
        }
      }
      setAwaiting(false);
      toast("Tempo de assinatura esgotado.", "err");
    } catch (e) {
      toast(msg(e, "Não foi possível assinar."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await docsApi.downloadFile(doc.id);
      downloadBlob(blob, `documento-${doc.validationCode}.pdf`);
      toast("PDF baixado.");
    } catch (e) {
      toast(msg(e, "Não foi possível baixar o PDF."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel() {
    setBusy(true);
    try {
      const updated = await docsApi.cancel(doc.id, reason);
      setDoc(updated);
      setCancelling(false);
      onChanged();
      toast("Documento cancelado.", "err");
    } catch (e) {
      toast(msg(e, "Não foi possível cancelar."), "err");
    } finally {
      setBusy(false);
    }
  }

  const sig = doc.signature;

  const footer = (
    <>
      <GhostButton
        onClick={() => navigate(`/verificar?codigo=${encodeURIComponent(doc.validationCode)}`)}
      >
        Verificação pública
      </GhostButton>
      {canCancel && !cancelling && (
        <GhostButton onClick={() => setCancelling(true)} style={{ color: color.danger }}>
          Cancelar documento
        </GhostButton>
      )}
      {canSign && !awaiting && (
        <PrimaryButton onClick={sign} disabled={busy}>
          {busy ? "Assinando…" : "Assinar"}
        </PrimaryButton>
      )}
      {signed && (
        <PrimaryButton onClick={download} disabled={busy}>
          {busy ? "Baixando…" : "Baixar PDF"}
        </PrimaryButton>
      )}
    </>
  );

  return (
    <Modal
      eyebrow={docStatusLabel(doc.status)}
      title={docTypeLabel(doc.documentType)}
      onClose={onClose}
      maxWidth={720}
      footer={footer}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Chip label={docStatusLabel(doc.status)} bg={bg} fg={fg} />
        <span style={{ fontSize: 12, color: color.textMuted }}>
          Código: <strong style={{ letterSpacing: 1 }}>{doc.validationCode}</strong>
        </span>
      </div>

      {sig && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: radius.control,
            background: color.tealSoft,
            color: color.teal,
            fontSize: 12.5,
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Assinado · {sig.provider}
          {sig.certificateCpf ? ` · ${maskCpf(sig.certificateCpf)}` : ""} ·{" "}
          {dateBR(sig.signedAt)} {timeLocal(sig.signedAt)}
        </div>
      )}

      {doc.status === "CANCELED" && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: radius.control,
            background: color.dangerSoft,
            color: color.danger,
            fontSize: 12.5,
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Cancelado{doc.cancelReason ? ` · ${doc.cancelReason}` : ""}.
        </div>
      )}

      {awaiting && (
        <div style={{ fontSize: 13, color: color.warn, marginBottom: 16 }}>
          Assinando… aguarde alguns segundos.
        </div>
      )}

      {cancelling && (
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            borderRadius: radius.control,
            background: color.muted,
            border: `1px solid ${color.border}`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, color: color.text }}>Cancelar este documento?</div>
          <TextInput
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
          />
          <div style={{ display: "flex", gap: 10 }}>
            <PrimaryButton onClick={confirmCancel} disabled={busy}>
              {busy ? "Cancelando…" : "Confirmar cancelamento"}
            </PrimaryButton>
            <GhostButton onClick={() => setCancelling(false)} disabled={busy}>
              Voltar
            </GhostButton>
          </div>
        </div>
      )}

      {previewError && <div style={{ fontSize: 13, color: color.danger }}>{previewError}</div>}
      {!preview && !previewError && (
        <div style={{ fontSize: 13, color: color.textMuted }}>Carregando pré-visualização…</div>
      )}
      {preview && <PreviewPane copies={preview} />}
    </Modal>
  );
}
