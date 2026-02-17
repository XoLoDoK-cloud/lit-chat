export default async function Home() {
  // серверный fetch к нашему же API
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/writers`, {
    cache: "no-store",
  }).catch(() => null);

  const data = res ? await res.json() : { writers: [] as any[] };
  const writers: { id: string; name: string; avatar?: string }[] = data.writers ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Чат с писателями</h1>
      <p>Выбери автора и начинай диалог.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {writers.map((w) => (
          <a
            key={w.id}
            href={`/chat/${w.id}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 14,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontSize: 28 }}>{w.avatar ?? "📚"}</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{w.name}</div>
            <div style={{ opacity: 0.7, marginTop: 4 }}>Открыть чат →</div>
          </a>
        ))}
      </div>

      {writers.length === 0 && (
        <p style={{ marginTop: 16, opacity: 0.7 }}>
          Писателей пока нет (проверь сид базы: <code>npm run db:seed</code>)
        </p>
      )}
    </main>
  );
}
