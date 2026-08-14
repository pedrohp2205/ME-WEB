// Documentos médicos — /api/v1/medical-documents.
import { api } from "./http";

export type MedicalDocumentType =
  | "RECEITA_SIMPLES"
  | "RECEITA_CONTROLE_ESPECIAL"
  | "ATESTADO"
  | "PEDIDO_EXAME"
  | "SOLICITACAO_PROCEDIMENTO";

export type MedicalDocumentStatus =
  | "DRAFT"
  | "AWAITING_SIGNATURE"
  | "SIGNED"
  | "ISSUED"
  | "CANCELED";

export type Laterality = "DIREITA" | "ESQUERDA" | "BILATERAL";

export interface SickLeave {
  startDate: string; // yyyy-mm-dd
  endDate?: string | null;
  days?: number | null;
  cid10?: string | null;
  discloseCid?: boolean;
  purpose?: string | null;
}
export interface PrescribedItem {
  drug: string;
  presentation?: string | null;
  quantity?: string | null;
  posology: string;
  durationDays?: number | null;
  notes?: string | null;
}
export interface Prescription {
  items: PrescribedItem[];
  instructions?: string | null;
}
export interface RequestedItem {
  name: string;
  code?: string | null;
  quantity: number;
  laterality?: Laterality | null;
  justification?: string | null;
}
export interface DocumentContent {
  sickLeave?: SickLeave | null;
  prescription?: Prescription | null;
  requestedItems?: RequestedItem[];
  clinicalIndication?: string | null;
  justification?: string | null;
  urgent?: boolean;
  observations?: string | null;
  patientAddress?: string | null;
}

export interface DocumentSignature {
  provider: string;
  certificateSubject: string | null;
  certificateCpf: string | null;
  signedAt: string;
}

export interface MedicalDocument {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string | null;
  documentType: MedicalDocumentType;
  status: MedicalDocumentStatus;
  templateId: string | null;
  content: DocumentContent;
  hasPdf: boolean;
  validationCode: string;
  signature: DocumentSignature | null;
  canceledAt: string | null;
  cancelReason: string | null;
  issuedAt: string;
}

export interface DocumentPreview {
  copyLabel: string;
  bodyHtml: string;
}

export interface RequestSignatureResult {
  documentId: string;
  status: string;
  requiresRedirectApproval: boolean;
  authorizationUrl: string | null;
}

export interface DocumentVerification {
  documentType: string;
  status: string;
  doctorName: string | null;
  doctorCrm: string | null;
  patientInitials: string;
  issuedAt: string;
  signed: boolean;
  canceled: boolean;
}

export function listByAppointment(
  appointmentId: string,
  documentType?: MedicalDocumentType,
): Promise<MedicalDocument[]> {
  return api.get<MedicalDocument[]>(`/medical-documents/appointment/${appointmentId}`, {
    query: documentType ? { documentType } : undefined,
  });
}

export function getById(id: string): Promise<MedicalDocument> {
  return api.get<MedicalDocument>(`/medical-documents/${id}`);
}

export function create(body: {
  appointmentId: string;
  documentType: MedicalDocumentType;
  templateId?: string | null;
  content: DocumentContent;
}): Promise<MedicalDocument> {
  return api.post<MedicalDocument>("/medical-documents", body);
}

export function updateContent(
  id: string,
  body: { templateId?: string | null; content: DocumentContent },
): Promise<MedicalDocument> {
  return api.put<MedicalDocument>(`/medical-documents/${id}`, body);
}

export function preview(id: string): Promise<DocumentPreview[]> {
  return api.get<DocumentPreview[]>(`/medical-documents/${id}/preview`);
}

export function requestSignature(id: string): Promise<RequestSignatureResult> {
  return api.post<RequestSignatureResult>(`/medical-documents/${id}/signature`);
}

export function cancel(id: string, reason?: string): Promise<MedicalDocument> {
  return api.patch<MedicalDocument>(`/medical-documents/${id}/cancel`, {
    reason: reason?.trim() || null,
  });
}

export function downloadFile(id: string): Promise<Blob> {
  return api.blob(`/medical-documents/${id}/file`);
}

/** Verificação pública (sem auth). */
export function verify(validationCode: string): Promise<DocumentVerification> {
  return api.get<DocumentVerification>(
    `/medical-documents/verify/${encodeURIComponent(validationCode)}`,
    { auth: false },
  );
}
