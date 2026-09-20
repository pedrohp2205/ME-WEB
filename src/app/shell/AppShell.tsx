import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { color, shadow } from "@/theme/tokens";
import { Icon, type IconName } from "@/app/icons";
import { MeBrand } from "@/app/MeLogo";
import { initials } from "@/lib/format/name";

interface NavDef {
  id: string;
  path: string;
  name: string;
  icon: IconName;
}

const NAV: NavDef[] = [
  { id: "inicio", path: "/", name: "Início", icon: "home" },
  { id: "agenda", path: "/agenda", name: "Agenda", icon: "cal" },
  { id: "consultas", path: "/consultas", name: "Consultas", icon: "clip" },
  { id: "documentos", path: "/documentos", name: "Documentos", icon: "doc" },
  { id: "modelos", path: "/modelos", name: "Modelos", icon: "layers" },
  { id: "acessos", path: "/acessos", name: "Acessos", icon: "key" },
];

const BOTTOM = ["inicio", "agenda", "consultas", "documentos"];

const SB_WIDTH = 284;
const CARD_RADIUS = 20;

/** Estilo base dos 3 cards do sidebar. */
const cardBase: React.CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: CARD_RADIUS,
  boxShadow: shadow.card,
};

// --------------------------------------------------------------------------- //
// Notificações — sem dados reais ainda. A estrutura já está pronta: basta
// popular NOTIFICATIONS para a lista renderizar (na sidebar e no sheet mobile).
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
  // /consultas ativo também em /consultas/:id
  return current === path || current.startsWith(path + "/");
}

/** Título da página atual, derivado da rota (nomes do NAV; páginas de detalhe
 *  usam o nome do pai, ex.: /consultas/:id -> "Consultas"). */
function pageTitle(current: string): string {
  if (isActive("/perfil", current)) return "Perfil";
  const match = NAV.find((it) => isActive(it.path, current));
  return match?.name ?? "Painel";
}

