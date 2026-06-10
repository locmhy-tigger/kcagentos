import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC, DM_Sans, DM_Mono } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const notoSerifTC = Noto_Serif_TC({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-serif-tc", display: "swap" });
const notoSansTC  = Noto_Sans_TC({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans-tc", display: "swap" });
const dmSans      = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmMono      = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  title: "基智 Agent OS",
  description: "基督教香港崇真會基智中學 · 教師智能工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK" className={`${notoSerifTC.variable} ${notoSansTC.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
