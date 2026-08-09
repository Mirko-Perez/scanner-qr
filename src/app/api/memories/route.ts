import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { mediaUrl, mediaType, authorName, message, tableNumber } =
    await request.json();

  if (!mediaUrl || !mediaType) {
    return NextResponse.json(
      { error: "mediaUrl and mediaType are required" },
      { status: 400 },
    );
  }
  if (mediaType !== "PHOTO" && mediaType !== "VIDEO") {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }
  // mediaUrl must point at our own Blob store — it's client-supplied now that
  // uploads bypass this function, so an arbitrary URL here would let anyone
  // inject external content into the shared memories gallery/display.
  let mediaHost: string;
  try {
    mediaHost = new URL(mediaUrl).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid mediaUrl" }, { status: 400 });
  }
  if (!mediaHost.endsWith(".public.blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid mediaUrl" }, { status: 400 });
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

  const memory = await prisma.memory.create({
    data: {
      tableId: table.id,
      authorName,
      message: message || null,
      mediaUrl,
      mediaType,
    },
    include: { table: { select: { number: true, name: true } } },
  });

  return NextResponse.json(memory, { status: 201 });
}
