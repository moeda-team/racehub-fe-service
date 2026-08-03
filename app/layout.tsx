import type { Metadata } from "next";
import "@fontsource/saira/500.css";
import "@fontsource/saira/600.css";
import "@fontsource/saira/700.css";
import "@fontsource/saira/800.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "@fontsource/hanken-grotesk/700.css";
import "@fontsource/spline-sans-mono/500.css";
import "@fontsource/spline-sans-mono/600.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AdminAuthProvider } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "LowkeyThings — Platform Event Indonesia",
  description:
    "Telusuri, daftar, dan kelola event di seluruh Indonesia. Transparan, cepat, dan aman.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className=""
    >
      <body
        className="min-h-screen antialiased"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-paper)",
          color: "var(--color-ink)",
        }}
      >
        <AuthProvider>
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
