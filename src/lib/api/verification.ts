import { api } from "./http";
import type { ApprovalStatus } from "./doctors";

export type VerificationDocumentType =
  | "COUNCIL_CARD_FRONT"
  | "COUNCIL_CARD_BACK"
  | "ID_DOCUMENT_FRONT"
  | "ID_DOCUMENT_BACK"
  | "DIPLOMA"
  | "SPECIALIST_TITLE";

export type FaceVerificationStatus = "CREATED" | "SUCCEEDED" | "FAILED" | "EXPIRED";

export interface VerificationDocument {
  type: VerificationDocumentType;
  label: string;
  required: boolean;
  uploaded: boolean;
  contentType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
}

export interface FaceVerificationStatusResponse {
  id: string;
  status: FaceVerificationStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface VerificationResponse {
  approvalStatus: ApprovalStatus;
  approvalReason: string | null;
  biometricConsentGiven: boolean;
  documents: VerificationDocument[];
  lastFaceVerification: FaceVerificationStatusResponse | null;
  faceVerified: boolean;
  missing: string[];
  readyToSubmit: boolean;
  submittedAt: string | null;
  locked: boolean;
}

export interface LivenessSession {
  id: string;
  sessionId: string;
  provider: string;
  region: string | null;
}

export interface MobileHandoff {
  token: string;
  expiresAt: string;
}

export interface HandoffStatus {
  firstName: string;
  biometricConsentGiven: boolean;
  faceVerified: boolean;
  expiresAt: string;
}

const BASE = "/professionals/me/verification";
const HANDOFF = "/verification-handoff";
const HANDOFF_HEADER = "X-Verification-Handoff";

export function getVerification(): Promise<VerificationResponse> {
  return api.get<VerificationResponse>(BASE);
}

export function uploadDocument(type: VerificationDocumentType, file: File): Promise<VerificationResponse> {
  const form = new FormData();
  form.append("file", file);
  return api.upload<VerificationResponse>("PUT", `${BASE}/documents/${type}`, form);
}

export function startLiveness(biometricConsent: boolean): Promise<LivenessSession> {
  return api.post<LivenessSession>(`${BASE}/liveness-sessions`, { biometricConsent });
}

export function completeLiveness(id: string): Promise<FaceVerificationStatusResponse> {
  return api.post<FaceVerificationStatusResponse>(`${BASE}/liveness-sessions/${id}/complete`);
}

export function submitVerification(): Promise<VerificationResponse> {
  return api.post<VerificationResponse>(`${BASE}/submit`);
}

export function createMobileHandoff(): Promise<MobileHandoff> {
  return api.post<MobileHandoff>(`${BASE}/mobile-handoff`);
}

function handoffOptions(token: string) {
  return { auth: false, headers: { [HANDOFF_HEADER]: token } };
}

export function getHandoff(token: string): Promise<HandoffStatus> {
  return api.get<HandoffStatus>(HANDOFF, handoffOptions(token));
}

export function startHandoffLiveness(token: string, biometricConsent: boolean): Promise<LivenessSession> {
  return api.post<LivenessSession>(`${HANDOFF}/liveness-sessions`, { biometricConsent }, handoffOptions(token));
}

export function completeHandoffLiveness(token: string, id: string): Promise<FaceVerificationStatusResponse> {
  return api.post<FaceVerificationStatusResponse>(
    `${HANDOFF}/liveness-sessions/${id}/complete`,
    undefined,
    handoffOptions(token),
  );
}

export function mobileHandoffUrl(token: string): string {
  return `${window.location.origin}/verificacao-facial#t=${encodeURIComponent(token)}`;
}
