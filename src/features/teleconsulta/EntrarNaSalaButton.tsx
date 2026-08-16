import { useNavigate } from "react-router-dom";
import { color } from "@/theme/tokens";

/** Leva o médico para a sala embutida. Usado no detalhe e no modal da consulta. */
export function EntrarNaSalaButton({ appointmentId }: { appointmentId: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/consultas/${appointmentId}/sala`)}
      style={{
        height: 32,
        padding: "0 16px",
        border: "none",
        borderRadius: 999,
        background: color.tealSoft,
        color: color.teal,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Entrar na sala
    </button>
  );
}
