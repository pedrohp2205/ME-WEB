// O nome do paciente só chega aqui quando ele autorizou aquela consulta, no
// momento de agendar. Sem autorização a API devolve patientName nulo, e o
// paciente é representado por um identificador curto derivado do UUID.

/** UUID -> código curto tipo "P-3F9A" (últimos 4 hex, maiúsculo). */
export function patientCode(patientId: string): string {
  const hex = patientId.replace(/-/g, "");
  return "P-" + hex.slice(-4).toUpperCase();
}

/** 2 caracteres para o avatar, a partir do UUID. */
export function patientInitials(patientId: string): string {
  const hex = patientId.replace(/-/g, "").toUpperCase();
  return hex.slice(0, 2);
}

/** Rótulo amigável: "Paciente P-3F9A". */
export function patientLabel(patientId: string): string {
  return "Paciente " + patientCode(patientId);
}

/** Nome autorizado, quando houver; senão o código curto. */
export function patientDisplayName(patientId: string, patientName?: string | null): string {
  return patientName?.trim() ? patientName : patientLabel(patientId);
}

/** Iniciais do nome autorizado, quando houver; senão as do UUID. */
export function patientDisplayInitials(patientId: string, patientName?: string | null): string {
  const name = patientName?.trim();
  if (!name) return patientInitials(patientId);
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
