import { prisma } from "@/lib/prisma";

export async function GET() {
  const writers = await prisma.writer.findMany({
    select: { id: true, name: true, avatar: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ writers });
}
