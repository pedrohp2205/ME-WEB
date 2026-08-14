import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAsync } from "@/lib/useAsync";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as appointmentsApi from "@/lib/api/appointments";
import type { Appointment } from "@/lib/api/appointments";
import {
  isAwaitingConfirmation,
  statusChip,
  statusLabel,
  typeLabel,
} from "@/lib/domain/appointment";
import { patientInitials, patientLabel } from "@/lib/format/patient";
import { dateBR, isoDateLocal, isoDate, timeLocal, today0 } from "@/lib/format/datetime";
import { PageTitle, Card, Chip } from "@/app/ui";
import { FilterPills } from "@/features/agenda/FilterPills";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { color, radius } from "@/theme/tokens";

type Filter = "Todas" | "Hoje" | "Aguardando confirmação" | "Concluídas";
const FILTERS: Filter[] = ["Todas", "Hoje", "Aguardando confirmação", "Concluídas"];

export function ConsultasPage() {
  const { doctor } = useAuth();
  const doctorId = doctor!.id;
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [filter, setFilter] = useState<Filter>("Todas");
  const [openId, setOpenId] = useState<string | null>(null);

  const appts = useAsync(() => appointmentsApi.listByDoctor(doctorId), [doctorId]);

  const list = filterAppointments(appts.data ?? [], filter);
  const open = appts.data?.find((a) => a.id === openId) ?? null;

  return (
    <div style={{ animation: "up .25s ease-out" }}>
      <PageTitle
        title="Consultas"
        subtitle="Todos os atendimentos e seus status de confirmação."
      />

      <div style={{ marginBottom: 18 }}>
        <FilterPills options={FILTERS} value={filter} onChange={(f) => setFilter(f as Filter)} />
      </div>

      {appts.loading && <SkeletonRows />}
      {appts.error && <ErrorBox message={appts.error} onRetry={appts.reload} />}

      {!appts.loading && !appts.error && (
        <Card padding={0} style={{ overflow: "hidden" }}>
          {list.map((a, i) => (
            <AppointmentRow
              key={a.id}
              a={a}
              isMobile={isMobile}
              first={i === 0}
              onClick={() => setOpenId(a.id)}
            />
          ))}
          {list.length === 0 && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Nenhuma consulta neste filtro</div>
              <div style={{ fontSize: 13, color: color.textMuted, marginTop: 4 }}>
                Ajuste os filtros ou abra novas janelas na agenda.
              </div>
            </div>
          )}
        </Card>
      )}

      {open && (
        <AppointmentDetailModal
          appointment={open}
          doctorId={doctorId}
          onClose={() => setOpenId(null)}
          onChanged={appts.reload}
        />
      )}
    </div>
  );
}

function filterAppointments(all: Appointment[], filter: Filter): Appointment[] {
  const sorted = [...all].sort((x, y) =>
    y.startDatetime.localeCompare(x.startDatetime),
  );
  const todayStr = isoDate(today0());
  switch (filter) {
    case "Hoje":
      return sorted.filter((a) => isoDateLocal(a.startDatetime) === todayStr);
    case "Aguardando confirmação":
      return sorted.filter(isAwaitingConfirmation);
    case "Concluídas":
      return sorted.filter((a) => a.status === "COMPLETED");
    default:
      return sorted;
  }
}

function AppointmentRow({
  a,
  isMobile,
  first,
  onClick,
}: {
  a: Appointment;
  isMobile: boolean;
  first: boolean;
  onClick: () => void;
}) {
  const [bg, fg] = statusChip(a);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr 1fr 170px",
        gap: 10,
        alignItems: "center",
        padding: "16px 20px",
        border: "none",
        borderTop: first ? "none" : `1px solid ${color.border}`,
        background: color.surface,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span
          style={{
            width: 38,
            height: 38,
            flex: "none",
            borderRadius: 999,
            background: color.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {patientInitials(a.patientId)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{patientLabel(a.patientId)}</span>
      </span>
      <span style={{ fontSize: 13, color: color.textMuted }}>
        {dateBR(a.startDatetime)} · {timeLocal(a.startDatetime)}
      </span>
      <span style={{ fontSize: 13, color: color.textMuted }}>{typeLabel(a.appointmentType)}</span>
      <span style={{ justifySelf: isMobile ? "start" : "start" }}>
        <Chip label={statusLabel(a)} bg={bg} fg={fg} />
      </span>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 70,
            borderRadius: radius.card,
            background: "linear-gradient(90deg,#F4EDE9,#FBF6F3,#F4EDE9)",
            backgroundSize: "200% 100%",
            animation: "sh 1.2s infinite",
          }}
        />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: radius.card,
        background: color.dangerSoft,
        color: color.danger,
        fontSize: 13,
        lineHeight: 1.6,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}
    >
      <span style={{ flex: 1, minWidth: 200 }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          height: 36,
          padding: "0 16px",
          border: `1px solid ${color.danger}`,
          borderRadius: 999,
          background: "transparent",
          color: color.danger,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Tentar de novo
      </button>
    </div>
  );
}
