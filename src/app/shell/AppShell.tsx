import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { useTheme } from "@/theme/ThemeContext";
import { color, radius, shadow } from "@/theme/tokens";
import { Icon, type IconName } from "@/app/icons";
import { MeBrand, MeLogo } from "@/app/MeLogo";
import { initials } from "@/lib/format/name";

interface NavDef {
  id: string;
  path: string;
  name: string;
  icon: IconName;
}

interface NavSection {
  label: string;
  items: NavDef[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Atendimento",
    items: [
      { id: "inicio", path: "/", name: "Início", icon: "home" },
      { id: "agenda", path: "/agenda", name: "Agenda", icon: "cal" },
      { id: "consultas", path: "/consultas", name: "Consultas", icon: "clip" },
    ],
  },
  {
    label: "Registros",
    items: [
      { id: "documentos", path: "/documentos", name: "Documentos", icon: "doc" },
      { id: "modelos", path: "/modelos", name: "Modelos", icon: "layers" },
      { id: "acessos", path: "/acessos", name: "Acessos", icon: "key" },
    ],
  },
];
const NAV_ALL: NavDef[] = NAV_SECTIONS.flatMap((s) => s.items);

// Larguras do painel por nível + respiro ao redor (o painel "flutua").
const SB_FULL = 264;
const SB_RAIL = 76;
const INSET = 16;
const PANEL_RADIUS = 20;

// Breakpoints: >=1440 completo · 768–1439 rail (só ícones) · <768 drawer.
const BP_FULL = 1440;
const BP_RAIL = 768;

// --------------------------------------------------------------------------- //
// Notificações — sem dados reais ainda; a estrutura já renderiza a lista/vazio.
// --------------------------------------------------------------------------- //
interface NotificationItem {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  time: string;
}
const NOTIFICATIONS: NotificationItem[] = [];

function isActive(path: string, current: string): boolean {
  if (path === "/") return current === "/";
  return current === path || current.startsWith(path + "/");
}

function pageTitle(current: string): string {
  if (isActive("/perfil", current)) return "Perfil";
  const match = NAV_ALL.find((it) => isActive(it.path, current));
  return match?.name ?? "Painel";
}

type Mode = "full" | "rail" | "mobile";

