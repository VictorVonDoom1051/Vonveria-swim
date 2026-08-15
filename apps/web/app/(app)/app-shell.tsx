"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, StatusBadge } from "@vonveria-swim/ui";
import { apiFetch } from "../../lib/api-client";
import {
  filterByCapability,
  INSTRUCTOR_NAV,
  MORE_NAV,
  PRIMARY_NAV,
  type NavItem,
} from "../../lib/nav-config";
import type { SessionUser } from "../../lib/session";

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isInstructorOnly = user.roleKeys.length === 1 && user.roleKeys[0] === "INSTRUCTOR";
  const primaryNav = isInstructorOnly ? INSTRUCTOR_NAV : PRIMARY_NAV;
  const moreNav = isInstructorOnly ? [] : filterByCapability(MORE_NAV, user.capabilities);

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base sm:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border-subtle bg-bg-surface p-4 sm:flex print:hidden">
        <SidebarNav primaryNav={primaryNav} moreNav={moreNav} pathname={pathname} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface px-4 py-3 sm:px-6 print:hidden">
          <button
            type="button"
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm sm:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            Menu
          </button>
          <span className="hidden text-sm font-medium text-brand-deep sm:inline">
            VonverIA Swim
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-text-secondary sm:inline">{user.fullName}</span>
            <StatusBadge tone="success">{roleLabel(user.roleKeys)}</StatusBadge>
            <Button variant="ghost" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </header>

        {menuOpen ? (
          <nav className="flex flex-col gap-1 border-b border-border-subtle bg-bg-surface p-4 sm:hidden">
            <NavLinks
              items={[...primaryNav, ...moreNav]}
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
          </nav>
        ) : null}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  primaryNav,
  moreNav,
  pathname,
}: {
  primaryNav: NavItem[];
  moreNav: NavItem[];
  pathname: string;
}) {
  return (
    <>
      <NavLinks items={primaryNav} pathname={pathname} />
      {moreNav.length > 0 ? (
        <>
          <p className="mt-4 px-3 text-xs font-medium uppercase tracking-wide text-text-secondary">
            Mas
          </p>
          <NavLinks items={moreNav} pathname={pathname} />
        </>
      ) : null}
    </>
  );
}

function NavLinks({
  items,
  pathname,
  onNavigate = () => undefined,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={
              "rounded-md px-3 py-2 text-sm font-medium " +
              (active ? "bg-brand-deep text-text-inverse" : "text-text-primary hover:bg-bg-base")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function roleLabel(roleKeys: SessionUser["roleKeys"]): string {
  if (roleKeys.includes("DIRECCION")) return "Direccion";
  if (roleKeys.includes("RECEPCION")) return "Recepcion";
  if (roleKeys.includes("INSTRUCTOR")) return "Instructor";
  return "Usuario";
}
