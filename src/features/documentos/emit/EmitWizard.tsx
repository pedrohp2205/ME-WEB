import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/app/Modal";
import { GhostButton, PrimaryButton, Field, Select } from "@/app/ui";
import { useToast } from "@/app/Toast";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as docsApi from "@/lib/api/medicalDocuments";
import * as templatesApi from "@/lib/api/documentTemplates";
import type { MedicalDocument, MedicalDocumentType, DocumentPreview } from "@/lib/api/medicalDocuments";
import type { DocumentTemplate } from "@/lib/api/documentTemplates";
import { ApiError } from "@/lib/api/errors";
import { DOCUMENT_TYPES, docTypeLabel, isControleEspecial } from "@/lib/domain/document";
import { downloadBlob } from "@/lib/download";
import { dateBR, timeLocal } from "@/lib/format/datetime";
import { PreviewPane } from "../PreviewPane";
import { DocumentSheet } from "./DocumentSheet";
import { blankForm, toContent, validate, type DocForm } from "./emitForm";
import { color, radius } from "@/theme/tokens";

function msg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}
function maskCpf(cpf: string | null): string {
  if (!cpf) return "";
  const d = cpf.replace(/\D/g, "");
  if (d.length === 11) return `***.***.${d.slice(6, 9)}-**`;
  return cpf;
}

const STEP_LABELS = ["Tipo", "Conteúdo", "Pré-visualização", "Assinatura"];
const POLL_INTERVAL = 1500;
const POLL_MAX = 20;
const SIGN_CONTEXT_KEY = "me.signContext";

type SignPhase = "idle" | "awaiting" | "signed" | "failed";

