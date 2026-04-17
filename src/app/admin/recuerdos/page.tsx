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
          <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
            4
          </span>
          <h2 className="text-2xl font-bold text-foreground">Recuerdos</h2>
        </div>
        <p className="text-muted-foreground text-sm ml-10">
          Moderá y gestioná los recuerdos subidos por los invitados.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {loading ? "–" : memories.length}
            </span>
          </CardContent>
        </Card>
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Fotos</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {loading ? "–" : photoCount}
            </span>
          </CardContent>
        </Card>
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-violet-600" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Videos</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {loading ? "–" : videoCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      {memories.length > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={filterMesa} onValueChange={setFilterMesa}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      )}

      {/* Memory grid */}
      {!loading && memories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-slate-100">
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
                    <Badge className="bg-black/60 text-white text-[10px] gap-1 hover:bg-black/60">
                      <Video className="w-3 h-3" /> Video
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {memory.authorName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                  >
                    Mesa {memory.table.number}
                  </Badge>
                </div>

                {memory.message && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {memory.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(memory.createdAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(memory)}
                    disabled={deleting === memory.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && memories.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay recuerdos aún.</p>
          <p className="text-sm mt-1">
            Los invitados pueden subir fotos y videos desde su mesa.
          </p>
        </div>
      )}
    </div>
  );
}
