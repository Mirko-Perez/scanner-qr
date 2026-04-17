import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memoryId = Number(id);

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
  if (!memory) {
    return NextResponse.json(
      { error: "Memory not found" },
      { status: 404 },
    );
  }

  await del(memory.mediaUrl);
  await prisma.memory.delete({ where: { id: memoryId } });

  return NextResponse.json({ success: true });
}
