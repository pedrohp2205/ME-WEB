// Resumo clínico SOAP — /api/v1/consultations/summaries.
import { api } from "./http";
import { ApiError } from "./errors";

export interface ConsultationSummary {
  id: string;
  appointmentId: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  isSigned: boolean;
  signedAt: string | null;
}

export interface SoapFields {
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
}

/** Busca o resumo do agendamento; 404 = ainda não existe (retorna null). */
export async function getByAppointment(
  appointmentId: string,
): Promise<ConsultationSummary | null> {
  try {
    return await api.get<ConsultationSummary>(
      `/consultations/summaries/appointment/${appointmentId}`,
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function createSummary(
  appointmentId: string,
  fields: SoapFields,
): Promise<ConsultationSummary> {
  return api.post<ConsultationSummary>("/consultations/summaries", {
    appointmentId,
    ...fields,
  });
}

export function updateSummary(
  id: string,
  fields: SoapFields,
): Promise<ConsultationSummary> {
  return api.put<ConsultationSummary>(`/consultations/summaries/${id}`, fields);
}

export function signSummary(id: string): Promise<ConsultationSummary> {
  return api.patch<ConsultationSummary>(`/consultations/summaries/${id}/sign`);
}
