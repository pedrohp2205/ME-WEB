import type { Appointment, AppointmentType } from "@/lib/api/appointments";
import { color } from "@/theme/tokens";

/** Aguardando confirmação do paciente = SCHEDULED com confirmedAt nulo. */
export function isAwaitingConfirmation(a: Appointment): boolean {
  return a.status === "SCHEDULED" && !a.confirmedAt;
}

export function isConfirmed(a: Appointment): boolean {
  return (
    a.status === "COMPLETED" ||
    (a.status === "SCHEDULED" && !!a.confirmedAt)
  );
}

/** Rótulo de status considerando a confirmação do paciente. */
export function statusLabel(a: Appointment): string {
  switch (a.status) {
    case "COMPLETED":
      return "Concluída";
    case "CANCELED":
      return "Cancelada";
    case "SCHEDULED":
      return a.confirmedAt ? "Confirmada" : "Aguardando confirmação";
  }
}

/** [bg, fg] do chip de status. */
export function statusChip(a: Appointment): [string, string] {
  switch (a.status) {
    case "COMPLETED":
      return [color.muted, color.text];
    case "CANCELED":
      return [color.dangerSoft, color.danger];
    case "SCHEDULED":
      return a.confirmedAt
        ? [color.tealSoft, color.teal]
        : [color.warnSoft, color.warn];
  }
}

export function typeLabel(t: AppointmentType): string {
  return t === "TELEMEDICINE" ? "Teleconsulta" : "Presencial";
}

/** Cor da barrinha lateral por tipo (teal p/ tele, coral p/ presencial). */
export function typeBar(t: AppointmentType): string {
  return t === "TELEMEDICINE" ? color.tealAlt : color.primary;
}

export function isTelemedicine(a: Appointment): boolean {
  return a.appointmentType === "TELEMEDICINE";
}

/** Ativa (não cancelada nem concluída) — permite concluir/cancelar/remarcar. */
export function isActive(a: Appointment): boolean {
  return a.status === "SCHEDULED";
}
