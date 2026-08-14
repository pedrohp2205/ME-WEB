import type {
  DocumentContent,
  Laterality,
  MedicalDocumentType,
} from "@/lib/api/medicalDocuments";
import {
  isAtestado,
  isControleEspecial,
  isExamOrProcedure,
  isPrescription,
} from "@/lib/domain/document";

export interface PrescItemForm {
  drug: string;
  presentation: string;
  quantity: string;
  posology: string;
  durationDays: string;
  notes: string;
}
export interface ExamItemForm {
  name: string;
  code: string;
  quantity: string;
  laterality: "" | Laterality;
  justification: string;
}

export interface DocForm {
  // prescrição
  items: PrescItemForm[];
  instructions: string;
  patientAddress: string;
  // atestado
  startDate: string;
  days: string;
  purpose: string;
  cid10: string;
  discloseCid: boolean;
  // exame/procedimento
  examItems: ExamItemForm[];
  clinicalIndication: string;
  justification: string;
  urgent: boolean;
  observations: string;
}

export function blankPrescItem(): PrescItemForm {
  return { drug: "", presentation: "", quantity: "", posology: "", durationDays: "", notes: "" };
}
export function blankExamItem(): ExamItemForm {
  return { name: "", code: "", quantity: "1", laterality: "", justification: "" };
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function blankForm(): DocForm {
  return {
    items: [blankPrescItem()],
    instructions: "",
    patientAddress: "",
    startDate: todayISO(),
    days: "2",
    purpose: "Justificativa de ausência",
    cid10: "",
    discloseCid: false,
    examItems: [blankExamItem()],
    clinicalIndication: "",
    justification: "",
    urgent: false,
    observations: "",
  };
}

const MAX_ITEMS = 30;

/** Valida o formulário; retorna mensagem de erro ou null. */
export function validate(type: MedicalDocumentType, f: DocForm): string | null {
  if (isPrescription(type)) {
    if (f.items.length < 1) return "Adicione ao menos um medicamento.";
    if (f.items.length > MAX_ITEMS) return "Máximo de 30 medicamentos.";
    if (f.items.some((it) => !it.drug.trim()))
      return "Informe o medicamento de cada item.";
    if (f.items.some((it) => !it.posology.trim()))
      return "A posologia é obrigatória em todos os itens.";
    if (isControleEspecial(type) && !f.patientAddress.trim())
      return "O endereço do paciente é obrigatório na receita de controle especial.";
    return null;
  }
  if (isAtestado(type)) {
    if (!f.startDate) return "Informe a data de início do afastamento.";
    return null;
  }
  if (isExamOrProcedure(type)) {
    if (f.examItems.length < 1) return "Adicione ao menos um item.";
    if (f.examItems.length > MAX_ITEMS) return "Máximo de 30 itens.";
    if (f.examItems.some((it) => !it.name.trim()))
      return "Informe o nome de cada item solicitado.";
    if (f.examItems.some((it) => (parseInt(it.quantity, 10) || 0) < 1))
      return "A quantidade de cada item deve ser ao menos 1.";
    return null;
  }
  return null;
}

function numOrNull(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
function strOrNull(s: string): string | null {
  return s.trim() || null;
}

/** Constrói o `content` do backend a partir do formulário e do tipo. */
export function toContent(type: MedicalDocumentType, f: DocForm): DocumentContent {
  if (isPrescription(type)) {
    return {
      prescription: {
        items: f.items.map((it) => ({
          drug: it.drug.trim(),
          presentation: strOrNull(it.presentation),
          quantity: strOrNull(it.quantity),
          posology: it.posology.trim(),
          durationDays: numOrNull(it.durationDays),
          notes: strOrNull(it.notes),
        })),
        instructions: strOrNull(f.instructions),
      },
      patientAddress: isControleEspecial(type) ? strOrNull(f.patientAddress) : null,
    };
  }
  if (isAtestado(type)) {
    return {
      sickLeave: {
        startDate: f.startDate,
        days: numOrNull(f.days),
        purpose: strOrNull(f.purpose),
        cid10: strOrNull(f.cid10),
        discloseCid: f.discloseCid,
      },
    };
  }
  // exame / procedimento
  return {
    requestedItems: f.examItems.map((it) => ({
      name: it.name.trim(),
      code: strOrNull(it.code),
      quantity: parseInt(it.quantity, 10) || 1,
      laterality: it.laterality || null,
      justification: strOrNull(it.justification),
    })),
    clinicalIndication: strOrNull(f.clinicalIndication),
    justification: strOrNull(f.justification),
    urgent: f.urgent,
    observations: strOrNull(f.observations),
  };
}
