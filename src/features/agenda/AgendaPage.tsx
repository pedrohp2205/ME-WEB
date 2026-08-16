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
  typeBar,
  typeLabel,
} from "@/lib/domain/appointment";
import { patientDisplayName } from "@/lib/format/patient";
import {
  addDays,
  dayAbbr,
  dowFromDate,
  isoDate,
  isoDateLocal,
  startOfWeek,
  timeLocal,
  today0,
} from "@/lib/format/datetime";
import { PageTitle } from "@/app/ui";
import { FilterPills } from "./FilterPills";
import { HorariosTab } from "./HorariosTab";
import { BloqueiosTab } from "./BloqueiosTab";
import { AppointmentDetailModal } from "@/features/consultas/AppointmentDetailModal";
import { ErrorBox } from "@/features/consultas/ConsultasPage";
import { color, radius } from "@/theme/tokens";

const TABS = ["Consultas", "Meus horários", "Bloqueios"] as const;
type Tab = (typeof TABS)[number];

export function AgendaPage() {
  const { doctor } = useAuth();
  const doctorId = doctor!.id;
  const [tab, setTab] = useState<Tab>("Consultas");

  return (
    <div style={{ animation: "up .25s ease-out" }}>
      <PageTitle
        title="Agenda"
        subtitle="Consultas da semana, janelas de atendimento e bloqueios."
      />
      <div style={{ marginBottom: 20 }}>
        <FilterPills options={TABS} value={tab} onChange={(t) => setTab(t as Tab)} />
      </div>

      {tab === "Consultas" && <ConsultasWeek doctorId={doctorId} />}
      {tab === "Meus horários" && <HorariosTab doctorId={doctorId} />}
      {tab === "Bloqueios" && <BloqueiosTab doctorId={doctorId} />}
    </div>
  );
}

function ConsultasWeek({ doctorId }: { doctorId: string }) {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [openId, setOpenId] = useState<string | null>(null);

  const appts = useAsync(() => appointmentsApi.listByDoctor(doctorId), [doctorId]);

  const monday = startOfWeek(today0());
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(monday, i));
  const todayStr = isoDate(today0());
  const open = appts.data?.find((a) => a.id === openId) ?? null;

  if (appts.loading)
    return (
      <div
        style={{
          height: 200,
          borderRadius: radius.card,
          background: "linear-gradient(90deg,#F4EDE9,#FBF6F3,#F4EDE9)",
          backgroundSize: "200% 100%",
          animation: "sh 1.2s infinite",
        }}
      />
    );
  if (appts.error) return <ErrorBox message={appts.error} onRetry={appts.reload} />;

  const all = appts.data ?? [];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(7,minmax(0,1fr))",
          gap: 12,
        }}
      >
        {days.map((d) => {
          const ds = isoDate(d);
          const dayAppts = all
            .filter((a) => isoDateLocal(a.startDatetime) === ds)
            .sort((x, y) => x.startDatetime.localeCompare(y.startDatetime));
          const isToday = ds === todayStr;
          return (
            <div
              key={ds}
              style={{
                background: color.surface,
                border: `1px solid ${color.border}`,
                borderRadius: radius.card,
                padding: 12,
                minHeight: isMobile ? undefined : 120,
                boxShadow: "0 8px 24px rgba(33,30,28,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 12px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 28,
                    height: 28,
                    padding: "0 8px",
                    borderRadius: 999,
                    background: isToday ? color.primarySoft : color.muted,
                    color: isToday ? color.primary : color.textMuted,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {d.getDate()}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: color.textMuted }}>
                  {dayAbbr(dowFromDate(d))}
                </span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {dayAppts.map((a) => (
                  <WeekApptCard key={a.id} a={a} onClick={() => setOpenId(a.id)} />
                ))}
                {dayAppts.length === 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      border: `1px dashed ${color.border}`,
                      borderRadius: 14,
                      fontSize: 12,
                      color: color.textFaint,
                    }}
                  >
                    Livre
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <AppointmentDetailModal
          appointment={open}
          doctorId={doctorId}
          onClose={() => setOpenId(null)}
          onChanged={appts.reload}
        />
      )}
    </>
  );
}

function WeekApptCard({ a, onClick }: { a: Appointment; onClick: () => void }) {
  const [, fg] = statusChip(a);
  const awaiting = isAwaitingConfirmation(a);
  return (
    <button
      onClick={onClick}
      title={awaiting ? "Aguardando confirmação do paciente" : undefined}
      style={{
        display: "grid",
        gap: 3,
        padding: "10px 12px",
        border: `1px solid ${awaiting ? color.warnSoftBorder : color.border}`,
        borderLeft: `3px solid ${typeBar(a.appointmentType)}`,
        borderRadius: 14,
        background: awaiting ? color.warnSoft : color.muted,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600 }}>{timeLocal(a.startDatetime)}</span>
      <span
        style={{
          fontSize: 12,
          color: color.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {patientDisplayName(a.patientId, a.patientName)}
      </span>
      <span style={{ fontSize: 11, color: fg, fontWeight: 500 }}>
        {statusLabel(a)} · {typeLabel(a.appointmentType)}
      </span>
    </button>
  );
}
