"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Camera, Filter } from "lucide-react";

type Memory = {
  id: number;
  authorName: string;
  message: string | null;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  table: { number: number; name: string | null };
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export default function RecuerdosPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tables, setTables] = useState<number[]>([]);

  const fetchMemories = useCallback(
    async (cursor?: number | null, append = false) => {
      const params = new URLSearchParams();
      if (selectedTable) params.set("mesa", String(selectedTable));
      if (cursor) params.set("cursor", String(cursor));

      const res = await fetch(`/api/memories?${params.toString()}`);
      const data = await res.json();

      setMemories((prev) =>
        append ? [...prev, ...data.memories] : data.memories,
      );
      setNextCursor(data.nextCursor);

      // Collect unique table numbers
      const allMemories: Memory[] = append
        ? [...memories, ...data.memories]
        : data.memories;
      const uniqueTables = [
        ...new Set(allMemories.map((m: Memory) => m.table.number)),
      ].sort((a, b) => a - b);
      setTables((prev) => {
        const merged = [...new Set([...prev, ...uniqueTables])].sort(
          (a, b) => a - b,
        );
        return merged;
      });
    },
    [selectedTable, memories],
  );

  // Initial load + filter change
  useEffect(() => {
    setLoading(true);
    fetchMemories().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMemories();
    }, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchMemories(nextCursor, true);
    setLoadingMore(false);
  };

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(ellipse at top, #0c1929 0%, #060d16 40%, #000000 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Lua Fest XV"
            width={80}
            height={80}
            className="h-16 w-16 drop-shadow-[0_0_20px_rgba(59,130,246,0.25)]"
            style={{
              maskImage:
                "radial-gradient(circle, white 40%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(circle, white 40%, transparent 75%)",
            }}
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Recuerdos
            </h1>
            <p className="text-sm text-slate-400">Lua Fest XV</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <button
            onClick={() => setSelectedTable(null)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedTable === null
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            Todas las mesas
          </button>
          {tables.map((num) => (
            <button
              key={num}
              onClick={() => setSelectedTable(num)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedTable === num
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-500" />
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="rounded-full bg-white/5 p-6">
              <Camera className="h-12 w-12 text-slate-500" />
            </div>
            <p className="text-lg font-medium text-slate-400">
              Aún no hay recuerdos
            </p>
            <p className="text-sm text-slate-500">
              Las fotos y videos aparecerán aquí
            </p>
          </div>
        ) : (
          <>
            {/* Masonry grid */}
            <div className="columns-1 gap-4 sm:columns-2 md:columns-3">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
                >
                  {/* Media */}
                  {memory.mediaType === "VIDEO" ? (
                    <video
                      src={memory.mediaUrl}
                      controls
                      preload="metadata"
                      className="w-full rounded-t-2xl"
                    />
                  ) : (
                    <img
                      src={memory.mediaUrl}
                      alt={`Recuerdo de ${memory.authorName}`}
                      className="w-full rounded-t-2xl object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Info */}
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {memory.authorName}
                      </span>
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                        Mesa {memory.table.number}
                      </span>
                    </div>
                    {memory.message && (
                      <p className="text-sm italic text-slate-400">
                        &ldquo;{memory.message}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {timeAgo(memory.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {nextCursor && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                >
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
