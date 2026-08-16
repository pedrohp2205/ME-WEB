// Consultas (agendamentos) — /api/v1/appointments.
import { api } from "./http";

export type AppointmentType = "IN_PERSON" | "TELEMEDICINE";
export type AppointmentStatus = "SCHEDULED" | "CANCELED" | "COMPLETED";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  startDatetime: string; // ISO
  endDatetime: string;
  confirmedAt: string | null;
  payment?: Payment | null;
  /** Só vem preenchido quando o paciente autorizou o nome nesta consulta. */
  patientName?: string | null;
  patientNameShared?: boolean;
}

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "CANCELED" | "EXPIRED";

/** Só acompanha a consulta quando quem pergunta é o próprio paciente. */
export interface Payment {
  id: string;
  appointmentId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl: string | null;
  paidAt: string | null;
}

export interface Teleconsultation {
  appointmentId: string;
  roomName: string;
  /** URL completa, com o token na query — serve para abrir em outra aba. */
  roomUrl: string;
  /** Servidor puro, para o embed montar a sala. */
  serverUrl: string;
  /** JWT da sala. Null quando o servidor de vídeo está sem autenticação. */
  token: string | null;
  startDatetime: string;
  endDatetime: string;
  expiresAt: string;
}

export function listByDoctor(doctorId: string): Promise<Appointment[]> {
  return api.get<Appointment[]>(`/appointments/doctor/${doctorId}`);
}

export function getById(id: string): Promise<Appointment> {
  return api.get<Appointment>(`/appointments/${id}`);
}

export function cancel(id: string): Promise<Appointment> {
  return api.patch<Appointment>(`/appointments/${id}/cancel`);
}

export function complete(id: string): Promise<Appointment> {
  return api.patch<Appointment>(`/appointments/${id}/complete`);
}

export function reschedule(
  id: string,
  startDatetime: string,
  endDatetime: string,
): Promise<Appointment> {
  return api.patch<Appointment>(`/appointments/${id}/reschedule`, {
    startDatetime,
    endDatetime,
  });
}

export function getTeleconsultation(id: string): Promise<Teleconsultation> {
  return api.get<Teleconsultation>(`/appointments/${id}/teleconsultation`);
}
