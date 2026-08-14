import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAsync } from "@/lib/useAsync";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as appointmentsApi from "@/lib/api/appointments";
import * as docsApi from "@/lib/api/medicalDocuments";
import type { MedicalDocument, MedicalDocumentType } from "@/lib/api/medicalDocuments";
import { PageTitle, Card, Chip } from "@/app/ui";
import { FilterPills } from "@/features/agenda/FilterPills";
import { ErrorBox } from "@/features/consultas/ConsultasPage";
import { DocumentDetailModal } from "./DocumentDetailModal";
import {
  DOCUMENT_TYPES,
  docStatusChip,
  docStatusLabel,
  docTypeLabel,
} from "@/lib/domain/document";
import { patientCode } from "@/lib/format/patient";
import { dateBR } from "@/lib/format/datetime";
import { color } from "@/theme/tokens";

// Limite de agendamentos varridos p/ agregar documentos (sem endpoint global).
const MAX_APPTS = 40;

const STATUS_FILTERS = ["Todos", "DRAFT", "AWAITING_SIGNATURE", "SIGNED", "CANCELED"] as const;

export function DocumentosPage() {
  const { doctor } = useAuth();
  const doctorId = doctor!.id;
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [typeFilter, setTypeFilter] = useState<"Todos" | MedicalDocumentType>("Todos");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("Todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const data = useAsync(async () => {
    const appts = await appointmentsApi.listByDoctor(doctorId);
    const recent = [...appts]
      .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime))
      .slice(0, MAX_APPTS);
    const results = await Promise.allSettled(
      recent.map((a) => docsApi.listByAppointment(a.id)),
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  }, [doctorId]);

  const all = data.data ?? [];
  const list = all
    .filter((d) => typeFilter === "Todos" || d.documentType === typeFilter)
    .filter((d) => statusFilter === "Todos" || d.status === statusFilter)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const open = all.find((d) => d.id === openId) ?? null;

  return (
    <div style={{ animation: "up .25s ease-out" }}>
      <PageTitle title="Documentos" subtitle="Receitas, atestados e pedidos emitidos por você." />

      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <FilterPills
          size={36}
          options={["Todos", ...DOCUMENT_TYPES]}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as typeof typeFilter)}
          labelOf={(v) => (v === "Todos" ? "Todos" : docTypeLabel(v as MedicalDocumentType))}
        />
        <FilterPills
          size={36}
          options={STATUS_FILTERS as unknown as string[]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          labelOf={(v) => (v === "Todos" ? "Todos" : docStatusLabel(v))}
        />
      </div>

      {data.loading && <div style={{ fontSize: 13, color: color.textMuted }}>Carregando documentos…</div>}
      {data.error && <ErrorBox message={data.error} onRetry={data.reload} />}

      {!data.loading && !data.error && (
        <Card padding={0} style={{ overflow: "hidden" }}>
          {list.map((d, i) => (
            <Row key={d.id} d={d} first={i === 0} isMobile={isMobile} onClick={() => setOpenId(d.id)} />
          ))}
          {list.length === 0 && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Nenhum documento neste filtro</div>
              <div style={{ fontSize: 13, color: color.textMuted, marginTop: 4 }}>
                Emita a partir de uma consulta confirmada.
              </div>
            </div>
          )}
        </Card>
      )}

      {open && (
        <DocumentDetailModal document={open} onClose={() => setOpenId(null)} onChanged={data.reload} />
      )}
    </div>
  );
}

function Row({
  d,
  first,
  isMobile,
  onClick,
}: {
  d: MedicalDocument;
  first: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const [bg, fg] = docStatusChip(d.status);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1.1fr .9fr 170px",
        gap: 10,
        alignItems: "center",
        padding: "16px 20px",
        border: "none",
        borderTop: first ? "none" : `1px solid ${color.border}`,
        background: color.surface,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
          {docTypeLabel(d.documentType)}
        </span>
        <span style={{ display: "block", fontSize: 12, color: color.textMuted, marginTop: 2, letterSpacing: 0.5 }}>
          {d.validationCode}
        </span>
      </span>
      <span style={{ fontSize: 13, color: color.text }}>{patientCode(d.patientId)}</span>
      <span style={{ fontSize: 13, color: color.textMuted }}>{dateBR(d.issuedAt)}</span>
      <span style={{ justifySelf: "start" }}>
        <Chip label={docStatusLabel(d.status)} bg={bg} fg={fg} />
      </span>
    </button>
  );
}
