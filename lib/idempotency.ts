"use client";

import { useRef } from "react";

// Kunci idempotensi per-payload untuk operasi uang/registrasi.
// - Payload sama (retry setelah gagal jaringan / double-click) → key sama,
//   server me-replay hasil asli tanpa efek kedua.
// - Payload berubah (user mengedit nominal/form) → key baru, dianggap operasi baru.
// - Panggil reset() setelah sukses agar submit berikutnya memakai key baru.
export function useIdempotencyKey() {
  const ref = useRef<{ key: string; payload: string } | null>(null);
  return {
    keyFor(payload: unknown): string {
      const p = JSON.stringify(payload);
      if (!ref.current || ref.current.payload !== p) {
        ref.current = { key: crypto.randomUUID(), payload: p };
      }
      return ref.current.key;
    },
    reset() {
      ref.current = null;
    },
  };
}
