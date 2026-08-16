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

// ---- Credenciamento ----
// O médico nasce PENDING e só chega ao painel depois da análise da equipe. Até
// lá o backend o autentica com o papel DOCTOR_ONBOARDING, que só alcança estes
// endpoints — por isso a guarda do painel olha `canPractice`.

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DoctorCertificateResponse {
  id: string;
  status: string;
  provider: string;
  subject: string | null;
  notAfter: string | null;
  linkedAt: string | null;
}

export interface CredentialingResponse {
  approvalStatus: ApprovalStatus;
  /** Motivo da recusa, preenchido pela equipe quando o cadastro é negado. */
  approvalReason: string | null;
  cpfInformed: boolean;
  crmUf: string | null;
  certificate: DoctorCertificateResponse | null;
  twoFactorEnabled: boolean;
  /** Aprovado + 2FA ativo: pode usar o painel. */
  canPractice: boolean;
  /** canPractice + certificado ICP válido: pode assinar documentos. */
  canPrescribe: boolean;
}

export function getCredentialing(): Promise<CredentialingResponse> {
  return api.get<CredentialingResponse>("/doctors/me/credentialing");
}

// ---- Auto-cadastro (público) ----

export interface RegisterDoctorRequest {
  email: string;
  password: string;
  fullName: string;
  crm: string;
  crmUf: string;
  cpf: string;
  rqe?: string | null;
  phoneNumber?: string | null;
}

export interface DoctorRegistrationResponse {
  id: string;
  fullName: string;
  crm: string;
  crmUf: string | null;
  approvalStatus: ApprovalStatus;
}

/** Cria conta + perfil do médico numa tacada. Nasce PENDING, sem sessão. */
export function registerDoctor(
  body: RegisterDoctorRequest,
): Promise<DoctorRegistrationResponse> {
  return api.post<DoctorRegistrationResponse>("/doctors/registration", body, {
    auth: false,
  });
}
