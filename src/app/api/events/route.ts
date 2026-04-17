import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ScanEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

const MAX_DURATION_MS = 20_000; // close before Vercel timeout (~25s hobby)
const POLL_INTERVAL_MS = 2_000;

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let lastCheck = new Date();
  const deadline = Date.now() + MAX_DURATION_MS;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          /* client disconnected */
        }
      };

      while (Date.now() < deadline) {
        if (req.signal?.aborted) break;

        try {
          const newScans = await prisma.scanLog.findMany({
            where: { createdAt: { gt: lastCheck } },
            include: { guest: { include: { table: true } } },
            orderBy: { createdAt: "asc" },
          });

          for (const scan of newScans) {
            const event: ScanEvent = {
              guestId: scan.guest.id,
              guestName: `${scan.guest.name} ${scan.guest.lastName}`,
              tableNumber: scan.guest.table.number,
              videoPath: scan.guest.table.videoPath,
            };
            send(`data: ${JSON.stringify(event)}\n\n`);
            if (scan.createdAt > lastCheck) lastCheck = scan.createdAt;
          }

          if (newScans.length === 0) {
            send(": heartbeat\n\n");
          }
        } catch {
          break;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
