import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAsync } from "@/lib/useAsync";
import { isIssuerComplete } from "@/lib/api/doctors";
import * as docsApi from "@/lib/api/medicalDocuments";
import { Card, Chip, PrimaryButton, SectionTitle } from "@/app/ui";
import { docStatusChip, docStatusLabel, docTypeLabel } from "@/lib/domain/document";
import { dateBR } from "@/lib/format/datetime";
import { EmitWizard } from "./emit/EmitWizard";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { color, radius } from "@/theme/tokens";

export function ConsultaDocuments({
  appointmentId,
  patientId,
  confirmed,
}: {
  appointmentId: string;
  patientId: string;
  confirmed: boolean;
}) {
  const { doctor } = useAuth();
  const issuerComplete = doctor ? isIssuerComplete(doctor) : false;

  const docs = useAsync(() => docsApi.listByAppointment(appointmentId), [appointmentId]);
  const [emitting, setEmitting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = docs.data ?? [];
  const open = list.find((d) => d.id === openId) ?? null;

  return (
    <Card>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <SectionTitle>Documentos desta consulta</SectionTitle>
        {confirmed && (
          <div style={{ marginLeft: "auto" }}>
            <PrimaryButton onClick={() => setEmitting(true)}>Emitir documento</PrimaryButton>
          </div>
        )}
      </div>

      {!confirmed && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: radius.control,
            background: color.warnSoft,
            border: `1px solid ${color.warnSoftBorder}`,
            fontSize: 13,
            color: color.warn,
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          A emissão de documentos fica disponível após o paciente confirmar a consulta.
        </div>
      )}

      {docs.loading && <div style={{ fontSize: 13, color: color.textMuted }}>Carregando…</div>}
      {docs.error && <div style={{ fontSize: 13, color: color.danger }}>{docs.error}</div>}

      {!docs.loading && !docs.error && (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((d) => {
            const [bg, fg] = docStatusChip(d.status);
            return (
              <button
                key={d.id}
                onClick={() => setOpenId(d.id)}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.control,
                  background: color.muted,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{docTypeLabel(d.documentType)}</span>
                <span style={{ fontSize: 12, color: color.textMuted }}>{dateBR(d.issuedAt)}</span>
                <span style={{ marginLeft: "auto" }}>
                  <Chip label={docStatusLabel(d.status)} bg={bg} fg={fg} />
                </span>
              </button>
            );
          })}
          {list.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                border: `1px dashed ${color.border}`,
                borderRadius: radius.control,
                fontSize: 13,
                color: color.textMuted,
              }}
            >
              Nenhum documento emitido nesta consulta.
            </div>
          )}
        </div>
      )}

      {emitting && (
        <EmitWizard
          appointmentId={appointmentId}
          patientId={patientId}
          issuerComplete={issuerComplete}
          onClose={() => setEmitting(false)}
          onIssued={docs.reload}
        />
      )}
      {open && (
        <DocumentDetailModal
          document={open}
          onClose={() => setOpenId(null)}
          onChanged={docs.reload}
        />
      )}
    </Card>
  );
}
