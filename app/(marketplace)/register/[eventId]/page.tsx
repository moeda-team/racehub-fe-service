export default async function RegisterPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await params; // TODO Fase 3: form pendaftaran peserta tanpa login.
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Pendaftaran Event
      </h1>
      <p style={{ color: "var(--color-ink-3)" }}>
        Form pendaftaran akan ditampilkan di sini. (placeholder)
      </p>
    </main>
  );
}
