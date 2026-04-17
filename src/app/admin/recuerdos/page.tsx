"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  Image as ImageIcon,
  Video,
  Trash2,
  Filter,
  LayoutGrid,
} from "lucide-react";

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

export default function RecuerdosAdminPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMesa, setFilterMesa] = useState<string>("all");
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchMemories = useCallback(async () => {
    const url =
      filterMesa === "all"
        ? "/api/memories"
        : `/api/memories?mesa=${filterMesa}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setMemories(data.memories);
    }
    setLoading(false);
  }, [filterMesa]);

  useEffect(() => {
    setLoading(true);
    fetchMemories();
    const interval = setInterval(fetchMemories, 10000);
    return () => clearInterval(interval);
  }, [fetchMemories]);

  const handleDelete = async (memory: Memory) => {
    const ok = window.confirm(
      `¿Eliminar el recuerdo de ${memory.authorName}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    setDeleting(memory.id);
    const res = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
    setDeleting(null);

    if (res.ok) {
      toast.success("Recuerdo eliminado");
      setMemories((prev) => prev.filter((m) => m.id !== memory.id));
    } else {
      toast.error("Error al eliminar el recuerdo");
    }
  };

  const mesaNumbers = [
    ...new Set(memories.map((m) => m.table.number)),
  ].sort((a, b) => a - b);
  const photoCount = memories.filter((m) => m.mediaType === "PHOTO").length;
  const videoCount = memories.filter((m) => m.mediaType === "VIDEO").length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold ring-1 ring-blue-500/30">
            4
          </span>
          <h2 className="text-2xl font-bold text-white">Recuerdos</h2>
        </div>
        <p className="text-slate-300 text-sm ml-10">
          Moderá y gestioná los recuerdos subidos por los invitados.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass glow-blue border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/10">
                <LayoutGrid className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white block">
              {loading ? "–" : memories.length}
            </span>
            <span className="text-xs text-slate-300">Total</span>
          </CardContent>
        </Card>
        <Card className="glass glow-emerald border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white block">
              {loading ? "–" : photoCount}
            </span>
            <span className="text-xs text-slate-300">Fotos</span>
          </CardContent>
        </Card>
        <Card className="glass glow-violet border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10">
                <Video className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white block">
              {loading ? "–" : videoCount}
            </span>
            <span className="text-xs text-slate-300">Videos</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      {memories.length > 0 && (
        <div className="glass flex items-center gap-3 px-4 py-3">
          <Filter className="w-4 h-4 text-slate-300 shrink-0" />
          <Select value={filterMesa} onValueChange={setFilterMesa}>
            <SelectTrigger className="w-44 bg-white/[0.10] border-white/[0.18] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2940] border-white/[0.18]">
              <SelectItem value="all">
                Todas las mesas ({memories.length})
              </SelectItem>
              {mesaNumbers.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Mesa {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl bg-white/[0.12]" />
          ))}
        </div>
      )}

      {/* Memory grid */}
      {!loading && memories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="glass overflow-hidden group transition-all duration-200 hover:bg-white/[0.12] hover:border-white/[0.18]"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-white/[0.09]">
                {memory.mediaType === "VIDEO" ? (
                  <video
                    src={memory.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={memory.mediaUrl}
                    alt={`Recuerdo de ${memory.authorName}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {memory.mediaType === "VIDEO" && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/60 text-white text-[10px] gap-1 backdrop-blur-sm hover:bg-black/60">
                      <Video className="w-3 h-3" /> Video
                    </Badge>
                  </div>
                )}
                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(memory)}
                  disabled={deleting === memory.id}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1.5">
                <p className="text-white font-medium text-sm truncate">
                  {memory.authorName}
                </p>

                {memory.message && (
                  <p className="text-slate-300 text-sm line-clamp-2">
                    {memory.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Badge className="bg-blue-500/15 text-blue-400 text-[10px] hover:bg-blue-500/15 border-0">
                    Mesa {memory.table.number}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    {timeAgo(memory.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && memories.length === 0 && (
        <div className="glass text-center py-16">
          <Camera className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-300">No hay recuerdos aún.</p>
          <p className="text-sm text-slate-300 mt-1">
            Los invitados pueden subir fotos y videos desde su mesa.
          </p>
        </div>
      )}
    </div>
  );
}
