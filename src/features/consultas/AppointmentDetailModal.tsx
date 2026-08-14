import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/app/Modal";
import { GhostButton, PrimaryButton, Chip, TextInput, Field } from "@/app/ui";
import { useToast } from "@/app/Toast";
import { useAsync } from "@/lib/useAsync";
import * as appointmentsApi from "@/lib/api/appointments";
import * as scheduleApi from "@/lib/api/schedule";
import type { Appointment } from "@/lib/api/appointments";
import { ApiError } from "@/lib/api/errors";
import {
  isActive,
  isTelemedicine,
  statusChip,
  statusLabel,
  typeLabel,
} from "@/lib/domain/appointment";
import { patientInitials, patientLabel } from "@/lib/format/patient";
import { dateBR, isoDate, timeLocal, today0, addDays } from "@/lib/format/datetime";
import { color, radius } from "@/theme/tokens";

function msg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export function AppointmentDetailModal({
  appointment,
  doctorId,
  onClose,
  onChanged,
}: {
  appointment: Appointment;
  doctorId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [mode, setMode] = useState<"view" | "reschedule">("view");

  const a = appointment;
  const [bg, fg] = statusChip(a);

  async function doComplete() {
    setBusy("complete");
    try {
      await appointmentsApi.complete(a.id);
      toast("Consulta marcada como concluída.");
      onChanged();
      onClose();
    } catch (e) {
      toast(msg(e, "Não foi possível concluir a consulta."), "err");
    } finally {
      setBusy("");
    }
  }

  async function doCancel() {
    setBusy("cancel");
    try {
      await appointmentsApi.cancel(a.id);
      toast("Consulta cancelada.");
      onChanged();
      onClose();
    } catch (e) {
      toast(msg(e, "Não foi possível cancelar a consulta."), "err");
    } finally {
      setBusy("");
    }
  }

  async function openRoom() {
    setBusy("room");
    try {
      const tele = await appointmentsApi.getTeleconsultation(a.id);
      window.open(tele.roomUrl, "_blank", "noopener,noreferrer");
      toast("Sala de teleconsulta aberta em nova aba.");
    } catch (e) {
      toast(msg(e, "Não foi possível abrir a sala."), "err");
    } finally {
      setBusy("");
    }
  }

  if (mode === "reschedule") {
    return (
      <RescheduleView
        appointment={a}
        doctorId={doctorId}
        onBack={() => setMode("view")}
        onClose={onClose}
        onDone={() => {
          onChanged();
          onClose();
        }}
      />
    );
  }

  const active = isActive(a);

  return (
    <Modal
      eyebrow="Consulta"
      title={patientLabel(a.patientId)}
      onClose={onClose}
      footer={
        active ? (
          <>
            <GhostButton onClick={doCancel} disabled={!!busy} style={{ color: color.danger }}>
              {busy === "cancel" ? "Cancelando…" : "Cancelar"}
            </GhostButton>
            <GhostButton onClick={() => setMode("reschedule")} disabled={!!busy}>
              Remarcar
            </GhostButton>
            <GhostButton onClick={doComplete} disabled={!!busy}>
              {busy === "complete" ? "Concluindo…" : "Concluir"}
            </GhostButton>
            <PrimaryButton onClick={() => navigate(`/consultas/${a.id}`)} disabled={!!busy}>
              Abrir atendimento
            </PrimaryButton>
          </>
        ) : a.status === "COMPLETED" ? (
          <>
            <GhostButton onClick={onClose}>Fechar</GhostButton>
            <PrimaryButton onClick={() => navigate(`/consultas/${a.id}`)}>
              Abrir atendimento
            </PrimaryButton>
          </>
        ) : (
          <GhostButton onClick={onClose}>Fechar</GhostButton>
        )
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            background: color.muted,
            color: color.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {patientInitials(a.patientId)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{patientLabel(a.patientId)}</div>
          <div style={{ fontSize: 12, color: color.textFaint, marginTop: 2 }}>
            paciente sem nome exposto ao médico (dado do paciente)
          </div>
        </div>
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
        {isTelemedicine(a) && active && (
          <button
            onClick={openRoom}
            disabled={!!busy}
            style={{
              height: 32,
              padding: "0 16px",
              border: "none",
              borderRadius: 999,
              background: color.tealSoft,
              color: color.teal,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {busy === "room" ? "Abrindo…" : "Abrir sala"}
          </button>
        )}
      </div>

      {a.status === "SCHEDULED" && !a.confirmedAt && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            borderRadius: radius.control,
            background: color.warnSoft,
            border: `1px solid ${color.warnSoftBorder}`,
            fontSize: 13,
            color: color.warn,
            lineHeight: 1.6,
          }}
        >
          Aguardando confirmação do paciente. O registro clínico e a emissão de documentos
          são liberados após a confirmação (regra do backend).
        </div>
      )}
    </Modal>
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

function RescheduleView({
  appointment,
  doctorId,
  onBack,
  onClose,
  onDone,
}: {
  appointment: Appointment;
  doctorId: string;
  onBack: () => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState(isoDate(addDays(today0(), 1)));
  const [selected, setSelected] = useState<scheduleApi.AvailableSlot | null>(null);
  const [busy, setBusy] = useState(false);

  const slots = useAsync(
    () => scheduleApi.getAvailableSlots(doctorId, date),
    [doctorId, date],
  );

  async function confirm() {
    if (!selected) {
      toast("Escolha um horário livre.", "err");
      return;
    }
    setBusy(true);
    try {
      await appointmentsApi.reschedule(
        appointment.id,
        selected.startDatetime,
        selected.endDatetime,
      );
      toast("Consulta remarcada.");
      onDone();
    } catch (e) {
      toast(msg(e, "Não foi possível remarcar."), "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      eyebrow="Remarcar consulta"
      title={patientLabel(appointment.patientId)}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onBack} disabled={busy}>
            Voltar
          </GhostButton>
          <PrimaryButton onClick={confirm} disabled={busy || !selected}>
            {busy ? "Remarcando…" : "Confirmar novo horário"}
          </PrimaryButton>
        </>
      }
    >
      <Field label="Nova data">
        <TextInput
          type="date"
          value={date}
          min={isoDate(today0())}
          onChange={(e) => {
            setDate(e.target.value);
            setSelected(null);
          }}
        />
      </Field>

      <div style={{ marginTop: 18, fontSize: 13, color: color.textMuted, marginBottom: 10 }}>
        Horários livres em {dateBR(date + "T00:00")}
      </div>

      {slots.loading && (
        <div style={{ fontSize: 13, color: color.textMuted }}>Carregando horários…</div>
      )}
      {slots.error && (
        <div style={{ fontSize: 13, color: color.danger }}>{slots.error}</div>
      )}
      {!slots.loading && !slots.error && (slots.data?.length ?? 0) === 0 && (
        <div
          style={{
            padding: 20,
            border: `1px dashed ${color.border}`,
            borderRadius: radius.control,
            fontSize: 13,
            color: color.textMuted,
          }}
        >
          Nenhum horário livre neste dia.
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {slots.data?.map((s) => {
          const on = selected?.startDatetime === s.startDatetime;
          return (
            <button
              key={s.startDatetime}
              onClick={() => setSelected(s)}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 999,
                border: `1px solid ${on ? color.primary : color.border}`,
                background: on ? color.primarySoft : color.surface,
                color: on ? color.primary : color.text,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {timeLocal(s.startDatetime)}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
