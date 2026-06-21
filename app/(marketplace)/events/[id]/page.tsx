export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params; // TODO Fase 2: muat detail event publik dari backend.
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Detail Event
      </h1>
      <p style={{ color: "var(--color-ink-3)" }}>
        Memuat detail event... (placeholder)
      </p>
    </main>
  );
}
