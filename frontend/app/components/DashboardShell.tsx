"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { clearAuth } from "../lib/auth";
import { logout } from "../lib/api";

const themeOptions = [
  { key: "orange", label: "Laranja" },
  { key: "blue", label: "Azul" },
  { key: "green", label: "Verde" },
  { key: "lime", label: "Verde Claro" },
  { key: "yellow", label: "Amarelo" },
  { key: "sky", label: "Azul Claro" },
  { key: "red", label: "Vermelho" }
];

const navItems = [
  { label: "Dashboard", href: "#", icon: "D" },
  { label: "Usuarios", href: "/dashboard", icon: "U" },
  { label: "Calendario", href: "/dashboard/events", icon: "C" },
  { label: "Relatorios", href: "/dashboard/reports", icon: "R" },
  { label: "Criação e Permissões", href: "#", icon: "P" },
  { label: "Configuracoes", href: "#", icon: "G" }
];

type DashboardShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [themeMode, setThemeMode] = useState("dark");
  const [accent, setAccent] = useState("orange");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedMode = localStorage.getItem("theme_mode");
    const storedAccent = localStorage.getItem("theme_accent");
    const storedSidebar = localStorage.getItem("sidebar_collapsed");

    if (storedMode) {
      setThemeMode(storedMode);
    }

    if (storedAccent) {
      setAccent(storedAccent);
    }

    if (storedSidebar) {
      setSidebarCollapsed(storedSidebar === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("theme_mode", themeMode);
    localStorage.setItem("theme_accent", accent);
  }, [themeMode, accent]);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <main className={`dashboard ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>Sistema Gestao</strong>
            <span>Operacoes</span>
          </div>
        </div>
        <nav className="nav-links">
          {navItems.map((item) => {
            const isActive = item.href !== "#" && pathname === item.href;
            const content = (
              <>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </>
            );

            if (item.href === "#") {
              return (
                <button key={item.label} className="nav-item" type="button">
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-item ${isActive ? "nav-active" : ""}`}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              type="button"
              aria-label="Recolher menu"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              ?
            </button>
            <div>
              <p className="topbar-title">{title}</p>
              <p className="topbar-subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            >
              {themeMode === "dark" ? "Light" : "Dark"}
            </button>
            <div className="theme-menu">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setThemeMenuOpen((prev) => !prev)}
              >
                Tema
              </button>
              {themeMenuOpen ? (
                <div className="theme-dropdown">
                  <p>Escolher tema</p>
                  {themeOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`theme-option ${accent === option.key ? "active" : ""}`}
                      onClick={() => {
                        setAccent(option.key);
                        setThemeMenuOpen(false);
                      }}
                    >
                      <span className={`theme-swatch swatch-${option.key}`} />
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="profile-chip">
              <span className="profile-dot" />
              <span>Perfil ativo</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={async () => {
                try {
                  await logout();
                } finally {
                  clearAuth();
                  router.push("/");
                }
              }}
            >
              Sair
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
