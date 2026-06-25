import type { Metadata } from "next";
import { Saira, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const saira = Saira({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LowkeyThings — Platform Event Lari Indonesia",
  description:
    "Telusuri, daftar, dan kelola event lari di seluruh Indonesia. Transparan, cepat, dan aman.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${saira.variable} ${hanken.variable} ${spline.variable}`}
    >
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body)", backgroundColor: "var(--color-paper)", color: "var(--color-ink)" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
