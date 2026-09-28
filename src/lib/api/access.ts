// Pedidos de acesso ao prontuário que o profissional fez ao paciente.
// GET /access-requests/mine (papel PROFESSIONAL) -> lista dos grants do médico.
// DTO espelhado de AccessGrantResponse (M.E-API, somente leitura).
import { api } from "./http";

export type AccessStatus = "PENDING" | "APPROVED" | "DENIED" | "REVOKED";

export type RecordSection =
  | "MEDICAL_INFO"
  | "APPOINTMENTS"
  | "CONSULTATION_SUMMARIES"
  | "EXAM_REQUESTS"
  | "EXAM_RESULTS"
  | "MEDICAL_DOCUMENTS"
  | "FITNESS_SUMMARY"
  | "FITNESS_ROUTES";

export interface AccessGrant {
  id: string;
  patientId: string;
  doctorId: string | null;
  clinicId: string | null;
  sections: RecordSection[];
  status: AccessStatus;
  requestMessage: string | null;
  /** Momento em que o pedido foi criado (ISO). */
  grantedAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
}

/** Pedidos de acesso feitos por este profissional. */
export function listMyAccessRequests(): Promise<AccessGrant[]> {
  return api.get<AccessGrant[]>("/access-requests/mine");
}
