import type { Metadata, Viewport } from "next";
import { Baloo_2, Fredoka, Kalam, Mukta, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-fredoka" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-nunito" });
const kalam = Kalam({ subsets: ["latin", "devanagari"], weight: ["400", "700"], variable: "--font-kalam" });
const baloo = Baloo_2({ subsets: ["devanagari"], weight: ["500", "600"], variable: "--font-baloo" });
const mukta = Mukta({ subsets: ["devanagari"], weight: ["400", "500", "600"], variable: "--font-mukta" });

export const metadata: Metadata = {
  title: { default: "BloomDesk", template: "%s · BloomDesk" },
  description: "Simple software for play schools: children, classes, attendance, fees and parents.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFBFE" },
    { media: "(prefers-color-scheme: dark)", color: "#141A2A" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${fredoka.variable} ${nunito.variable} ${kalam.variable} ${baloo.variable} ${mukta.variable}`}
    >
      <body className="min-h-dvh bg-bg font-sans text-body text-ink">{children}</body>
    </html>
  );
}
