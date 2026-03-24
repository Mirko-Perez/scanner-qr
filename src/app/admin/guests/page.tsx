"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Users, Trash2, CheckCircle2, Clock, Filter } from "lucide-react";

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Paso 2 · Invitados</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cargá cada invitado y asignalo a una mesa.
        </p>
      </div>

      {tables.length === 0 && !loading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-amber-700 text-sm">
            ⚠️ Primero creá las mesas en el <strong>Paso 1</strong>.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar invitado</CardTitle>
          <CardDescription>Asigná cada invitado a una mesa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="guest-name">Nombre *</Label>
                <Input
                  id="guest-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="guest-lastname">Apellido *</Label>
                <Input
                  id="guest-lastname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mesa *</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger>
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
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={saving || tables.length === 0}>
              {saving ? "Guardando..." : "Agregar invitado"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {guests.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="w-44">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {arrivedCount}/{guests.length} llegaron
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay invitados en esta mesa.
              </div>
            ) : (
              filtered.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-foreground">
                        {guest.name} {guest.lastName}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">
                        · Mesa {guest.table.number}
                        {guest.table.name ? ` (${guest.table.name})` : ""}
                      </span>
                    </div>
                    {guest.hasArrived ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Llegó
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" /> Pendiente
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
        <div className="text-center py-16 text-muted-foreground">
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
