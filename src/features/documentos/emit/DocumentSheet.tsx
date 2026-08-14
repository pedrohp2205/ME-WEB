import type { CSSProperties, ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { isAtestado, isControleEspecial, isExamOrProcedure, isPrescription } from "@/lib/domain/document";
import type { MedicalDocumentType } from "@/lib/api/medicalDocuments";
import { patientCode } from "@/lib/format/patient";
import { dateBR, ymdToBR } from "@/lib/format/datetime";
import { Toggle } from "@/app/ui";
import { color } from "@/theme/tokens";
import {
  blankExamItem,
  blankPrescItem,
  type DocForm,
  type ExamItemForm,
  type PrescItemForm,
} from "./emitForm";

const DOC_TITLE: Record<MedicalDocumentType, string> = {
  RECEITA_SIMPLES: "Receituário",
  RECEITA_CONTROLE_ESPECIAL: "Receituário de Controle Especial",
  ATESTADO: "Atestado Médico",
  PEDIDO_EXAME: "Solicitação de Exames",
  SOLICITACAO_PROCEDIMENTO: "Solicitação de Procedimento",
};

/**
 * Editor "modo documento": a folha se monta ao vivo enquanto o médico digita.
 * A fonte da verdade continua o backend — os campos mapeiam o mesmo `DocForm`
 * e o PDF/preview oficial vêm de `GET /{id}/preview`.
 */
export function DocumentSheet({
  type,
  form,
  setForm,
  patientId,
}: {
  type: MedicalDocumentType;
  form: DocForm;
  setForm: (patch: Partial<DocForm>) => void;
  patientId: string;
}) {
  const { doctor } = useAuth();
  const isMobile = useWindowWidth() < 640;
  const pad = isMobile ? 20 : 40;

  return (
    <div style={{ margin: -22, padding: isMobile ? 12 : 24, background: color.muted, minHeight: "100%" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          border: `1px solid ${color.border}`,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(33,30,28,0.08)",
          padding: pad,
          color: color.text,
        }}
      >
        {/* Cabeçalho do médico / clínica (somente leitura) */}
        <div style={{ paddingBottom: 16, borderBottom: `1px solid ${color.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.3px" }}>
            {doctor?.fullName ?? "Médico"}
          </div>
          <div style={{ fontSize: 12, color: color.textMuted, marginTop: 3 }}>
            {[doctor?.crm, doctor?.rqe].filter(Boolean).join(" · ")}
          </div>
          {(doctor?.professionalAddress || doctor?.phoneNumber) && (
            <div style={{ fontSize: 12, color: color.textMuted, marginTop: 2 }}>
              {[doctor?.professionalAddress, doctor?.phoneNumber].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>

        {/* Título do documento */}
        <div
          style={{
            textAlign: "center",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: ".6px",
            textTransform: "uppercase",
            margin: "22px 0",
          }}
        >
          {DOC_TITLE[type]}
        </div>

        {/* Metadados: paciente / emissão / código */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            paddingBottom: 18,
            marginBottom: 18,
            borderBottom: `1px dashed ${color.border}`,
          }}
        >
          <Meta k="Paciente" v={patientCode(patientId)} />
          <Meta k="Emissão" v={dateBR(new Date().toISOString())} />
          <Meta k="Código de validação" v="gerado na assinatura" faint />
        </div>

        {/* Corpo por tipo */}
        {isPrescription(type) && <PrescriptionBody type={type} form={form} setForm={setForm} isMobile={isMobile} />}
        {isAtestado(type) && <AtestadoBody form={form} setForm={setForm} />}
        {isExamOrProcedure(type) && <ExamBody form={form} setForm={setForm} isMobile={isMobile} />}

        {/* Área de assinatura (reservada) */}
        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px dashed ${color.border}` }}>
          <div
            style={{
              width: isMobile ? "100%" : 300,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <div style={{ borderTop: `1px solid ${color.text}`, paddingTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{doctor?.fullName ?? "Médico"}</div>
              <div style={{ fontSize: 11, color: color.textMuted, marginTop: 2 }}>
                {[doctor?.crm, doctor?.rqe].filter(Boolean).join(" · ")}
              </div>
              <div style={{ fontSize: 11, color: color.textFaint, marginTop: 6 }}>
                Assinatura digital ICP-Brasil — posicionada aqui ao assinar.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "10px auto 0", fontSize: 11, color: color.textFaint, textAlign: "center", lineHeight: 1.5 }}>
        Pré-visualização ao vivo. O documento final (PDF) é gerado pelo servidor no passo de
        pré-visualização e na assinatura.
      </div>
    </div>
  );
}

function Meta({ k, v, faint }: { k: string; v: string; faint?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: color.textMuted, textTransform: "uppercase", letterSpacing: ".5px" }}>
        {k}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: faint ? color.textFaint : color.text, marginTop: 2 }}>
        {v}
      </div>
    </div>
  );
}

