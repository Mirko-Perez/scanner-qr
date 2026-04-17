"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, Trash2, Upload, CheckCircle2, Video } from "lucide-react";

type TableData = {
  id: number;
  number: number;
  name: string | null;
  videoPath: string | null;
  guests: { id: string }[];
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableData | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchTables = async () => {
    const res = await fetch("/api/tables");
    if (res.ok) setTables(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!number) { setError("Ingresá el número de mesa"); return; }
    setSaving(true);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: parseInt(number), name: name || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear la mesa");
      return;
    }
    setNumber("");
    setName("");
    toast.success(`Mesa ${number} creada`);
    fetchTables();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/tables/${deleteTarget.id}`, { method: "DELETE" });
    toast.success(`Mesa ${deleteTarget.number} eliminada`);
    setDeleteTarget(null);
    fetchTables();
  };

  const handleVideoUpload = async (tableId: number, file: File) => {
    setUploadingId(tableId);
    const formData = new FormData();
    formData.append("video", file);
    formData.append("tableId", String(tableId));
    const res = await fetch("/api/upload-video", { method: "POST", body: formData });
    setUploadingId(null);
    if (res.ok) {
      toast.success("Video subido correctamente");
      fetchTables();
    } else {
      toast.error("Error al subir el video");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 text-xs font-bold flex items-center justify-center">1</span>
          <h2 className="text-2xl font-bold text-white">Mesas</h2>
        </div>
        <p className="text-slate-400 text-sm ml-10">
          Creá cada mesa y subí el video de bienvenida personalizado.
        </p>
      </div>

      <Card className="glass glow-blue overflow-hidden relative border-white/[0.08]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        <CardHeader>
          <CardTitle className="text-base text-white">Agregar mesa</CardTitle>
          <CardDescription className="text-slate-400">Cada mesa debe tener un número único.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-28 space-y-1.5">
                <Label htmlFor="number" className="text-slate-300 text-sm font-medium">Número *</Label>
                <Input
                  id="number"
                  type="number"
                  min={1}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="1"
                  className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="mesa-name" className="text-slate-300 text-sm font-medium">Nombre (opcional)</Label>
                <Input
                  id="mesa-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Mesa de los amigos"
                  className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Agregar mesa"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl bg-white/[0.06]" />
          <Skeleton className="h-24 rounded-xl bg-white/[0.06]" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Todavía no hay mesas. ¡Agregá la primera!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <Card key={table.id} className="glass glass-hover overflow-hidden relative border-white/[0.08]">
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${table.videoPath ? "bg-emerald-400" : "bg-slate-600"}`} />
              <CardContent className="pt-4 pb-4 pl-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">Mesa {table.number}</span>
                      {table.name && (
                        <span className="text-slate-400 text-sm">· {table.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {table.guests.length} invitado(s) asignado(s)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => setDeleteTarget(table)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="border-t border-white/[0.06] my-3" />

                <div className="flex flex-wrap items-center gap-3">
                  {table.videoPath ? (
                    <div className="flex items-center gap-2">
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 border-0">
                        <CheckCircle2 className="w-3 h-3" /> Video cargado
                      </Badge>
                      <button
                        onClick={() => fileInputRefs.current[table.id]?.click()}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40"
                      onClick={() => fileInputRefs.current[table.id]?.click()}
                    >
                      <Video className="w-4 h-4" />
                      Subir video de saludo
                    </Button>
                  )}

                  {uploadingId === table.id && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Upload className="w-4 h-4 animate-pulse" />
                      Subiendo...
                    </div>
                  )}

                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    ref={(el) => { fileInputRefs.current[table.id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(table.id, file);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar mesa {deleteTarget?.number}?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará la mesa y todos sus invitados asignados
              ({deleteTarget?.guests.length ?? 0}). No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-white/[0.08] text-slate-300 hover:bg-white/[0.06]">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500/90 text-white">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
