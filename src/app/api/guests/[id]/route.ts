import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  await prisma.guest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: { name?: string; lastName?: string; hasArrived?: boolean; arrivedAt?: Date | null } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.lastName === "string" && body.lastName.trim()) data.lastName = body.lastName.trim();
  if (typeof body.hasArrived === "boolean") {
    data.hasArrived = body.hasArrived;
    data.arrivedAt = body.hasArrived ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const guest = await prisma.guest.update({
    where: { id },
    data,
    include: { table: true },
  });
  return NextResponse.json(guest);
}
