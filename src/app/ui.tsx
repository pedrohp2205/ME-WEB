import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { color, radius, shadow } from "@/theme/tokens";

/** Cartão branco padrão (borda + sombra suave), como no protótipo. */
export function Card({
  children,
  style,
  padding = 22,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padding?: number;
}) {
  return (
    <div
      style={{
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.card,
        padding,
        boxShadow: shadow.card,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>{children}</h2>
  );
}

const controlBase: CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  border: `1px solid ${color.border}`,
  borderRadius: radius.control,
  background: color.muted,
  fontSize: 14,
  color: color.text,
  outline: "none",
};

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          color: color.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: color.textFaint, marginTop: 6, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return <input {...rest} style={{ ...controlBase, ...style }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { style, ...rest } = props;
  return (
    <textarea
      {...rest}
      style={{
        width: "100%",
        minHeight: 96,
        padding: "12px 14px",
        border: `1px solid ${color.border}`,
        borderRadius: radius.control,
        background: color.muted,
        fontSize: 14,
        lineHeight: 1.6,
        color: color.text,
        outline: "none",
        resize: "vertical",
        fontFamily: "Poppins, sans-serif",
        ...style,
      }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { style, children, ...rest } = props;
  return (
    <select {...rest} style={{ ...controlBase, padding: "0 12px", ...style }}>
      {children}
    </select>
  );
}

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
}

export function PrimaryButton({ children, onClick, disabled, type = "button", style }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 46,
        padding: "0 22px",
        border: "none",
        borderRadius: radius.pill,
        background: color.primary,
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, type = "button", style }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 46,
        padding: "0 20px",
        border: `1px solid ${color.border}`,
        borderRadius: radius.pill,
        background: color.surface,
        color: color.text,
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Chip({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 12px",
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 4px",
        border: "none",
        background: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          position: "relative",
          width: 44,
          height: 24,
          flex: "none",
          borderRadius: 999,
          background: on ? color.primary : color.border,
          transition: "background .18s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "#fff",
            transition: "left .18s",
          }}
        />
      </span>
      <span style={{ fontSize: 13, color: color.text, lineHeight: 1.4 }}>{label}</span>
    </button>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 600, letterSpacing: "-.6px" }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 14, color: color.textMuted }}>{subtitle}</p>
      )}
    </div>
  );
}
