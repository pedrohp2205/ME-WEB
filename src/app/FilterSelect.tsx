import { useEffect, useId, useRef, useState } from "react";
import { color, shadow } from "@/theme/tokens";

/**
 * Dropdown de filtro com o visual da marca: gatilho coral com degradê e uma
 * lista ancorada abaixo. Substitui as fileiras de pílulas (FilterPills).
 */
export function FilterSelect({
  options,
  value,
  onChange,
  labelOf,
  label,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  labelOf?: (v: string) => string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() => Math.max(0, options.indexOf(value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const text = (v: string) => (labelOf ? labelOf(v) : v);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Ao abrir, destaca a opção atual.
  useEffect(() => {
    if (open) setHighlight(Math.max(0, options.indexOf(value)));
  }, [open, value, options]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(options[highlight]);
    }
  }

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 190,
          height: 46,
          padding: "0 16px",
          border: "none",
          borderRadius: 14,
          background: color.primaryGradient,
          color: "#fff",
          fontFamily: "Poppins, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: shadow.card,
          transition: "transform .15s ease, filter .15s ease",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.filter = "brightness(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.filter = "none";
        }}
      >
        {label && (
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,.82)" }}>
            {label}
          </span>
        )}
        <span
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text(value)}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 100,
            listStyle: "none",
            margin: 0,
            padding: 6,
            minWidth: "100%",
            maxHeight: 320,
            overflowY: "auto",
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: 14,
            boxShadow: shadow.card,
          }}
        >
          {options.map((opt, i) => {
            const active = opt === value;
            const hot = i === highlight;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(opt)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? color.primary : color.text,
                  background: active ? color.primarySoft : hot ? color.muted : "transparent",
                  transition: "background .12s",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ flex: 1 }}>{text(opt)}</span>
                {active && <Check />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        flex: "none",
        transition: "transform .2s ease",
        transform: open ? "rotate(180deg)" : "none",
      }}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
