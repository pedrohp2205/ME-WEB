// Agenda do médico — base /api/v1/doctors/{doctorId}/schedule.
import { api } from "./http";
import type { DayOfWeek } from "@/lib/format/datetime";

export interface ScheduleSettings {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm" (pode vir "HH:mm:ss")
  endTime: string;
  slotDuration: number; // minutos
}

export interface CreateScheduleSettings {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string;
  slotDuration: number;
}

export interface DoctorBreak {
  id: string;
  doctorId: string;
  startDatetime: string; // ISO
  endDatetime: string;
  reason: string | null;
}

export interface CreateDoctorBreak {
  startDatetime: string; // ISO
  endDatetime: string;
  reason?: string | null;
}

export interface AvailableSlot {
  startDatetime: string; // ISO
  endDatetime: string;
}

const base = (doctorId: string) => `/doctors/${doctorId}/schedule`;

// ── Janelas semanais (settings) ──
export function getSettings(doctorId: string): Promise<ScheduleSettings[]> {
  return api.get<ScheduleSettings[]>(`${base(doctorId)}/settings`);
}
export function createSettings(
  doctorId: string,
  body: CreateScheduleSettings,
): Promise<ScheduleSettings> {
  return api.post<ScheduleSettings>(`${base(doctorId)}/settings`, body);
}
export function deleteSettings(doctorId: string, settingsId: string): Promise<void> {
  return api.del<void>(`${base(doctorId)}/settings/${settingsId}`);
}

// ── Bloqueios (breaks) ──
export function getBreaks(doctorId: string): Promise<DoctorBreak[]> {
  return api.get<DoctorBreak[]>(`${base(doctorId)}/breaks`);
}
export function createBreak(
  doctorId: string,
  body: CreateDoctorBreak,
): Promise<DoctorBreak> {
  return api.post<DoctorBreak>(`${base(doctorId)}/breaks`, body);
}
export function deleteBreak(doctorId: string, breakId: string): Promise<void> {
  return api.del<void>(`${base(doctorId)}/breaks/${breakId}`);
}

// ── Horários livres ──
export function getAvailableSlots(
  doctorId: string,
  date: string, // YYYY-MM-DD
): Promise<AvailableSlot[]> {
  return api.get<AvailableSlot[]>(`${base(doctorId)}/available-slots`, {
    query: { date },
  });
}
