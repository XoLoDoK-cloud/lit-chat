import { prisma } from "@/lib/prisma";

type Body = {
  writerId: string;
  sessionId?: string;
  message: string;
};

function fakeModelAnswer(writerName: string, userText: string) {
  // Заглушка: чтобы сразу работало. Потом заменим на реальный вызов модели.
  return `${writerName} отвечает: ${userText}\n\n(Пока это тестовый режим. Следующим шагом подключим реальный ИИ.)`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body?.writerId || !body?.message?.trim()) {
    return new Response("Bad Request", { status: 400 });
  }

  const writer = await prisma.writer.findUnique({ where: { id: body.writerId } });
  if (!writer) return new Response("Writer not found", { status: 404 });

  // 1) сессия
  const sessionId = body.sessionId ?? crypto.randomUUID();
  const session = await prisma.session.upsert({
    where: { id: sessionId },
    update: {},
    create: { id: sessionId, writerId: writer.id },
  });

  // 2) сохраняем user message
  await prisma.message.create({
    data: { sessionId: session.id, role: "user", content: body.message },
  });

  // 3) получаем ответ (пока заглушка)
  const assistantText = fakeModelAnswer(writer.name, body.message);

  // 4) сохраняем assistant message
  await prisma.message.create({
    data: { sessionId: session.id, role: "assistant", content: assistantText },
  });

  // 5) отдадим историю
  const messages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true, createdAt: true },
  });

  return Response.json({
    sessionId: session.id,
    writer: { id: writer.id, name: writer.name, avatar: writer.avatar },
    messages,
  });
}
