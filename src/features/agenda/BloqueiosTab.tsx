import { useState } from "react";
import { useAsync } from "@/lib/useAsync";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { useToast } from "@/app/Toast";
import * as scheduleApi from "@/lib/api/schedule";
import { ApiError } from "@/lib/api/errors";
import { Card, Field, PrimaryButton, SectionTitle, TextInput } from "@/app/ui";
import { ErrorBox } from "@/features/consultas/ConsultasPage";
import {
  addDays,
  combineToISO,
  dateBR,
  isoDate,
  timeLocal,
  today0,
} from "@/lib/format/datetime";
import { color, radius } from "@/theme/tokens";

function msg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export function BloqueiosTab({
  doctorId,
  onCreated,
}: {
  doctorId: string;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const width = useWindowWidth();
  const cols = width >= 768 ? "repeat(4,minmax(0,1fr))" : "1fr";

  const breaks = useAsync(() => scheduleApi.getBreaks(doctorId), [doctorId]);

  const [date, setDate] = useState(isoDate(addDays(today0(), 1)));
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function addBreak() {
    if (end <= start) {
      toast("O horário final deve ser maior que o inicial.", "err");
      return;
    }
    setSaving(true);
    try {
      await scheduleApi.createBreak(doctorId, {
        startDatetime: combineToISO(date, start),
        endDatetime: combineToISO(date, end),
        reason: reason.trim() || null,
      });
      toast("Bloqueio criado. Os horários saíram da agenda.");
      breaks.reload();
      onCreated?.();
    } catch (e) {
      toast(msg(e, "Não foi possível criar o bloqueio."), "err");
    } finally {
      setSaving(false);
    }
  }

  async function removeBreak(id: string) {
    try {
      await scheduleApi.deleteBreak(doctorId, id);
      toast("Bloqueio removido.");
      breaks.reload();
      onCreated?.();
    } catch (e) {
      toast(msg(e, "Não foi possível remover o bloqueio."), "err");
    }
  }

  const sorted = [...(breaks.data ?? [])].sort((a, b) =>
    a.startDatetime.localeCompare(b.startDatetime),
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <SectionTitle>Novo bloqueio</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, alignItems: "end" }}>
          <Field label="Data">
            <TextInput
              type="date"
              value={date}
              min={isoDate(today0())}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Início">
            <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Fim">
            <TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Field label="Motivo">
            <TextInput
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Almoço, congresso…"
            />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={addBreak} disabled={saving}>
            {saving ? "Criando…" : "Criar bloqueio"}
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <SectionTitle>Bloqueios</SectionTitle>
        {breaks.loading && <div style={{ fontSize: 13, color: color.textMuted }}>Carregando…</div>}
        {breaks.error && <ErrorBox message={breaks.error} onRetry={breaks.reload} />}
        {!breaks.loading && !breaks.error && (
          <div style={{ display: "grid", gap: 10 }}>
            {sorted.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.control,
                  background: color.muted,
                }}
              >
                <span style={{ minWidth: 96, fontSize: 13, fontWeight: 600 }}>
                  {dateBR(b.startDatetime)}
                </span>
                <span style={{ fontSize: 13 }}>
                  {timeLocal(b.startDatetime)} — {timeLocal(b.endDatetime)}
                </span>
                <span style={{ fontSize: 12, color: color.textMuted }}>
                  {b.reason || "Sem motivo"}
                </span>
                <button
                  onClick={() => removeBreak(b.id)}
                  style={{
                    marginLeft: "auto",
                    height: 34,
                    padding: "0 14px",
                    border: `1px solid ${color.border}`,
                    borderRadius: 999,
                    background: color.surface,
                    color: color.danger,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
            {sorted.length === 0 && (
              <div
                style={{
                  padding: 26,
                  textAlign: "center",
                  border: `1px dashed ${color.border}`,
                  borderRadius: radius.control,
                  fontSize: 13,
                  color: color.textMuted,
                }}
              >
                Nenhum bloqueio criado.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
