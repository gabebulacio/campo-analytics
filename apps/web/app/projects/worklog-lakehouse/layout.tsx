import type { Metadata } from "next";
import { LakehouseShell } from "./LakehouseShell";

export const metadata: Metadata = {
  title: "Worklog Lakehouse · Gabriel Bulacio",
  description:
    "Portfolio project: a Microsoft Fabric medallion (bronze, silver, gold) that consolidates two time-tracking systems, a directory and a CRM into a governed star schema for Power BI, and runs locally too. Synthetic data.",
};

export default function LakehouseLayout({ children }: { children: React.ReactNode }) {
  return <LakehouseShell>{children}</LakehouseShell>;
}
