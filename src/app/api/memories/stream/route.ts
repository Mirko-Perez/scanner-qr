import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_DURATION_MS = 20_000;
const POLL_INTERVAL_MS = 3_000;

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
          const newMemories = await prisma.memory.findMany({
            where: { createdAt: { gt: lastCheck } },
            include: { table: { select: { number: true, name: true } } },
            orderBy: { createdAt: "asc" },
          });

          for (const memory of newMemories) {
            send(`data: ${JSON.stringify(memory)}\n\n`);
            if (memory.createdAt > lastCheck) lastCheck = memory.createdAt;
          }

          if (newMemories.length === 0) {
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
