import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as docsApi from "@/lib/api/medicalDocuments";
import { color, radius, shadow } from "@/theme/tokens";
import { MeLogo } from "@/app/MeLogo";
import { GhostButton, PrimaryButton } from "@/app/ui";

const SIGN_CONTEXT_KEY = "me.signContext";

/**
 * Retorno da assinatura VIDaaS. O backend redireciona para
 * /document-signature/callback?status=signed|failed&documentId=…&reason=…
 * Mostramos sucesso/erro e voltamos ao atendimento do documento.
 */
export function SignatureCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const status = params.get("status") ?? "";
  const documentId = params.get("documentId");
  const reason = params.get("reason");
  const success = status === "signed";

  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    // Resolve o atendimento p/ o botão de voltar: pelo doc, ou pelo contexto salvo.
    let alive = true;
    (async () => {
      if (documentId) {
        try {
          const doc = await docsApi.getById(documentId);
          if (alive) setAppointmentId(doc.appointmentId);
          return;
        } catch {
          /* cai no fallback */
        }
      }
      try {
        const ctx = sessionStorage.getItem(SIGN_CONTEXT_KEY);
        if (ctx) {
          const parsed = JSON.parse(ctx) as { appointmentId?: string };
          if (alive && parsed.appointmentId) setAppointmentId(parsed.appointmentId);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [documentId]);

  function goBack() {
    sessionStorage.removeItem(SIGN_CONTEXT_KEY);
    navigate(appointmentId ? `/consultas/${appointmentId}` : "/documentos", { replace: true });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: color.muted,
        fontFamily: "Poppins, sans-serif",
        color: color.text,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: radius.card,
          padding: 28,
          boxShadow: shadow.card,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <MeLogo height={26} />
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 28,
            padding: "0 12px",
            borderRadius: 999,
            background: success ? color.tealSoft : color.dangerSoft,
            color: success ? color.teal : color.danger,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {success ? "Assinatura concluída" : "Assinatura não concluída"}
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 600, letterSpacing: "-.4px" }}>
          {success ? "Documento assinado" : "A assinatura foi interrompida"}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: color.textMuted, lineHeight: 1.6 }}>
          {success
            ? "O documento foi assinado com certificado ICP-Brasil. Você já pode baixar o PDF no atendimento."
            : `A autorização não foi concluída${reason ? ` (${reason})` : ""} e o documento voltou para rascunho. Você pode tentar assinar novamente.`}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
          <PrimaryButton onClick={goBack}>Voltar ao atendimento</PrimaryButton>
          <GhostButton onClick={() => navigate("/documentos", { replace: true })}>
            Ver Documentos
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
