import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanEmitter } from "@/lib/events";
import type { ScanEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { guestId } = await req.json();

  if (!guestId) {
    return NextResponse.json({ error: "guestId requerido" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { table: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: { hasArrived: true, arrivedAt: new Date() },
  });

  const event: ScanEvent = {
    guestId: guest.id,
    guestName: `${guest.name} ${guest.lastName}`,
    tableNumber: guest.table.number,
    videoPath: guest.table.videoPath,
  };

  scanEmitter.emit("scan", event);

  return NextResponse.json({ ok: true, event });
}