// ── inputs que se fundem ao documento ──
const sheetInputBase: CSSProperties = {
  border: "none",
  borderBottom: `1px solid ${color.border}`,
  background: "transparent",
  padding: "5px 2px",
  fontSize: 14,
  color: color.text,
  outline: "none",
  fontFamily: "Poppins, sans-serif",
  width: "100%",
};

function SInput({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...sheetInputBase, ...style }}
    />
  );
}

function SArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...sheetInputBase,
        minHeight: 60,
        resize: "vertical",
        lineHeight: 1.6,
        borderBottom: "none",
        border: `1px solid ${color.border}`,
        borderRadius: 8,
        padding: "10px 12px",
      }}
    />
  );
}

function Blank({ children }: { children: ReactNode }) {
  // rótulo minúsculo sobre um campo "preencher aqui"
  return <div style={{ fontSize: 10.5, color: color.textMuted, marginBottom: 2 }}>{children}</div>;
}

const iconBtn: CSSProperties = {
  width: 26,
  height: 26,
  border: `1px solid ${color.border}`,
  borderRadius: 999,
  background: "#fff",
  color: color.textMuted,
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1,
};

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = arr.slice();
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

function RowTools({ onUp, onDown, onDel }: { onUp: () => void; onDown: () => void; onDel: () => void }) {
  return (
    <div style={{ display: "flex", gap: 4, flex: "none" }}>
      <button onClick={onUp} aria-label="Subir" style={iconBtn}>↑</button>
      <button onClick={onDown} aria-label="Descer" style={iconBtn}>↓</button>
      <button onClick={onDel} aria-label="Remover" style={{ ...iconBtn, color: color.danger }}>×</button>
    </div>
  );
}

const addBtn: CSSProperties = {
  height: 36,
  padding: "0 14px",
  border: `1px dashed ${color.primary}`,
  borderRadius: 999,
  background: "#fff",
  color: color.primary,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 12,
};

const sectionTitle: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: color.textMuted,
  textTransform: "uppercase",
  letterSpacing: ".6px",
  marginBottom: 10,
};

