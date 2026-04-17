"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

type Memory = {
  id: number;
  authorName: string;
  message: string | null;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  table: { number: number };
};

async function fetchAllMemories(): Promise<Memory[]> {
  const all: Memory[] = [];
  let cursor: string | null = null;

  // Paginate through the cursor-based API to get all memories
  while (true) {
    const url: string = cursor
      ? `/api/memories?cursor=${cursor}`
      : `/api/memories`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    all.push(...data.memories);
    if (!data.nextCursor) break;
    cursor = String(data.nextCursor);
  }

  return all;
}

export default function MonitorPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoriesRef = useRef<Memory[]>([]);

  // Keep ref in sync for use inside callbacks/timers
  memoriesRef.current = memories;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showMemoryAtIndex = useCallback(
    (index: number) => {
      // Fade out
      setVisible(false);
      clearTimer();

      // After fade-out, switch memory and fade in
      timerRef.current = setTimeout(() => {
        setCurrentIndex(index);
        setVisible(true);
      }, 1000); // 1s fade-out duration
    },
    [clearTimer],
  );

  const advanceToNext = useCallback(() => {
    const list = memoriesRef.current;
    if (list.length === 0) return;
    setCurrentIndex((prev) => {
      const next = (prev + 1) % list.length;
      // Fade out then in
      setVisible(false);
      clearTimer();
      timerRef.current = setTimeout(() => {
        setCurrentIndex(next);
        setVisible(true);
      }, 1000);
      return prev; // keep current during fade-out
    });
  }, [clearTimer]);

  // Fetch all memories on mount
  useEffect(() => {
    fetchAllMemories().then((all) => {
      if (all.length > 0) {
        // Show oldest first (API returns newest first)
        const sorted = [...all].reverse();
        setMemories(sorted);
        setCurrentIndex(0);
        setVisible(true);
      }
    });
  }, []);

  // SSE for real-time new memories
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      es = new EventSource("/api/memories/stream");

      es.onmessage = (e) => {
        try {
          const memory: Memory = JSON.parse(e.data);
          setMemories((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === memory.id)) return prev;
            const updated = [...prev, memory];
            // Show the new memory immediately
            setTimeout(() => {
              showMemoryAtIndex(updated.length - 1);
            }, 0);
            return updated;
          });
        } catch {
          /* ignore parse errors from heartbeats */
        }
      };

      es.onerror = () => {
        es?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [showMemoryAtIndex]);

  // Auto-advance timer for photos
  const currentMemory = memories[currentIndex] ?? null;

  useEffect(() => {
    if (!currentMemory || !visible) return;

    // For videos, wait for the video to end (handled via onEnded)
    if (currentMemory.mediaType === "VIDEO") return;

    // For photos, advance after 8 seconds
    const timer = setTimeout(() => {
      advanceToNext();
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentMemory, visible, advanceToNext]);

  // Handle video end
  const handleVideoEnded = useCallback(() => {
    advanceToNext();
  }, [advanceToNext]);

  // Autoplay video when it becomes current
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentMemory || currentMemory.mediaType !== "VIDEO" || !visible) return;
    video.src = currentMemory.mediaUrl;
    video.load();
    video.play().catch(() => {});
  }, [currentMemory, visible]);

  const isIdle = memories.length === 0;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Idle state */}
      {isIdle && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-slate-950 to-blue-950 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
          <div className="relative text-center space-y-6 md:space-y-8">
            <Image
              src="/logo.png"
              alt="Lua Fest XV"
              width={280}
              height={280}
              className="mx-auto w-48 h-48 md:w-72 md:h-72 drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
              style={{
                maskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
              }}
              priority
            />
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Recuerdos
            </h1>
            <p className="text-base md:text-xl text-blue-300/70 font-light">
              Subí tu foto o video escaneando el QR de tu mesa
            </p>
          </div>
          <div className="absolute bottom-8 right-8 flex gap-2 items-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-slate-400 text-sm">Sistema activo</span>
          </div>
        </div>
      )}

      {/* Memory slideshow */}
      {!isIdle && currentMemory && (
        <>
          {/* Photo */}
          {currentMemory.mediaType === "PHOTO" && (
            <img
              key={currentMemory.id}
              src={currentMemory.mediaUrl}
              alt={`Recuerdo de ${currentMemory.authorName}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible
                  ? "kenburns 8s ease-out forwards"
                  : "none",
              }}
            />
          )}

          {/* Video */}
          {currentMemory.mediaType === "VIDEO" && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: visible ? 1 : 0 }}
              playsInline
              muted
              onEnded={handleVideoEnded}
            />
          )}

          {/* Info overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 md:p-10 transition-opacity duration-1000"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {currentMemory.authorName}
            </h2>
            {currentMemory.message && (
              <p className="text-lg md:text-2xl text-white/80 italic mb-3">
                {currentMemory.message}
              </p>
            )}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 md:px-6 md:py-3">
              <span className="text-xl md:text-3xl font-bold text-white">
                Mesa {currentMemory.table.number}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Ken Burns keyframes */}
      <style>{`
        @keyframes kenburns {
          from { transform: scale(1); }
          to   { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
