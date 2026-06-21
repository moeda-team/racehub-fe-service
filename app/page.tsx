export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        RaceHub Marketplace
      </h1>
      <p style={{ color: "var(--color-ink-3)", fontSize: 16 }}>
        Temukan event lari terdekat di kotamu. Daftar langsung tanpa ribet.
      </p>
    </main>
  );
}
