// Verificação/credenciamento do profissional (autenticado).
// Base: /api/v1/doctors/me/verification (alias de /professionals).
import { api } from "./http";
import type { ApprovalStatus } from "./doctors";

export type VerificationDocumentType =
  | "COUNCIL_CARD_FRONT"
  | "COUNCIL_CARD_BACK"
  | "ID_DOCUMENT_FRONT"
  | "ID_DOCUMENT_BACK"
  | "DIPLOMA"
  | "SPECIALIST_TITLE";

/** Documentos de "rosto": o backend só aceita imagem (JPEG/PNG), não PDF. */
export const FACE_DOCUMENT_TYPES: ReadonlySet<VerificationDocumentType> = new Set([
  "COUNCIL_CARD_FRONT",
  "ID_DOCUMENT_FRONT",
]);

export interface VerificationDocument {
  type: VerificationDocumentType;
  label: string;
  required: boolean;
  uploaded: boolean;
  contentType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
}

export interface FaceVerification {
  id: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export interface VerificationOverview {
  approvalStatus: ApprovalStatus;
  approvalReason: string | null;
  biometricConsentGiven: boolean;
  documents: VerificationDocument[];
  lastFaceVerification: FaceVerification | null;
  faceVerified: boolean;
  /** O que ainda falta (labels/keys do backend). */
  missing: string[];
  readyToSubmit: boolean;
  submittedAt: string | null;
  /** true depois de enviar para análise (não editável). */
  locked: boolean;
}

export interface LivenessSession {
  id: string;
  sessionId: string;
  provider: string;
  region: string;
}

export function getVerification(): Promise<VerificationOverview> {
  return api.get<VerificationOverview>("/doctors/me/verification");
}

/** Envia um documento (multipart/form-data, campo "file"). */
export function uploadVerificationDocument(
  type: VerificationDocumentType,
  file: File,
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  return api.put<void>(`/doctors/me/verification/documents/${type}`, form);
}

/** Passo 1 da prova de vida: consentimento + abertura da sessão. */
export function startLiveness(biometricConsent: boolean): Promise<LivenessSession> {
  return api.post<LivenessSession>("/doctors/me/verification/liveness-sessions", {
    biometricConsent,
  });
}

/** Passo 2 da prova de vida: conclusão (em DEV o provedor MOCK aprova). */
export function completeLiveness(id: string): Promise<void> {
  return api.post<void>(`/doctors/me/verification/liveness-sessions/${id}/complete`);
}

/** Envia tudo para a análise da equipe (passa a locked/submittedAt). */
export function submitVerification(): Promise<void> {
  return api.post<void>("/doctors/me/verification/submit");
}