export function EmitWizard({
  appointmentId,
  patientId,
  issuerComplete,
  onClose,
  onIssued,
}: {
  appointmentId: string;
  patientId: string;
  issuerComplete: boolean;
  onClose: () => void;
  onIssued: () => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const twoCol = width >= 768 ? "repeat(2,minmax(0,1fr))" : "1fr";
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const [step, setStep] = useState(1);
  const [type, setType] = useState<MedicalDocumentType | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [form, setFormState] = useState<DocForm>(blankForm());
  const [docId, setDocId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DocumentPreview[] | null>(null);
  const [signPhase, setSignPhase] = useState<SignPhase>("idle");
  const [signedDoc, setSignedDoc] = useState<MedicalDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setForm = (patch: Partial<DocForm>) => setFormState((f) => ({ ...f, ...patch }));

  const blocked = !!type && isControleEspecial(type) && !issuerComplete;

  async function chooseType(t: MedicalDocumentType) {
    setType(t);
    setTemplateId(null);
    setError("");
    try {
      const list = await templatesApi.list(t);
      if (mounted.current) setTemplates(list);
    } catch {
      if (mounted.current) setTemplates([]);
    }
  }

  async function saveDraft(): Promise<string | null> {
    if (!type) return null;
    const content = toContent(type, form);
    if (docId) {
      await docsApi.updateContent(docId, { templateId, content });
      return docId;
    }
    const created = await docsApi.create({ appointmentId, documentType: type, templateId, content });
    setDocId(created.id);
    return created.id;
  }

  async function next() {
    setError("");
    if (step === 1) {
      if (!type) return setError("Escolha o tipo de documento.");
      return setStep(2);
    }
    if (step === 2) {
      if (!type) return;
      const v = validate(type, form);
      if (v) return setError(v);
      setBusy(true);
      try {
        const id = await saveDraft();
        if (!id) return;
        const p = await docsApi.preview(id);
        if (!mounted.current) return;
        setPreview(p);
        setStep(3);
        onIssued(); // rascunho já aparece na lista
      } catch (e) {
        setError(msg(e, "Não foi possível salvar o rascunho."));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 3) {
      return setStep(4);
    }
  }

  function back() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function startSignature() {
    if (!docId) return;
    setBusy(true);
    setError("");
    try {
      const res = await docsApi.requestSignature(docId);
      if (res.requiresRedirectApproval && res.authorizationUrl) {
        // guarda o contexto para o callback voltar ao atendimento
        sessionStorage.setItem(SIGN_CONTEXT_KEY, JSON.stringify({ appointmentId, docId }));
        window.location.href = res.authorizationUrl;
        return;
      }
      // provider mock → polling
      setSignPhase("awaiting");
      pollUntilSigned(docId);
    } catch (e) {
      setError(msg(e, "Não foi possível iniciar a assinatura."));
    } finally {
      setBusy(false);
    }
  }

  async function pollUntilSigned(id: string) {
    for (let i = 0; i < POLL_MAX; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      if (!mounted.current) return;
      let doc: MedicalDocument;
      try {
        doc = await docsApi.getById(id);
      } catch {
        continue;
      }
      if (doc.status === "SIGNED" || doc.status === "ISSUED") {
        setSignedDoc(doc);
        setSignPhase("signed");
        onIssued();
        toast("Documento assinado com certificado ICP-Brasil.");
        return;
      }
      if (doc.status === "DRAFT" || doc.status === "CANCELED") {
        setSignPhase("failed");
        onIssued();
        return;
      }
    }
    if (mounted.current) setSignPhase("failed");
  }

  async function download() {
    if (!docId) return;
    setBusy(true);
    try {
      const blob = await docsApi.downloadFile(docId);
      const code = signedDoc?.validationCode ?? docId;
      downloadBlob(blob, `documento-${code}.pdf`);
      toast("PDF baixado.");
    } catch (e) {
      toast(msg(e, "Não foi possível baixar o PDF."), "err");
    } finally {
      setBusy(false);
    }
  }

  // ── footer por etapa ──
  let footer: React.ReactNode = null;
  if (step < 4) {
    footer = (
      <>
        {step > 1 && <GhostButton onClick={back} disabled={busy}>Voltar</GhostButton>}
        {!(step === 2 && blocked) && (
          <PrimaryButton onClick={next} disabled={busy}>
            {busy ? "Salvando…" : step === 2 ? "Pré-visualizar" : "Continuar"}
          </PrimaryButton>
        )}
      </>
    );
  }

  return (
    <Modal
      eyebrow="Emitir documento"
      title={type ? docTypeLabel(type) : "Novo documento"}
      onClose={onClose}
      maxWidth={780}
      footer={footer}
    >
      <Stepper step={step} />

      {error && (
        <div style={{ marginBottom: 14, fontSize: 12.5, color: color.danger, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <TypeStep
          type={type}
          templates={templates}
          templateId={templateId}
          twoCol={twoCol}
          onChooseType={chooseType}
          onChooseTemplate={setTemplateId}
        />
      )}

      {step === 2 && type && (
        blocked ? (
          <IssuerBlock onGoPerfil={() => { onClose(); navigate("/perfil"); }} />
        ) : (
          <DocumentSheet type={type} form={form} setForm={setForm} patientId={patientId} />
        )
      )}

      {step === 3 && preview && <PreviewPane copies={preview} />}

      {step === 4 && (
        <SignatureStep
          phase={signPhase}
          busy={busy}
          signedDoc={signedDoc}
          onSign={startSignature}
          onDownload={download}
          onVerify={() =>
            navigate(`/verificar?codigo=${encodeURIComponent(signedDoc?.validationCode ?? "")}`)
          }
          onFinish={() => { onIssued(); onClose(); }}
        />
      )}
    </Modal>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, overflowX: "auto" }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: done ? color.teal : active ? color.primary : color.muted,
                color: step >= n ? "#fff" : color.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {n}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: active ? color.text : color.textMuted, whiteSpace: "nowrap" }}>
              {label}
            </span>
            {n < STEP_LABELS.length && <span style={{ width: 20, height: 1, background: color.border }} />}
          </div>
        );
      })}
    </div>
  );
}

