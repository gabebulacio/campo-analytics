"use client";

import type { ReactNode } from "react";
import { BarChart3, BookOpen, Boxes, FileText, Network, ShieldCheck, Users } from "lucide-react";
import { ProjectShell } from "@/components/ProjectShell";
import { LAKEHOUSE_BASE, LAKEHOUSE_CODE } from "@/lib/paths";
import { T, UI } from "./content";
import { useT } from "./ui";

export function LakehouseShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const nav = [
    { href: "/", label: t(UI.nav.overview), icon: <FileText size={16} /> },
    { href: "/architecture", label: t(UI.nav.architecture), icon: <Network size={16} /> },
    { href: "/identity", label: t(UI.nav.identity), icon: <Users size={16} /> },
    { href: "/quality", label: t(UI.nav.quality), icon: <ShieldCheck size={16} /> },
    { href: "/outputs", label: t(UI.nav.outputs), icon: <BarChart3 size={16} /> },
    { href: "/model", label: t(UI.nav.model), icon: <Boxes size={16} /> },
    { href: "/decisions", label: t(UI.nav.decisions), icon: <BookOpen size={16} />, sep: true },
  ];
  const footer = UI.footer.map((f, i) => <div key={f.en} className={i === 1 ? "mono" : undefined}>{t(f)}</div>);
  return (
    <ProjectShell name="Worklog Lakehouse" base={LAKEHOUSE_BASE} code={LAKEHOUSE_CODE} note={t(T.note)} nav={nav} footer={footer}>
      {children}
    </ProjectShell>
  );
}
