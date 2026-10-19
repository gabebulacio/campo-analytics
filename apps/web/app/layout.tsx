import type { Metadata } from "next";
import { Cal_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// Display face for the personal page's name and section headings only.
const display = Cal_Sans({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });

const description = "Analytics engineer. Semantic layers, data platforms and AI on governed data.";

export const metadata: Metadata = {
  metadataBase: new URL("https://gabrielbulacio.com"),
  title: "Gabriel Bulacio",
  description,
  openGraph: { type: "website", siteName: "Gabriel Bulacio", title: "Gabriel Bulacio", description, url: "/" },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${mono.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
