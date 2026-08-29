import type { Metadata } from "next";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
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
