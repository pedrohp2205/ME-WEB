import { useState } from "react";
import { useAsync } from "@/lib/useAsync";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { useToast } from "@/app/Toast";
import * as scheduleApi from "@/lib/api/schedule";
import { ApiError } from "@/lib/api/errors";
import {
  Card,
  Field,
  PrimaryButton,
  SectionTitle,
  Select,
  TextInput,
} from "@/app/ui";
import { ErrorBox } from "@/features/consultas/ConsultasPage";
import {
  DAY_ORDER,
  dayLabel,
  dayAbbr,
  hhmm,
  isoDate,
  addDays,
  today0,
  longDayLabel,
  dowFromDate,
  type DayOfWeek,
} from "@/lib/format/datetime";
import { color, radius } from "@/theme/tokens";

function toMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}
function msg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export function HorariosTab({ doctorId }: { doctorId: string }) {
  const { toast } = useToast();
  const width = useWindowWidth();
  const cols = width >= 768 ? "repeat(4,minmax(0,1fr))" : "1fr";

  const settings = useAsync(() => scheduleApi.getSettings(doctorId), [doctorId]);

  const [dow, setDow] = useState<DayOfWeek>("TUESDAY");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("12:00");
  const [slot, setSlot] = useState("30");
  const [saving, setSaving] = useState(false);

  // dia selecionado para ver slots livres (offset a partir de hoje)
  const [slotDay, setSlotDay] = useState(0);
  const slotDate = isoDate(addDays(today0(), slotDay));
  const slots = useAsync(
    () => scheduleApi.getAvailableSlots(doctorId, slotDate),
    [doctorId, slotDate],
  );

  async function addWindow() {
    const dur = Number(slot);
    if (toMin(end) <= toMin(start)) {
      toast("O horário final deve ser maior que o inicial.", "err");
      return;
    }
    if (!Number.isFinite(dur) || dur < 1) {
      toast("Informe uma duração de slot válida (minutos).", "err");
      return;
    }
    setSaving(true);
    try {
      await scheduleApi.createSettings(doctorId, {
        dayOfWeek: dow,
        startTime: start,
        endTime: end,
        slotDuration: dur,
      });
      toast("Janela semanal criada.");
      settings.reload();
    } catch (e) {
      toast(msg(e, "Não foi possível criar a janela."), "err");
    } finally {
      setSaving(false);
    }
  }

  async function removeWindow(id: string) {
    try {
      await scheduleApi.deleteSettings(doctorId, id);
      toast("Janela removida.");
      settings.reload();
    } catch (e) {
      toast(msg(e, "Não foi possível remover a janela."), "err");
    }
  }

  const sortedSettings = [...(settings.data ?? [])].sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek) ||
      a.startTime.localeCompare(b.startTime),
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Nova janela */}
      <Card>
        <SectionTitle>Nova janela semanal</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, alignItems: "end" }}>
          <Field label="Dia da semana">
            <Select value={dow} onChange={(e) => setDow(e.target.value as DayOfWeek)}>
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Início">
            <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Fim">
            <TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Field label="Slot (min)">
            <TextInput
              inputMode="numeric"
              value={slot}
              onChange={(e) => setSlot(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={addWindow} disabled={saving}>
            {saving ? "Adicionando…" : "Adicionar janela"}
          </PrimaryButton>
        </div>
      </Card>

      {/* Janelas configuradas */}
      <Card>
        <SectionTitle>Janelas configuradas</SectionTitle>
        {settings.loading && <div style={{ fontSize: 13, color: color.textMuted }}>Carregando…</div>}
        {settings.error && <ErrorBox message={settings.error} onRetry={settings.reload} />}
        {!settings.loading && !settings.error && (
          <div style={{ display: "grid", gap: 10 }}>
            {sortedSettings.map((w) => {
              const qtd = Math.floor(
                (toMin(hhmm(w.endTime)) - toMin(hhmm(w.startTime))) / (w.slotDuration || 30),
              );
              return (
                <div
                  key={w.id}
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
                  <span style={{ minWidth: 84, fontSize: 13, fontWeight: 600 }}>
                    {dayLabel(w.dayOfWeek)}
                  </span>
                  <span style={{ fontSize: 13 }}>
                    {hhmm(w.startTime)} — {hhmm(w.endTime)}
                  </span>
                  <span style={{ fontSize: 12, color: color.textMuted }}>
                    {w.slotDuration} min · {qtd} slots
                  </span>
                  <button
                    onClick={() => removeWindow(w.id)}
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
              );
            })}
            {sortedSettings.length === 0 && (
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
                Nenhuma janela configurada. Sem janelas, os pacientes não veem horários livres.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Horários livres (como o paciente vê) */}
      <Card>
        <SectionTitle>Horários livres (como o paciente vê)</SectionTitle>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: color.textMuted }}>
          Janelas menos bloqueios e consultas já agendadas.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = addDays(today0(), i);
            const on = slotDay === i;
            return (
              <button
                key={i}
                onClick={() => setSlotDay(i)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  border: `1px solid ${on ? color.primary : color.border}`,
                  borderRadius: 999,
                  background: on ? color.primarySoft : color.surface,
                  color: on ? color.primary : color.textMuted,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {i === 0 ? "Hoje" : `${dayAbbr(dowFromDate(d))} ${d.getDate()}`}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: color.textMuted, marginBottom: 10 }}>
          {longDayLabel(addDays(today0(), slotDay))}
        </div>
        {slots.loading && <div style={{ fontSize: 13, color: color.textMuted }}>Carregando…</div>}
        {slots.error && <ErrorBox message={slots.error} onRetry={slots.reload} />}
        {!slots.loading && !slots.error && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {slots.data?.map((s) => (
                <span
                  key={s.startDatetime}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 999,
                    background: color.tealSoft,
                    color: color.teal,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {slotTime(s.startDatetime)}
                </span>
              ))}
            </div>
            {(slots.data?.length ?? 0) === 0 && (
              <div
                style={{
                  padding: 20,
                  border: `1px dashed ${color.border}`,
                  borderRadius: radius.control,
                  fontSize: 13,
                  color: color.textMuted,
                }}
              >
                Nenhum horário livre neste dia.
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function slotTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
