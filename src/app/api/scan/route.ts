import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanEmitter } from "@/lib/events";
import type { ScanEvent } from "@/lib/events";

type ScanResult = { event: ScanEvent; alreadyArrived: boolean } | null;

async function processScan(guestId: string): Promise<ScanResult> {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { table: true },
  });

  if (!guest) return null;

  const alreadyArrived = guest.hasArrived;

  if (!alreadyArrived) {
    await prisma.guest.update({
      where: { id: guestId },
      data: { hasArrived: true, arrivedAt: new Date() },
    });
  }

  const event: ScanEvent = {
    guestId: guest.id,
    guestName: `${guest.name} ${guest.lastName}`,
    tableNumber: guest.table.number,
    videoPath: guest.table.videoPath,
  };

  // Always emit so the projector replays the video, even if already registered
  try {
    scanEmitter.emit("scan", event);
  } catch { /* SSE listener may throw if stream already closed */ }

  return { event, alreadyArrived };
}

// GET — activado cuando el celular abre la URL del QR directamente
export async function GET(req: NextRequest) {
  // Use the Host header so the redirect goes to the real IP, not 0.0.0.0
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const base = `http://${host}`;

  const guestId = req.nextUrl.searchParams.get("id");

  if (!guestId) {
    return NextResponse.redirect(`${base}/llegada?error=1`);
  }

  const result = await processScan(guestId);

  if (!result) {
    return NextResponse.redirect(`${base}/llegada?error=1`);
  }

  const params = new URLSearchParams({
    name: result.event.guestName,
    mesa: String(result.event.tableNumber),
    ...(result.alreadyArrived ? { ya: "1" } : {}),
  });

  return NextResponse.redirect(`${base}/llegada?${params}`);
}

// POST — usado por la página /scan (scanner con cámara, opcional)
export async function POST(req: NextRequest) {
  const { guestId } = await req.json();

  if (!guestId) {
    return NextResponse.json({ error: "guestId requerido" }, { status: 400 });
  }

  const result = await processScan(guestId);

  if (!result) {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, event: result.event, alreadyArrived: result.alreadyArrived });
}
