// Helpers de data/hora para a Agenda.
// Backend: OffsetDateTime (ISO), LocalTime "HH:mm", DayOfWeek MAIÚSCULO.

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const DAY_ABBR: Record<DayOfWeek, string> = {
  MONDAY: "Seg",
  TUESDAY: "Ter",
  WEDNESDAY: "Qua",
  THURSDAY: "Qui",
  FRIDAY: "Sex",
  SATURDAY: "Sáb",
  SUNDAY: "Dom",
};

// getDay(): 0=Dom..6=Sáb
const JS_TO_DOW: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function dayLabel(d: DayOfWeek): string {
  return DAY_LABEL[d];
}
export function dayAbbr(d: DayOfWeek): string {
  return DAY_ABBR[d];
}
export function dowFromDate(date: Date): DayOfWeek {
  return JS_TO_DOW[date.getDay()];
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** Date local -> "YYYY-MM-DD". */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY". */
export function ymdToBR(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

/** ISO OffsetDateTime -> Date. */
export function parseISO(iso: string): Date {
  return new Date(iso);
}

/** ISO -> "HH:mm" no fuso local. */
export function timeLocal(iso: string): string {
  const d = new Date(iso);
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** ISO -> "DD/MM/YYYY" no fuso local. */
export function dateBR(iso: string): string {
  const d = new Date(iso);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** ISO -> "YYYY-MM-DD" no fuso local (para agrupar por dia). */
export function isoDateLocal(iso: string): string {
  return isoDate(new Date(iso));
}

/** LocalTime do backend ("08:00" ou "08:00:00") -> "HH:mm". */
export function hhmm(time: string): string {
  return time.slice(0, 5);
}

/**
 * Combina data ("YYYY-MM-DD") + hora ("HH:mm") em ISO OffsetDateTime.
 * new Date("...T...") interpreta no fuso local; toISOString() gera UTC (offset Z),
 * que é um OffsetDateTime válido para o backend.
 */
export function combineToISO(ymd: string, hm: string): string {
  return new Date(`${ymd}T${hm}`).toISOString();
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Date -> "quinta-feira, 14 de agosto". */
export function longDayLabel(date: Date): string {
  const dow = dayLabel(dowFromDate(date)).toLowerCase();
  return `${dow}, ${date.getDate()} de ${MESES[date.getMonth()]}`;
}

/** Segunda-feira da semana que contém `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Dom
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function today0(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
