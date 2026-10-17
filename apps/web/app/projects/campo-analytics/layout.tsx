import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

const title = "Campo Analytics · Gabriel Bulacio";
const description =
  "Portfolio demo: ask a business question and get a chart where every number traces back to its definition, SQL and source rows. Synthetic data.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: "Gabriel Bulacio", title, description, url: "/projects/campo-analytics" },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