export function AppShell() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();

  const mode: Mode = width >= BP_FULL ? "full" : width >= BP_RAIL ? "rail" : "mobile";
  const isMobile = mode === "mobile";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  function go(path: string) {
    navigate(path);
    setDrawerOpen(false);
  }

  const current = location.pathname;
  const title = pageTitle(current);
  const gutter = isMobile ? 18 : 26;

  // Margem do conteúdo conforme a largura do painel em cada nível.
  const mainML = isMobile ? 0 : INSET + (mode === "rail" ? SB_RAIL : SB_FULL) + INSET;

  // Variante visual do painel: rail no médio; completo no grande e no drawer.
  const sidebarVariant: "full" | "rail" = mode === "rail" ? "rail" : "full";
  const panelWidth = sidebarVariant === "rail" ? SB_RAIL : SB_FULL;

  const asideTransform = isMobile
    ? drawerOpen
      ? "translateX(0)"
      : `translateX(calc(-100% - ${INSET * 2}px))`
    : "translateX(0)";

  return (
    <div style={{ color: color.text, fontFamily: "Poppins, sans-serif" }}>
      {/* Painel lateral único, arredondado e flutuante (não retrátil). */}
      <aside
        style={{
          position: "fixed",
          top: INSET,
          left: INSET,
          bottom: INSET,
          width: panelWidth,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: PANEL_RADIUS,
          boxShadow: shadow.card,
          transform: asideTransform,
          transition: "transform .24s ease, width .2s ease",
        }}
      >
        <SidebarPanel
          variant={sidebarVariant}
          current={current}
          doctor={doctor}
          onNavigate={go}
        />
      </aside>

      {/* Overlay do drawer (mobile) */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,16,13,.5)", zIndex: 55 }}
        />
      )}

      {/* Área principal */}
      <div
        style={{
          marginLeft: mainML,
          transition: "margin-left .24s ease",
          minHeight: "100vh",
          paddingBottom: 20,
          background: color.appBg,
        }}
      >
        {/* Topbar: hambúrguer (mobile) + título + sino (todos os tamanhos). */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 68,
            padding: `0 ${gutter}px`,
            background: color.appBg,
          }}
        >
          {isMobile && (
            <IconCircleButton label="Abrir navegação" onClick={() => setDrawerOpen(true)}>
              <Icon name="menu" />
            </IconCircleButton>
          )}

          <span
            style={{
              fontSize: isMobile ? 17 : 19,
              fontWeight: 600,
              color: color.text,
              letterSpacing: "-.3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </span>

          <div style={{ flex: 1 }} />

          <IconCircleButton label="Notificações" onClick={() => setNotifOpen((v) => !v)}>
            <Icon name="bell" />
          </IconCircleButton>
        </header>

        <main style={{ padding: gutter }}>
          <Outlet />
        </main>
      </div>

      {/* Painel de notificações — aberto pelo sino, em todos os tamanhos. */}
      {notifOpen && (
        <NotificationsPanel gutter={gutter} isMobile={isMobile} onClose={() => setNotifOpen(false)} />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Conteúdo do painel lateral (completo ou rail)
// --------------------------------------------------------------------------- //
function SidebarPanel({
  variant,
  current,
  doctor,
  onNavigate,
}: {
  variant: "full" | "rail";
  current: string;
  doctor: ReturnType<typeof useAuth>["doctor"];
  onNavigate: (path: string) => void;
}) {
  const rail = variant === "rail";
  const doctorName = doctor?.fullName ?? "Médico";
  const registro =
    `${doctor?.council ?? ""} ${doctor?.councilNumber ?? doctor?.crm ?? ""}`.trim() || "Profissional";

  return (
    <>
      {/* Marca */}
      <div
        style={{
          flex: "none",
          display: "flex",
          justifyContent: rail ? "center" : "flex-start",
          padding: rail ? "18px 0 12px" : "20px 20px 14px",
        }}
      >
        {rail ? <MeLogo height={30} /> : <MeBrand height={30} labelSize={15} />}
      </div>

      {/* Navegação */}
      <nav
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: rail ? "visible" : "auto",
          overflowX: "visible",
          display: "flex",
          flexDirection: "column",
          gap: rail ? 6 : 14,
          padding: rail ? "4px 0" : "4px 12px 8px",
          alignItems: rail ? "center" : "stretch",
        }}
      >
        {NAV_SECTIONS.map((section, si) => (
          <div
            key={section.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: rail ? 6 : 4,
              alignItems: rail ? "center" : "stretch",
              width: "100%",
            }}
          >
            {rail
              ? si > 0 && (
                  <span
                    aria-hidden
                    style={{ width: 28, height: 1, background: color.border, margin: "4px 0" }}
                  />
                )
              : (
                <span
                  style={{
                    padding: "6px 12px 2px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: ".8px",
                    textTransform: "uppercase",
                    color: color.textFaint,
                  }}
                >
                  {section.label}
                </span>
              )}

            {section.items.map((it) => {
              const active = isActive(it.path, current);
              return rail ? (
                <RailButton
                  key={it.id}
                  label={it.name}
                  active={active}
                  onClick={() => onNavigate(it.path)}
                >
                  <Icon name={it.icon} size={21} />
                </RailButton>
              ) : (
                <NavItemFull
                  key={it.id}
                  item={it}
                  active={active}
                  onClick={() => onNavigate(it.path)}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* Rodapé: card de perfil (degradê) + toggle de tema */}
      <div
        style={{
          flex: "none",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: rail ? "10px 0 14px" : "10px 14px 16px",
          alignItems: rail ? "center" : "stretch",
        }}
      >
        {rail ? (
          <>
            <RailAvatar name={doctorName} onClick={() => onNavigate("/perfil")} />
            <ThemeToggleRail />
          </>
        ) : (
          <>
            <ProfileCard
              name={doctorName}
              registro={registro}
              onVerPerfil={() => onNavigate("/perfil")}
            />
            <ThemeToggleFull />
          </>
        )}
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- //
// Itens de navegação
// --------------------------------------------------------------------------- //
function NavItemFull({
  item,
  active,
  onClick,
}: {
  item: NavDef;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 44,
        padding: "0 12px",
        border: "none",
        borderRadius: radius.controlSm,
        background: active ? color.primarySoft : hover ? color.muted : "transparent",
        color: active ? color.primary : color.text,
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        transition: "background .16s, color .16s",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ width: 22, display: "grid", placeItems: "center", flex: "none" }}>
        <Icon name={item.icon} size={20} variant={active ? "solid" : "outline"} />
      </span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.name}
      </span>
    </button>
  );
}

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={label}
        style={{
          width: 46,
          height: 46,
          border: "none",
          borderRadius: 14,
          background: active ? color.primarySoft : hover ? color.muted : "transparent",
          color: active ? color.primary : color.text,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          transition: "background .16s, color .16s",
        }}
      >
        {children}
      </button>
      {hover && <Tooltip label={label} />}
    </div>
  );
}

/** Tooltip do rail — aparece à direita do ícone. */
function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      style={{
        position: "absolute",
        left: "calc(100% + 12px)",
        top: "50%",
        transform: "translateY(-50%)",
        background: color.ink,
        color: "#fff",
        fontSize: 12,
        fontWeight: 500,
        padding: "6px 10px",
        borderRadius: 8,
        whiteSpace: "nowrap",
        boxShadow: shadow.card,
        pointerEvents: "none",
        zIndex: 90,
      }}
    >
      {label}
    </span>
  );
}

// --------------------------------------------------------------------------- //
// Card de perfil (degradê) + avatar do rail
// --------------------------------------------------------------------------- //
function ProfileCard({
  name,
  registro,
  onVerPerfil,
}: {
  name: string;
  registro: string;
  onVerPerfil: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        background: color.primaryGradient,
        borderRadius: 18,
        padding: 14,
        color: "#fff",
        boxShadow: shadow.card,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span
          style={{
            width: 42,
            height: 42,
            flex: "none",
            borderRadius: 999,
            background: "rgba(255,255,255,.22)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {initials(name)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "rgba(255,255,255,.85)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 1,
            }}
          >
            {registro}
          </div>
        </div>
      </div>
      <button
        onClick={onVerPerfil}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          marginTop: 12,
          width: "100%",
          height: 36,
          border: "none",
          borderRadius: 999,
          background: hover ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.18)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background .16s",
        }}
      >
        Ver perfil
      </button>
    </div>
  );
}

