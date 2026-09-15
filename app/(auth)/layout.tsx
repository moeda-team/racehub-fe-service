import { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { AuthProvider } from "@/lib/auth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <main className="auth-shell">
        <Link
          href="/"
          className="auth-brand"
        >
          <Brand size="lg" />
        </Link>
        <div className="auth-card">
          {children}
        </div>
      </main>
    </AuthProvider>
  );
}
