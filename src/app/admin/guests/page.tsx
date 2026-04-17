"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trash2, CheckCircle2, Clock, Filter, AlertTriangle } from "lucide-react";

type TableOption = { id: number; number: number; name: string | null };
type Guest = {
  id: string;
  name: string;
  lastName: string;
  hasArrived: boolean;
  arrivedAt: string | null;
  table: { number: number; name: string | null };
};

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tableId, setTableId] = useState<string>("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

  const fetchData = async () => {
    const [gRes, tRes] = await Promise.all([
      fetch("/api/guests"),
      fetch("/api/tables"),
    ]);
    if (gRes.ok) setGuests(await gRes.json());
    if (tRes.ok) setTables(await tRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !lastName || !tableId) {
      setError("Completá todos los campos");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lastName, tableId: parseInt(tableId) }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al agregar invitado");
      return;
    }
    setName("");
    setLastName("");
    toast.success(`${name} ${lastName} agregado/a`);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/guests/${deleteTarget.id}`, { method: "DELETE" });
    toast.success(`${deleteTarget.name} ${deleteTarget.lastName} eliminado/a`);
    setDeleteTarget(null);
    fetchData();
  };

  const filtered =
    filterTable === "all"
      ? guests
      : guests.filter((g) => g.table.number === parseInt(filterTable));

  const arrivedCount = guests.filter((g) => g.hasArrived).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 text-xs font-bold flex items-center justify-center">2</span>
          <h2 className="text-2xl font-bold text-white">Invitados</h2>
        </div>
        <p className="text-slate-400 text-sm ml-10">
          Cargá cada invitado y asignalo a una mesa.
        </p>
      </div>

      {tables.length === 0 && !loading && (
        <div className="glass glow-amber overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent pointer-events-none" />
          <div className="relative pt-6 pb-5 px-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">Sin mesas creadas</p>
              <p className="text-amber-400/80 text-sm mt-1">Primero creá las mesas en el <strong className="text-amber-300">Paso 1</strong>.</p>
            </div>
          </div>
        </div>
      )}

      <Card className="glass glow-blue overflow-hidden relative border-white/[0.08]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        <CardHeader>
          <CardTitle className="text-base text-white">Agregar invitado</CardTitle>
          <CardDescription className="text-slate-400">Asigná cada invitado a una mesa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="guest-name" className="text-slate-300 text-sm font-medium">Nombre *</Label>
                <Input
                  id="guest-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan"
                  className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="guest-lastname" className="text-slate-300 text-sm font-medium">Apellido *</Label>
                <Input
                  id="guest-lastname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez"
                  className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm font-medium">Mesa *</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="bg-white/[0.06] border-white/[0.08] text-white focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl [&>span]:text-slate-400">
                  <SelectValue placeholder="Seleccioná una mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      Mesa {t.number}{t.name ? ` · ${t.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={saving || tables.length === 0}>
              {saving ? "Guardando..." : "Agregar invitado"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {guests.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="w-40 sm:w-44 bg-white/[0.06] border-white/[0.08] text-white focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos ({guests.length})</SelectItem>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={String(t.number)}>
                      Mesa {t.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">{arrivedCount}</span>/{guests.length} llegaron
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-16 rounded-xl bg-white/[0.06]" />
                <Skeleton className="h-16 rounded-xl bg-white/[0.06]" />
                <Skeleton className="h-16 rounded-xl bg-white/[0.06]" />
              </>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No hay invitados en esta mesa.
              </div>
            ) : (
              filtered.map((guest) => (
                <div
                  key={guest.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 px-4 py-3 glass glass-hover rounded-xl overflow-hidden relative"
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${guest.hasArrived ? "bg-emerald-400" : "bg-slate-600"}`} />
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-2">
                    <div>
                      <span className="font-medium text-white">
                        {guest.name} {guest.lastName}
                      </span>
                      <span className="text-slate-400 text-sm ml-2">
                        · Mesa {guest.table.number}
                        {guest.table.name ? ` (${guest.table.name})` : ""}
                      </span>
                    </div>
                    {guest.hasArrived ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 gap-1 text-xs border-0">
                        <CheckCircle2 className="w-3 h-3" /> Llegó
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-slate-400 text-xs border-white/[0.1]">
                        <Clock className="w-3 h-3" /> Pendiente
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 self-end sm:self-auto"
                    onClick={() => setDeleteTarget(guest)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!loading && guests.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay invitados todavía.</p>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ¿Eliminar a {deleteTarget?.name} {deleteTarget?.lastName}?
            </DialogTitle>
            <DialogDescription>
              Se eliminará el invitado y su QR code dejará de funcionar. Esta acción no se puede deshacer.
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
