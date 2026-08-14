import type {
  MedicalDocumentType,
  MedicalDocumentStatus,
} from "@/lib/api/medicalDocuments";
import { color } from "@/theme/tokens";

const TYPE_LABEL: Record<MedicalDocumentType, string> = {
  RECEITA_SIMPLES: "Receita simples",
  RECEITA_CONTROLE_ESPECIAL: "Receita de controle especial",
  ATESTADO: "Atestado",
  PEDIDO_EXAME: "Pedido de exame",
  SOLICITACAO_PROCEDIMENTO: "Solicitação de procedimento",
};

export const DOCUMENT_TYPES: MedicalDocumentType[] = [
  "RECEITA_SIMPLES",
  "RECEITA_CONTROLE_ESPECIAL",
  "ATESTADO",
  "PEDIDO_EXAME",
  "SOLICITACAO_PROCEDIMENTO",
];

export function docTypeLabel(t: MedicalDocumentType): string {
  return TYPE_LABEL[t];
}

const STATUS_LABEL: Record<MedicalDocumentStatus, string> = {
  DRAFT: "Rascunho",
  AWAITING_SIGNATURE: "Aguardando assinatura",
  SIGNED: "Assinado",
  ISSUED: "Emitido",
  CANCELED: "Cancelado",
};

export function docStatusLabel(s: MedicalDocumentStatus | string): string {
  return STATUS_LABEL[s as MedicalDocumentStatus] ?? s;
}

export function docStatusChip(s: MedicalDocumentStatus | string): [string, string] {
  switch (s) {
    case "SIGNED":
    case "ISSUED":
      return [color.tealSoft, color.teal];
    case "AWAITING_SIGNATURE":
      return [color.warnSoft, color.warn];
    case "CANCELED":
      return [color.dangerSoft, color.danger];
    default:
      return [color.muted, color.textMuted];
  }
}

export function isPrescription(t: MedicalDocumentType): boolean {
  return t === "RECEITA_SIMPLES" || t === "RECEITA_CONTROLE_ESPECIAL";
}
export function isControleEspecial(t: MedicalDocumentType): boolean {
  return t === "RECEITA_CONTROLE_ESPECIAL";
}
export function isAtestado(t: MedicalDocumentType): boolean {
  return t === "ATESTADO";
}
export function isExamOrProcedure(t: MedicalDocumentType): boolean {
  return t === "PEDIDO_EXAME" || t === "SOLICITACAO_PROCEDIMENTO";
}

/** SIGNED/ISSUED liberam o download do PDF. */
export function isSignedLike(s: MedicalDocumentStatus | string): boolean {
  return s === "SIGNED" || s === "ISSUED";
}
