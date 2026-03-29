import { NextResponse } from "next/server";
import { scanEmitter } from "@/lib/events";
import type { ScanEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ScanEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Controller already closed — cleanup will handle removal
        }
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      scanEmitter.on("scan", send);

      cleanup = () => {
        scanEmitter.off("scan", send);
        clearInterval(heartbeat);
      };
    },
    cancel() {
      cleanup?.();
      cleanup = null;
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
