import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";

// RPC is protected but lives outside /dashboard for its field-focused layout.
export default function RpcLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
