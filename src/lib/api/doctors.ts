// Endpoints do médico. GET /doctors/me devolve o perfil e o `id` (doctorId)
// usado nas rotas de agenda/consulta.
import { api } from "./http";

export interface DoctorResponse {
  id: string;
  userId: string;
  clinicId: string | null;
  fullName: string;
  crm: string;
  rqe: string | null;
  consultationPriceCents: number | null;
  professionalAddress: string | null;
  phoneNumber: string | null;
}

export function getMe(): Promise<DoctorResponse> {
  return api.get<DoctorResponse>("/doctors/me");
}

export interface CreateDoctorRequest {
  fullName: string;
  crm: string;
  rqe?: string | null;
  clinicId?: string | null;
  consultationPriceCents?: number | null;
  professionalAddress?: string | null;
  phoneNumber?: string | null;
}

export function createDoctor(body: CreateDoctorRequest): Promise<DoctorResponse> {
  return api.post<DoctorResponse>("/doctors", body);
}

export function updateIssuerInfo(
  professionalAddress: string,
  phoneNumber: string,
): Promise<DoctorResponse> {
  return api.patch<DoctorResponse>("/doctors/me/issuer-info", {
    professionalAddress,
    phoneNumber,
  });
}

export function updatePrice(
  consultationPriceCents: number,
): Promise<DoctorResponse> {
  return api.patch<DoctorResponse>("/doctors/me/price", {
    consultationPriceCents,
  });
}

/** Emitente completo = pré-requisito para receita de controle especial. */
export function isIssuerComplete(doctor: DoctorResponse): boolean {
  return Boolean(doctor.professionalAddress?.trim() && doctor.phoneNumber?.trim());
}
