import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Campo Analytics · Gabriel Bulacio",
  description: "Portfolio demo: ask a business question and get a chart where every number traces back to its definition, SQL and source rows. Synthetic data.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