export function AppShell() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();

  const isMobile = width < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Em >=768 o sidebar é sempre visível e completo. Em <768 vira drawer.
  const sbTransform = isMobile
    ? sidebarOpen
      ? "translateX(0)"
      : "translateX(-105%)"
    : "translateX(0)";
  const mainML = isMobile ? 0 : SB_WIDTH;
  const mainPad = isMobile ? "18px" : "30px";

  function go(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  const current = location.pathname;
  const doctorName = doctor?.fullName ?? "Médico";
  const perfilActive = isActive("/perfil", current);
  const title = pageTitle(current);

  return (
    <div style={{ color: color.text, fontFamily: "Poppins, sans-serif" }}>
      {/* Sidebar: coluna de cards, com padding interno e gap. Não retrátil no
          desktop; drawer no mobile. */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: SB_WIDTH,
          background: color.appBg,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 16,
          // Rede de segurança: em telas MUITO baixas (o card de notificações já
          // no mínimo) o próprio sidebar rola, para o Perfil nunca sumir.
          overflowY: "auto",
          transform: sbTransform,
          transition: "transform .22s ease",
        }}
      >
        {/* Card 1 — Navegação (altura = conteúdo). A marca agora vive no header. */}
        <nav
          style={{
            ...cardBase,
            flex: "none",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: 8,
          }}
        >
          {NAV.map((it) => {
            const active = isActive(it.path, current);
            return (
              <button
                key={it.id}
                onClick={() => go(it.path)}
                title={it.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 46,
                  padding: "0 12px",
                  border: "none",
                  borderRadius: 999,
                  background: active ? color.primarySoft : "transparent",
                  color: active ? color.primary : color.text,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  transition: "background .18s",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={it.icon} size={20} />
                </span>
                <span>{it.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Card 2 — Notificações (cresce e encolhe primeiro). Fora do drawer mobile. */}
        {!isMobile && (
          <section
            style={{
              ...cardBase,
              flex: 1,
              minHeight: 96,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: 14,
            }}
          >
            <div style={{ flex: "none", padding: "2px 4px 10px" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: color.text }}>Notificações</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <NotificationList items={NOTIFICATIONS} />
            </div>
          </section>
        )}

        {/* Card 3 — Perfil (fixo, um pouco mais alto). No mobile fica no fim do drawer. */}
        <button
          onClick={() => go("/perfil")}
          aria-label={`Perfil de ${doctorName}`}
          title={doctorName}
          style={{
            ...cardBase,
            flex: "none",
            marginTop: isMobile ? "auto" : 0,
            minHeight: 84,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 14px",
            border: `1px solid ${perfilActive ? color.primary : color.border}`,
            background: perfilActive ? color.primarySoft : color.surface,
            cursor: "pointer",
            textAlign: "left",
            transition: "background .18s, border-color .18s",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: 999,
              background: color.primaryGradient,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {initials(doctorName)}
          </span>
          <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: color.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {doctorName}
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: color.textMuted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 2,
              }}
            >
              {doctor?.crm ?? "Médico"}
            </span>
          </span>
        </button>
      </aside>

      {/* Overlay do drawer (mobile) */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(33,30,28,.34)", zIndex: 55 }}
        />
      )}

      {/* Área principal */}
      <div
        style={{
          marginLeft: mainML,
          transition: "margin-left .22s ease",
          minHeight: "100vh",
          paddingBottom: isMobile ? 76 : 20,
          background: color.appBg,
        }}
      >
        {/* Topbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 68,
            padding: `0 ${mainPad}`,
            background: color.appBg,
          }}
        >
          {/* Botão de menu: só no mobile (abre o drawer) */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Alternar navegação"
              style={{
                width: 40,
                height: 40,
                flex: "none",
                border: `1px solid ${color.border}`,
                borderRadius: 999,
                background: color.surface,
                color: color.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="menu" />
            </button>
          )}

          {/* Marca "me Saúde" + nome da página atual */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <MeBrand height={28} labelSize={14} showLabel={!isMobile} />
            <span aria-hidden style={{ width: 1, height: 22, background: color.border, flex: "none" }} />
            <span
              style={{
                fontSize: isMobile ? 16 : 18,
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
          </div>

          <div style={{ flex: 1 }} />

          {/* Sino: só no mobile (no desktop as notificações estão no sidebar) */}
          {isMobile && (
            <button
              onClick={() => setNotifOpen(true)}
              aria-label="Notificações"
              style={{
                position: "relative",
                width: 40,
                height: 40,
                flex: "none",
                border: `1px solid ${color.border}`,
                borderRadius: 999,
                background: color.surface,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color.text,
              }}
            >
              <Icon name="bell" />
            </button>
          )}
        </header>

        <main style={{ padding: mainPad, maxWidth: 1280, margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>

      {/* Sheet de notificações (mobile) */}
      {isMobile && notifOpen && (
        <>
          <div
            onClick={() => setNotifOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(33,30,28,.34)", zIndex: 70 }}
          />
          <div
            role="dialog"
            aria-label="Notificações"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 71,
              background: color.surface,
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              boxShadow: shadow.modal,
              maxHeight: "72vh",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 22px",
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
                onClick={() => setNotifOpen(false)}
                aria-label="Fechar"
                style={{
                  width: 34,
                  height: 34,
                  flex: "none",
                  border: `1px solid ${color.border}`,
                  borderRadius: 999,
                  background: color.surface,
                  color: color.text,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloseGlyph />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 80, overflowY: "auto" }}>
              <NotificationList items={NOTIFICATIONS} />
            </div>
          </div>
        </>
      )}

      {/* Bottom nav mobile */}
      {isMobile && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: "rgba(255,255,255,.94)",
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${color.border}`,
            padding: "8px 8px 10px",
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          {BOTTOM.map((id) => {
            const it = NAV.find((n) => n.id === id)!;
            const active = isActive(it.path, current);
            return (
              <button
                key={id}
                onClick={() => go(it.path)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 4px",
                  border: "none",
                  background: "none",
                  color: active ? color.primary : color.textMuted,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  minHeight: 48,
                }}
              >
                <Icon name={it.icon} size={21} />
                {it.name}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Lista de notificações + item + empty state (reusados na sidebar e no sheet)
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
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 12,
            lineHeight: 1.45,
            color: color.textMuted,
          }}
        >
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

/** X simples (não existe no set de ícones; usado só no header do sheet). */
function CloseGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
