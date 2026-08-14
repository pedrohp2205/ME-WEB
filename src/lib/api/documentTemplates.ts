// Modelos de documento — /api/v1/document-templates.
import { api } from "./http";
import type { MedicalDocumentType } from "./medicalDocuments";

export interface DocumentTemplate {
  id: string | null; // padrões do sistema podem vir sem id
  documentType: MedicalDocumentType;
  name: string;
  bodyTemplate: string;
  isCustom: boolean;
  ownerDoctorId: string | null;
  ownerClinicId: string | null;
  isActive: boolean;
}

export function list(documentType?: MedicalDocumentType): Promise<DocumentTemplate[]> {
  return api.get<DocumentTemplate[]>("/document-templates", {
    query: documentType ? { documentType } : undefined,
  });
}
