"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, Clock, UtensilsCrossed, QrCode, Video, Info, ArrowRight } from "lucide-react";

type TableStat = {
  id: number;
  number: number;
  name: string | null;
  videoPath: string | null;
  guests: { hasArrived: boolean }[];
};

type Stats = {
  totalGuests: number;
  arrivedGuests: number;
  tables: TableStat[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = async () => {
    const res = await fetch("/api/stats");
    if (res.ok) setStats(await res.json());
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-5">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  const pendingCount = stats.totalGuests - stats.arrivedGuests;
  const progressPct =
    stats.totalGuests > 0
      ? Math.round((stats.arrivedGuests / stats.totalGuests) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Panel de control</h2>
        <p className="text-muted-foreground text-sm mt-1">Resumen del evento en tiempo real</p>
      </div>

      {stats.totalGuests === 0 && (
        <Card className="border-blue-200 bg-blue-50/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">Bienvenido al sistema</p>
              <p className="text-blue-700 text-sm mt-1">
                Seguí los pasos del menú lateral:{" "}
                <strong>Mesas → Invitados → QR Codes</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="text-xs">Total</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground">{stats.totalGuests}</div>
            <p className="text-muted-foreground text-sm mt-1">Invitados registrados</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Llegaron</Badge>
            </div>
            <div className="text-3xl font-bold text-emerald-700">{stats.arrivedGuests}</div>
            <p className="text-muted-foreground text-sm mt-1">Presentes en el evento</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Pendientes</Badge>
            </div>
            <div className="text-3xl font-bold text-amber-700">{pendingCount}</div>
            <p className="text-muted-foreground text-sm mt-1">Por llegar</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {stats.totalGuests > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progreso de llegada
              </CardTitle>
              <span className="text-lg font-bold text-primary">{progressPct}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPct} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.arrivedGuests} de {stats.totalGuests} invitados presentes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tables grid */}
      {stats.tables.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Estado por mesa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.tables.map((table) => {
              const arrived = table.guests.filter((g) => g.hasArrived).length;
              const total = table.guests.length;
              const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;
              const allArrived = total > 0 && arrived === total;
              return (
                <Card
                  key={table.id}
                  className={`hover:shadow-md transition-all overflow-hidden relative ${allArrived ? "ring-1 ring-emerald-200" : ""}`}
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${allArrived ? "bg-emerald-400" : pct > 0 ? "bg-blue-400" : "bg-slate-200"}`} />
                  <CardContent className="pt-4 pb-4 pl-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">Mesa {table.number}</p>
                        {table.name && (
                          <p className="text-xs text-muted-foreground">{table.name}</p>
                        )}
                      </div>
                      {table.videoPath ? (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Video className="w-3 h-3" /> Video
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Sin video
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">{arrived}/{total}</span>
                      <span className="text-xs text-muted-foreground">presentes</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Accesos rápidos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            { href: "/admin/tables", icon: UtensilsCrossed, label: "Gestionar Mesas", color: "blue" },
            { href: "/admin/guests", icon: Users, label: "Gestionar Invitados", color: "emerald" },
            { href: "/admin/qr-generator", icon: QrCode, label: "Generar QRs", color: "violet" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-border hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center shrink-0 group-hover:bg-${color}-100 transition-colors`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