function RailAvatar({ name, onClick }: { name: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={`Ver perfil de ${name}`}
        style={{
          width: 46,
          height: 46,
          flex: "none",
          border: "none",
          borderRadius: 999,
          background: color.primaryGradient,
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          boxShadow: shadow.card,
        }}
      >
        {initials(name)}
      </button>
      {hover && <Tooltip label="Ver perfil" />}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Toggle de tema (claro/escuro)
// --------------------------------------------------------------------------- //
function ThemeToggleFull() {
  const { theme, setTheme } = useTheme();
  const seg = (t: "light" | "dark", label: string, icon: IconName) => {
    const on = theme === t;
    return (
      <button
        key={t}
        onClick={() => setTheme(t)}
        aria-pressed={on}
        style={{
          flex: 1,
          height: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          border: "none",
          borderRadius: 999,
          background: on ? color.surface : "transparent",
          color: on ? color.primary : color.textMuted,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: on ? shadow.card : "none",
          transition: "background .16s, color .16s",
        }}
      >
        <Icon name={icon} size={16} variant={on ? "solid" : "outline"} />
        {label}
      </button>
    );
  };
  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        padding: 3,
        borderRadius: 999,
        background: color.muted,
        border: `1px solid ${color.border}`,
      }}
    >
      {seg("light", "Claro", "sun")}
      {seg("dark", "Escuro", "moon")}
    </div>
  );
}

function ThemeToggleRail() {
  const { theme, toggleTheme } = useTheme();
  const [hover, setHover] = useState(false);
  const dark = theme === "dark";
  const label = dark ? "Tema claro" : "Tema escuro";
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={label}
        style={{
          width: 46,
          height: 46,
          border: `1px solid ${color.border}`,
          borderRadius: 14,
          background: color.muted,
          color: color.text,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <Icon name={dark ? "sun" : "moon"} size={19} />
      </button>
      {hover && <Tooltip label={label} />}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Botão-ícone circular (topbar) + painel de notificações (popover)
// --------------------------------------------------------------------------- //
function IconCircleButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 40,
        height: 40,
        flex: "none",
        border: `1px solid ${color.border}`,
        borderRadius: 999,
        background: color.surface,
        color: color.text,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
      }}
    >
      {children}
    </button>
  );
}

function NotificationsPanel({
  gutter,
  isMobile,
  onClose,
}: {
  gutter: number;
  isMobile: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
      <div
        role="dialog"
        aria-label="Notificações"
        style={{
          position: "fixed",
          top: 62,
          right: gutter,
          zIndex: 71,
          width: isMobile ? `calc(100vw - ${gutter * 2}px)` : 360,
          maxWidth: 400,
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: PANEL_RADIUS,
          boxShadow: shadow.modal,
          padding: "14px 14px 16px",
          animation: "up .18s ease-out",
        }}
      >
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: color.text }}>Notificações</span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 32,
              height: 32,
              flex: "none",
              border: `1px solid ${color.border}`,
              borderRadius: 999,
              background: color.surface,
              color: color.text,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 80, overflowY: "auto" }}>
          <NotificationList items={NOTIFICATIONS} />
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------------------------- //
// Lista de notificações + item + empty state
// --------------------------------------------------------------------------- //
function NotificationList({ items }: { items: NotificationItem[] }) {
  if (items.length === 0) return <NotificationsEmpty />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((n) => (
        <NotificationRow key={n.id} item={n} />
      ))}
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: 10,
        borderRadius: 14,
        background: color.muted,
        border: `1px solid ${color.border}`,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          flex: "none",
          borderRadius: 999,
          background: color.primarySoft,
          color: color.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={item.icon} size={16} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: color.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.title}
          </span>
          <span style={{ fontSize: 11, color: color.textFaint, flex: "none" }}>{item.time}</span>
        </div>
        <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: 1.45, color: color.textMuted }}>
          {item.description}
        </p>
      </div>
    </div>
  );
}

function NotificationsEmpty() {
  return (
    <div
      style={{
        height: "100%",
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 10,
        padding: "16px 8px",
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: color.muted,
          color: color.textMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="bell" size={22} />
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: color.text }}>Você está em dia</div>
        <div style={{ fontSize: 12, color: color.textMuted, marginTop: 2 }}>
          Nenhuma notificação por enquanto.
        </div>
      </div>
    </div>
  );
}
