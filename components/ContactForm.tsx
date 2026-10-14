"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Eyebrow } from "@/components/ui/Layout";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setStatus("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-racehub-public": "1" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      if (!response.ok) throw new Error("send failed");
      formElement.reset();
      setStatus("Pesan berhasil dikirim. Tim kami akan segera menghubungi kamu.");
    } catch {
      setStatus("Pesan belum berhasil dikirim. Silakan coba lagi beberapa saat.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <Eyebrow>Kirim Pesan</Eyebrow>
      <div className="contact-form-row">
        <label className="field">
          <span className="field-label">Nama</span>
          <input className="field-input" name="name" placeholder="Nama kamu" maxLength={120} required />
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input className="field-input" name="email" type="email" placeholder="nama@email.com" required />
        </label>
      </div>
      <label className="field contact-message-field">
        <span className="field-label">Pesan</span>
        <textarea className="field-input" name="message" rows={4} maxLength={5000} placeholder="Tulis pertanyaan atau kebutuhan kerja samamu…" required />
      </label>
      <button className="btn btn-primary btn-lg" type="submit" disabled={pending}>
        <Send size={17} aria-hidden />
        {pending ? "Mengirim…" : "Kirim Pesan"}
      </button>
      <p role="status" aria-live="polite">{status}</p>
    </form>
  );
}