// ── Receita ──
function PrescriptionBody({
  type,
  form,
  setForm,
  isMobile,
}: {
  type: MedicalDocumentType;
  form: DocForm;
  setForm: (patch: Partial<DocForm>) => void;
  isMobile: boolean;
}) {
  function setItem(i: number, patch: Partial<PrescItemForm>) {
    setForm({ items: form.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  }
  return (
    <div>
      <div style={sectionTitle}>Prescrição</div>
      <div style={{ display: "grid", gap: 18 }}>
        {form.items.map((it, i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: color.text, paddingBottom: 5 }}>{i + 1}.</div>
              <div style={{ flex: 1 }}>
                <Blank>Medicamento *</Blank>
                <SInput value={it.drug} onChange={(v) => setItem(i, { drug: v })} placeholder="Amoxicilina 500mg"
                  style={{ fontWeight: 600 }} />
              </div>
              <RowTools
                onUp={() => setForm({ items: move(form.items, i, -1) })}
                onDown={() => setForm({ items: move(form.items, i, 1) })}
                onDel={() => setForm({ items: form.items.length > 1 ? form.items.filter((_, j) => j !== i) : form.items })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr", gap: 10, paddingLeft: 24 }}>
              <div>
                <Blank>Apresentação</Blank>
                <SInput value={it.presentation} onChange={(v) => setItem(i, { presentation: v })} placeholder="cápsula" />
              </div>
              <div>
                <Blank>Quantidade</Blank>
                <SInput value={it.quantity} onChange={(v) => setItem(i, { quantity: v })} placeholder="21 cápsulas" />
              </div>
              <div>
                <Blank>Duração (dias)</Blank>
                <SInput value={it.durationDays} onChange={(v) => setItem(i, { durationDays: v.replace(/\D/g, "") })} placeholder="7" />
              </div>
            </div>
            <div style={{ paddingLeft: 24 }}>
              <Blank>Posologia *</Blank>
              <SInput value={it.posology} onChange={(v) => setItem(i, { posology: v })} placeholder="1 cápsula de 8 em 8 horas" />
            </div>
            <div style={{ paddingLeft: 24 }}>
              <Blank>Observações</Blank>
              <SInput value={it.notes} onChange={(v) => setItem(i, { notes: v })} placeholder="Após as refeições" />
            </div>
          </div>
        ))}
      </div>
      <button style={addBtn} onClick={() => setForm({ items: [...form.items, blankPrescItem()] })}>
        + Adicionar medicamento
      </button>

      <div style={{ marginTop: 24 }}>
        <div style={sectionTitle}>Instruções gerais</div>
        <SArea value={form.instructions} onChange={(v) => setForm({ instructions: v })} placeholder="Orientações ao paciente" />
      </div>

      {isControleEspecial(type) && (
        <div style={{ marginTop: 24, padding: 14, borderRadius: 10, background: color.primarySoft, border: `1px solid ${color.primarySoftBorder}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Controle especial · Portaria 344/98</div>
          <div style={{ fontSize: 11.5, color: color.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
            Duas vias (retenção na farmácia e orientação ao paciente). O endereço do paciente é obrigatório.
          </div>
          <Blank>Endereço do paciente *</Blank>
          <SInput value={form.patientAddress} onChange={(v) => setForm({ patientAddress: v })} placeholder="Rua, número, bairro, cidade/UF" />
        </div>
      )}
    </div>
  );
}

// ── Atestado ──
function AtestadoBody({ form, setForm }: { form: DocForm; setForm: (patch: Partial<DocForm>) => void }) {
  const inline: CSSProperties = { display: "inline-block", width: 120, borderBottom: `1px solid ${color.border}`, textAlign: "center" };
  return (
    <div>
      <div style={{ fontSize: 14, lineHeight: 2.2, color: color.text }}>
        Atesto, para os devidos fins, que o(a) paciente necessita de afastamento de suas atividades
        por{" "}
        <input
          value={form.days}
          onChange={(e) => setForm({ days: e.target.value.replace(/\D/g, "") })}
          placeholder="—"
          style={{ ...sheetInputBase, ...inline, width: 56, fontWeight: 600 }}
        />{" "}
        dia(s), a partir de{" "}
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ startDate: e.target.value })}
          style={{ ...sheetInputBase, ...inline, width: 150 }}
        />
        {form.startDate && (
          <span style={{ color: color.textMuted, fontSize: 12 }}> ({ymdToBR(form.startDate)})</span>
        )}
        .
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={sectionTitle}>Finalidade</div>
        <SInput value={form.purpose} onChange={(v) => setForm({ purpose: v })} placeholder="Justificativa de ausência" />
      </div>

      <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        <div style={{ minWidth: 140 }}>
          <div style={sectionTitle}>CID-10</div>
          <SInput value={form.cid10} onChange={(v) => setForm({ cid10: v })} placeholder="J00, M54.5…" />
        </div>
        <div style={{ paddingBottom: 4 }}>
          <Toggle on={form.discloseCid} onChange={(v) => setForm({ discloseCid: v })}
            label="Incluir CID no documento (com autorização do paciente)" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={sectionTitle}>Observações</div>
        <SArea value={form.observations} onChange={(v) => setForm({ observations: v })} />
      </div>
    </div>
  );
}

// ── Exame / Procedimento ──
function ExamBody({
  form,
  setForm,
  isMobile,
}: {
  form: DocForm;
  setForm: (patch: Partial<DocForm>) => void;
  isMobile: boolean;
}) {
  function setItem(i: number, patch: Partial<ExamItemForm>) {
    setForm({ examItems: form.examItems.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  }
  return (
    <div>
      <div style={sectionTitle}>Itens solicitados</div>
      <div style={{ display: "grid", gap: 16 }}>
        {form.examItems.map((it, i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, paddingBottom: 5 }}>{i + 1}.</div>
              <div style={{ flex: 1 }}>
                <Blank>Nome *</Blank>
                <SInput value={it.name} onChange={(v) => setItem(i, { name: v })} placeholder="Hemograma completo" style={{ fontWeight: 600 }} />
              </div>
              <RowTools
                onUp={() => setForm({ examItems: move(form.examItems, i, -1) })}
                onDown={() => setForm({ examItems: move(form.examItems, i, 1) })}
                onDel={() => setForm({ examItems: form.examItems.length > 1 ? form.examItems.filter((_, j) => j !== i) : form.examItems })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, paddingLeft: 24 }}>
              <div>
                <Blank>Código TUSS</Blank>
                <SInput value={it.code} onChange={(v) => setItem(i, { code: v })} placeholder="40304361" />
              </div>
              <div>
                <Blank>Quantidade</Blank>
                <SInput value={it.quantity} onChange={(v) => setItem(i, { quantity: v.replace(/\D/g, "") })} placeholder="1" />
              </div>
              <div>
                <Blank>Lateralidade</Blank>
                <select
                  value={it.laterality}
                  onChange={(e) => setItem(i, { laterality: e.target.value as ExamItemForm["laterality"] })}
                  style={{ ...sheetInputBase }}
                >
                  <option value="">—</option>
                  <option value="DIREITA">Direita</option>
                  <option value="ESQUERDA">Esquerda</option>
                  <option value="BILATERAL">Bilateral</option>
                </select>
              </div>
            </div>
            <div style={{ paddingLeft: 24 }}>
              <Blank>Justificativa</Blank>
              <SInput value={it.justification} onChange={(v) => setItem(i, { justification: v })} />
            </div>
          </div>
        ))}
      </div>
      <button style={addBtn} onClick={() => setForm({ examItems: [...form.examItems, blankExamItem()] })}>
        + Adicionar item
      </button>

      <div style={{ marginTop: 24 }}>
        <div style={sectionTitle}>Indicação clínica</div>
        <SArea value={form.clinicalIndication} onChange={(v) => setForm({ clinicalIndication: v })} />
      </div>

      <div style={{ marginTop: 18 }}>
        <Toggle on={form.urgent} onChange={(v) => setForm({ urgent: v })} label="Caráter urgente" />
      </div>
    </div>
  );
}
