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
  payment?: unknown;
}

export interface Teleconsultation {
  appointmentId: string;
  roomName: string;
  roomUrl: string;
  startDatetime: string;
  endDatetime: string;
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
