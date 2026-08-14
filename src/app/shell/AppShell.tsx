import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { color, shadow } from "@/theme/tokens";
import { Icon, type IconName } from "@/app/icons";
import { MeLogo } from "@/app/MeLogo";
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

function isActive(path: string, current: string): boolean {
  if (path === "/") return current === "/";
  // /consultas ativo também em /consultas/:id
  return current === path || current.startsWith(path + "/");
}

export function AppShell() {
  const { doctor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const [collapsedDesktop, setCollapsedDesktop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const collapsed = isTablet ? true : collapsedDesktop;
  const showLabels = isMobile || !collapsed;

  const sbW = isMobile ? 284 : collapsed ? 76 : 268;
  const sbTransform = isMobile
    ? sidebarOpen
      ? "translateX(0)"
      : "translateX(-105%)"
    : "translateX(0)";
  const mainML = isMobile ? 0 : sbW;
  const mainPad = isMobile ? "18px" : "30px";

  function go(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  const current = location.pathname;
  const doctorName = doctor?.fullName ?? "Médico";
  const perfilActive = isActive("/perfil", current);

  return (
    <div style={{ color: color.text, fontFamily: "Poppins, sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: sbW,
          background: color.surface,
          borderRight: `1px solid ${color.border}`,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          transform: sbTransform,
          transition: "transform .22s ease, width .22s ease",
          padding: "18px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: showLabels ? "flex-start" : "center",
            height: 44,
            padding: showLabels ? "0 6px" : 0,
            marginBottom: 22,
          }}
        >
          <MeLogo height={showLabels ? 26 : 20} />
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                  justifyContent: showLabels ? "flex-start" : "center",
                  gap: 12,
                  height: 46,
                  padding: showLabels ? "0 12px" : 0,
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
                {showLabels && <span>{it.name}</span>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => go("/perfil")}
          aria-label={`Perfil de ${doctorName}`}
          title={doctorName}
          style={{
            marginTop: "auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: showLabels ? "flex-start" : "center",
            gap: showLabels ? 10 : 0,
            padding: showLabels ? "10px 12px" : "8px 0",
            border: `1px solid ${perfilActive ? color.primary : color.border}`,
            borderRadius: 16,
            background: perfilActive ? color.primarySoft : color.muted,
            boxShadow: shadow.card,
            cursor: "pointer",
            textAlign: "left",
            transition: "background .18s, border-color .18s",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              flex: "none",
              borderRadius: 999,
              background: color.primaryGradient,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {initials(doctorName)}
          </span>
          {showLabels && (
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
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
                {doctorName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: color.textMuted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 1,
                }}
              >
                {doctor?.crm ?? "Médico"}
              </span>
            </span>
          )}
        </button>
      </aside>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(33,30,28,.34)",
            zIndex: 55,
          }}
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
        {/* Topbar — sem linha divisória, fundo do app */}
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
          <button
            onClick={() =>
              isMobile ? setSidebarOpen((v) => !v) : setCollapsedDesktop((v) => !v)
            }
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

          <div style={{ flex: 1 }} />

          <button
            onClick={() => go("/documentos")}
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
        </header>

        <main style={{ padding: mainPad, maxWidth: 1280, margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>

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
