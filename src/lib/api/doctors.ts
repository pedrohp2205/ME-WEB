// Endpoints do médico. GET /doctors/me devolve o perfil e o `id` (doctorId)
// usado nas rotas de agenda/consulta.
import { api } from "./http";

export interface SpecialtyRef {
  id: string;
  slug: string;
  name: string;
  profession?: string;
}

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
  // Novos (opcionais para não quebrar chamadas existentes).
  profession?: string;
  /** Rótulo do conselho da profissão (ex.: "CRM", "CRN", "CRP", "CREFITO", "CREF"). */
  council?: string;
  councilNumber?: string;
  councilUf?: string;
  specialties?: SpecialtyRef[];
}

export function getMe(): Promise<DoctorResponse> {
  return api.get<DoctorResponse>("/doctors/me");
}

// ---- Especialidades ----

export interface Specialty {
  id: string;
  slug: string;
  name: string;
  profession: string;
}

/** Especialidades ATIVAS de uma profissão (default MEDICINE). */
export function listSpecialties(profession: string): Promise<Specialty[]> {
  return api.get<Specialty[]>("/specialties", { query: { profession } });
}

/** Atualiza as especialidades do profissional (máx. 5). Retorna o perfil. */
export function updateSpecialties(specialtyIds: string[]): Promise<DoctorResponse> {
  return api.put<DoctorResponse>("/doctors/me/specialties", { specialtyIds });
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

// ---- Certificado digital (ICP-Brasil / VIDaaS) ----

export type CertificateStatus = "PENDING" | "LINKED" | "FAILED" | "REVOKED";

export interface CertificateInfo {
  id: string;
  status: CertificateStatus;
  provider: string;
  subject: string | null;
  notAfter: string | null;
  linkedAt: string | null;
}

export interface CertificateAuthorization {
  id: string;
  /** Preenchida em produção (VIDaaS): redirecionar o navegador para ela.
   *  Nula em DEV (mock): o vínculo já é concluído no servidor. */
  authorizationUrl: string | null;
  expiresAt: string;
}

/** Certificado do profissional. 204 (sem conteúdo) vira null. */
export async function getCertificate(): Promise<CertificateInfo | null> {
  const r = await api.get<CertificateInfo | null>("/doctors/me/certificate");
  return r ?? null;
}

/** Inicia a autorização do certificado (VIDaaS em prod; mock em dev). */
export function startCertificateAuthorization(): Promise<CertificateAuthorization> {
  return api.post<CertificateAuthorization>("/doctors/me/certificate/authorization");
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
