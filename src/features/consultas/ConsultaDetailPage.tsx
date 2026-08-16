import { useNavigate, useParams } from "react-router-dom";
import { useAsync } from "@/lib/useAsync";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as appointmentsApi from "@/lib/api/appointments";
import {
  isTelemedicine,
  statusChip,
  statusLabel,
  typeLabel,
} from "@/lib/domain/appointment";
import { patientDisplayInitials, patientDisplayName } from "@/lib/format/patient";
import { dateBR, timeLocal } from "@/lib/format/datetime";
import { Card, Chip } from "@/app/ui";
import { ErrorBox } from "./ConsultasPage";
import { ConsultaDocuments } from "@/features/documentos/ConsultaDocuments";
import { SoapCard } from "./SoapCard";
import { EntrarNaSalaButton } from "@/features/teleconsulta/EntrarNaSalaButton";
import { color, radius } from "@/theme/tokens";

export function ConsultaDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const twoCol = width >= 768 ? "repeat(2,minmax(0,1fr))" : "1fr";

  const appt = useAsync(() => appointmentsApi.getById(id), [id]);

  if (appt.loading)
    return (
      <div
        style={{
          height: 240,
          borderRadius: radius.card,
          background: "linear-gradient(90deg,#F4EDE9,#FBF6F3,#F4EDE9)",
          backgroundSize: "200% 100%",
          animation: "sh 1.2s infinite",
        }}
      />
    );
  if (appt.error || !appt.data)
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <BackLink onClick={() => navigate("/consultas")} />
        <ErrorBox message={appt.error ?? "Consulta não encontrada."} onRetry={appt.reload} />
      </div>
    );

  const a = appt.data;
  const confirmed = !!a.confirmedAt;
  const [bg, fg] = statusChip(a);

  return (
    <div style={{ animation: "up .25s ease-out", display: "grid", gap: 16, maxWidth: 920 }}>
      <BackLink onClick={() => navigate("/consultas")} />

      {/* Cabeçalho */}
      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: color.muted,
              color: color.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {patientDisplayInitials(a.patientId, a.patientName)}
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: "block", fontSize: 20, fontWeight: 600, letterSpacing: "-.4px" }}>
              {patientDisplayName(a.patientId, a.patientName)}
            </span>
            <span style={{ display: "block", fontSize: 12, color: color.textFaint, marginTop: 3 }}>
              {a.patientName ? "nome autorizado por este paciente" : "este paciente não autorizou expor o nome"}
            </span>
          </span>
          <Chip label={statusLabel(a)} bg={bg} fg={fg} />
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 18,
            paddingTop: 18,
            borderTop: `1px solid ${color.border}`,
          }}
        >
          <Pill>{dateBR(a.startDatetime)}</Pill>
          <Pill>
            {timeLocal(a.startDatetime)}–{timeLocal(a.endDatetime)}
          </Pill>
          <Pill>{typeLabel(a.appointmentType)}</Pill>
          {isTelemedicine(a) && a.status === "SCHEDULED" && (
            <EntrarNaSalaButton appointmentId={a.id} />
          )}
        </div>
      </Card>

      {/* Trava de confirmação */}
      {!confirmed && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
            padding: "20px 22px",
            borderRadius: radius.card,
            background: color.warnSoft,
            border: `1px solid ${color.warnSoftBorder}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Aguardando o paciente confirmar este agendamento
            </div>
            <div style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
              O registro clínico (SOAP) e a emissão de documentos ficam disponíveis assim que o
              paciente confirmar a consulta no app.
            </div>
          </div>
        </div>
      )}

      <SoapCard appointmentId={a.id} canEdit={confirmed} twoCol={twoCol} />

      <ConsultaDocuments appointmentId={a.id} patientId={a.patientId} confirmed={confirmed} />
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        justifySelf: "start",
        border: "none",
        background: "none",
        color: color.textMuted,
        fontSize: 13,
        cursor: "pointer",
        padding: "4px 0",
      }}
    >
      ← Voltar para consultas
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 32,
        padding: "0 14px",
        borderRadius: 999,
        background: color.muted,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}
