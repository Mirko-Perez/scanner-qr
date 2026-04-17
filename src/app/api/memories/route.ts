import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mesa = searchParams.get("mesa");
  const cursor = searchParams.get("cursor");

  const where = mesa ? { table: { number: Number(mesa) } } : {};

  const memories = await prisma.memory.findMany({
    where,
    include: { table: { select: { number: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
  });

  let nextCursor: number | null = null;
  if (memories.length > PAGE_SIZE) {
    const last = memories.pop()!;
    nextCursor = last.id;
  }

  return NextResponse.json({ memories, nextCursor });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const authorName = formData.get("authorName") as string | null;
  const message = formData.get("message") as string | null;
  const tableNumber = formData.get("tableNumber") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!authorName) {
    return NextResponse.json(
      { error: "authorName is required" },
      { status: 400 },
    );
  }
  if (!tableNumber) {
    return NextResponse.json(
      { error: "tableNumber is required" },
      { status: 400 },
    );
  }

  const table = await prisma.table.findUnique({
    where: { number: Number(tableNumber) },
  });
  if (!table) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const ext = file.name.split(".").pop();
  const filename = `memories/mesa-${table.number}/${Date.now()}.${ext}`;
  const blob = await put(filename, file, { access: "public" });

  const mediaType = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";

  const memory = await prisma.memory.create({
    data: {
      tableId: table.id,
      authorName,
      message: message || null,
      mediaUrl: blob.url,
      mediaType,
    },
    include: { table: { select: { number: true, name: true } } },
  });

  return NextResponse.json(memory, { status: 201 });
}
