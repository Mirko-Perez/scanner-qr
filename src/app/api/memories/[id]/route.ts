import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
