// Dispositivos confiáveis do 2FA (o painel só LISTA e REVOGA).
import { api } from "./http";

export interface TrustedDevice {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

export function listTrustedDevices(): Promise<TrustedDevice[]> {
  return api.get<TrustedDevice[]>("/auth/trusted-devices");
}

export function revokeTrustedDevice(id: string): Promise<void> {
  return api.del<void>(`/auth/trusted-devices/${id}`);
}