function TypeStep({
  type,
  templates,
  templateId,
  twoCol,
  onChooseType,
  onChooseTemplate,
}: {
  type: MedicalDocumentType | null;
  templates: DocumentTemplate[];
  templateId: string | null;
  twoCol: string;
  onChooseType: (t: MedicalDocumentType) => void;
  onChooseTemplate: (id: string | null) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: color.textMuted, marginBottom: 12 }}>
        Escolha o tipo de documento
      </div>
      <div style={{ display: "grid", gridTemplateColumns: twoCol, gap: 10 }}>
        {DOCUMENT_TYPES.map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => onChooseType(t)}
              style={{
                textAlign: "left",
                padding: "16px 18px",
                border: `1px solid ${active ? color.primary : color.border}`,
                borderRadius: radius.control,
                background: active ? color.primarySoft : color.surface,
                color: active ? color.primary : color.text,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {docTypeLabel(t)}
            </button>
          );
        })}
      </div>

      {type && (
        <div style={{ marginTop: 22 }}>
          <Field label="Modelo (opcional)" hint="Deixe em branco para usar o padrão do sistema.">
            <Select
              value={templateId ?? ""}
              onChange={(e) => onChooseTemplate(e.target.value || null)}
            >
              <option value="">Padrão do sistema</option>
              {templates
                .filter((t) => t.id)
                .map((t) => (
                  <option key={t.id} value={t.id!}>
                    {t.name}
                    {t.isCustom ? "" : " (padrão)"}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      )}
    </div>
  );
}

function IssuerBlock({ onGoPerfil }: { onGoPerfil: () => void }) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: radius.card,
        background: color.primarySoft,
        border: `1px solid ${color.primarySoftBorder}`,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        Complete seus dados de emitente
      </div>
      <div style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.7, marginBottom: 18 }}>
        A receita de controle especial exige endereço profissional e telefone do emitente no
        documento (Portaria 344/98). Preencha no seu Perfil e volte para concluir a emissão.
      </div>
      <PrimaryButton onClick={onGoPerfil}>Completar perfil de emitente</PrimaryButton>
    </div>
  );
}

function SignatureStep({
  phase,
  busy,
  signedDoc,
  onSign,
  onDownload,
  onVerify,
  onFinish,
}: {
  phase: SignPhase;
  busy: boolean;
  signedDoc: MedicalDocument | null;
  onSign: () => void;
  onDownload: () => void;
  onVerify: () => void;
  onFinish: () => void;
}) {
  if (phase === "awaiting") {
    return (
      <div style={{ display: "grid", gap: 18, justifyItems: "center", textAlign: "center", padding: "20px 0" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            border: `3px solid ${color.primarySoft}`,
            borderTopColor: color.primary,
            animation: "spin .9s linear infinite",
          }}
        />
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Assinando…</div>
          <div style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.6, marginTop: 8, maxWidth: 400 }}>
            Concluindo a assinatura com o certificado em nuvem. Isto pode levar alguns segundos.
          </div>
        </div>
      </div>
    );
  }

  if (phase === "signed" && signedDoc) {
    const sig = signedDoc.signature;
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            padding: 20,
            border: `1px solid ${color.tealSoftBorder}`,
            borderRadius: radius.control,
            background: color.tealSoft,
          }}
        >
          <div style={{ fontSize: 12, color: color.teal, fontWeight: 600 }}>Assinado</div>
          <div style={{ fontSize: 12, color: color.teal, lineHeight: 1.7, marginTop: 8 }}>
            {sig ? (
              <>
                {sig.provider}
                {sig.certificateCpf ? ` · ${maskCpf(sig.certificateCpf)}` : ""}
                {` · ${dateBR(sig.signedAt)} ${timeLocal(sig.signedAt)}`}
              </>
            ) : (
              "Documento assinado."
            )}
          </div>
          <div style={{ fontSize: 12, color: color.teal, marginTop: 6 }}>
            Código de validação: <strong style={{ letterSpacing: 1 }}>{signedDoc.validationCode}</strong>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <PrimaryButton onClick={onDownload} disabled={busy}>
            {busy ? "Baixando…" : "Baixar PDF"}
          </PrimaryButton>
          <GhostButton onClick={onVerify}>Verificação pública</GhostButton>
          <GhostButton onClick={onFinish}>Concluir</GhostButton>
        </div>
      </div>
    );
  }

  // idle ou failed
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          padding: 20,
          border: `1px solid ${color.border}`,
          borderRadius: radius.control,
          background: color.muted,
        }}
      >
        <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 500 }}>Status atual</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Aguardando assinatura</div>
        <div style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.6, marginTop: 10 }}>
          A assinatura usa seu certificado ICP-Brasil em nuvem (VIDaaS). Em produção, você aprova
          a operação no app do certificado.
        </div>
      </div>
      {phase === "failed" && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: radius.control,
            background: color.dangerSoft,
            color: color.danger,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          A assinatura não foi concluída (expirou ou falhou) e o documento voltou para rascunho.
          Você pode tentar novamente.
        </div>
      )}
      <PrimaryButton onClick={onSign} disabled={busy} style={{ justifySelf: "start", height: 50, padding: "0 26px" }}>
        {busy ? "Iniciando…" : "Assinar com certificado em nuvem"}
      </PrimaryButton>
    </div>
  );
}
