// Limitação real do backend: AppointmentResponse traz apenas patientId (UUID),
// sem nome do paciente, e não há endpoint para o médico resolver essa identidade
// (o paciente é dono dos seus dados). Representamos o paciente por um identificador
// curto e estável derivado do UUID.

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
