"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const params = useParams<{ writerId: string }>();
  const writerId = params.writerId;

  const storageKey = useMemo(() => `session:${writerId}`, [writerId]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [writerName, setWriterName] = useState<string>("Писатель");
  const [writerAvatar, setWriterAvatar] = useState<string>("📚");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setSessionId(saved);
  }, [storageKey]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    // оптимистично показываем
    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId, sessionId, message: text }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setSessionId(data.sessionId);
      localStorage.setItem(storageKey, data.sessionId);

      setWriterName(data.writer?.name ?? "Писатель");
      setWriterAvatar(data.writer?.avatar ?? "📚");

      // берём историю из ответа (истина)
      setMessages(
        (data.messages ?? []).map((x: any) => ({
          role: x.role,
          content: x.content,
        }))
      );
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Ошибка запроса. Проверь сервер/базу и повтори." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    localStorage.removeItem(storageKey);
    setSessionId(null);
    setMessages([]);
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <a href="/" style={{ textDecoration: "none" }}>← Назад</a>

      <h2 style={{ marginTop: 10 }}>
        {writerAvatar} {writerName}
      </h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <button onClick={clear} disabled={loading}>
          Очистить диалог
        </button>
        <span style={{ opacity: 0.6, alignSelf: "center" }}>
          session: {sessionId ?? "(новая)"}
        </span>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
          minHeight: 380,
          background: "#fff",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Напиши первое сообщение.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ margin: "10px 0" }}>
              <div style={{ fontWeight: 700, opacity: 0.8 }}>
                {m.role === "user" ? "Ты" : writerName}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение..."
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()}>
          {loading ? "..." : "Отправить"}
        </button>
      </div>
    </main>
  );
}
