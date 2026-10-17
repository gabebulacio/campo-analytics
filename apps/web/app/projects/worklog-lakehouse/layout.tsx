import type { Metadata } from "next";
import { LakehouseShell } from "./LakehouseShell";

const title = "Worklog Lakehouse · Gabriel Bulacio";
const description =
  "Portfolio project: a Microsoft Fabric medallion (bronze, silver, gold) in PySpark and Python that consolidates two time-tracking systems, a directory and a CRM into a governed star schema for Power BI, with a parity gate proving both engines agree. Synthetic data.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: "Gabriel Bulacio", title, description, url: "/projects/worklog-lakehouse" },
};

export default function LakehouseLayout({ children }: { children: React.ReactNode }) {
  return <LakehouseShell>{children}</LakehouseShell>;
}
