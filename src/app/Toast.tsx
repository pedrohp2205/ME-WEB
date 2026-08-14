import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { color } from "@/theme/tokens";

type ToastKind = "ok" | "err";
interface ToastState {
  msg: string;
  kind: ToastKind;
}

interface ToastApi {
  toast(msg: string, kind?: ToastKind): void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Pílula de toast — reproduz o toast do protótipo (fixo embaixo, centralizado).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setState({ msg, kind });
    timer.current = setTimeout(() => setState(null), 2800);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {state && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            borderRadius: 999,
            background: color.ink,
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 8px 24px rgba(33,30,28,0.24)",
            animation: "up .2s ease-out",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              flex: "none",
              borderRadius: 999,
              background: state.kind === "err" ? color.danger : color.tealAlt,
            }}
          />
          {state.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>.");
  return ctx;
}
