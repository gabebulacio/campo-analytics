"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CodeLink, LangSwitch, ThemeButton } from "@/components/SiteControls";

export type NavItem = {
  href: string; // relative to the project base: "/" or "/architecture"
  label: string;
  icon: ReactNode;
  sep?: boolean; // start a new group
  match?: string[]; // extra path prefixes that mark this item active
};

/** App shell shared by every project page: breadcrumb top bar (code, language, theme), sidebar, content. */
export function ProjectShell({ name, base, code, note, nav, footer, children }: {
  name: string;
  base: string;
  code: string;
  note?: ReactNode;
  nav: NavItem[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname();
  const rel = path.slice(base.length) || "/";
  return (
    <div className="shell">
      <header className="topbar">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/" className="crumb-home">Gabriel Bulacio</a>
          <span className="crumb-sep">/</span>
          <Link href={base} className="brand">{name}</Link>
          {note && <span className="crumb-note hide-sm">{note}</span>}
        </nav>
        <div className="spacer" />
        <CodeLink href={code} />
        <LangSwitch />
        <ThemeButton />
      </header>
      <nav className="sidebar" aria-label="Main">
        {nav.map((n) => {
          const active = n.href === "/" ? rel === "/" : rel.startsWith(n.href) || (n.match ?? []).some((m) => rel.startsWith(m));
          return (
            <Link key={n.href} href={n.href === "/" ? base : base + n.href} className={`nav-item ${n.sep ? "nav-sep" : ""}`} aria-current={active ? "page" : undefined}>
              {n.icon}
              {n.label}
            </Link>
          );
        })}
        {footer && <div className="foot">{footer}</div>}
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
