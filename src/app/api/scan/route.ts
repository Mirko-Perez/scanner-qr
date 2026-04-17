import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  // Always log the scan so the display picks it up via polling
  await prisma.scanLog.create({ data: { guestId } });

  // Clean up old scan logs (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.scanLog.deleteMany({ where: { createdAt: { lt: oneHourAgo } } }).catch(() => {});

  const event: ScanEvent = {
    guestId: guest.id,
    guestName: `${guest.name} ${guest.lastName}`,
    tableNumber: guest.table.number,
    videoPath: guest.table.videoPath,
  };

  return { event, alreadyArrived };
}

// GET — phone camera opens the QR URL directly
export async function GET(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const base = `${proto}://${host}`;

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

// POST — used by the /scan page (optional camera scanner)
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
