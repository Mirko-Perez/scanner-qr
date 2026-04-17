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
        <Skeleton className="h-8 w-48 bg-white/[0.12]" />
        <div className="grid grid-cols-3 gap-5">
          <Skeleton className="h-32 rounded-2xl bg-white/[0.12]" />
          <Skeleton className="h-32 rounded-2xl bg-white/[0.12]" />
          <Skeleton className="h-32 rounded-2xl bg-white/[0.12]" />
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Panel de control</h2>
        <p className="text-slate-300 text-sm mt-1">
          Resumen del evento en tiempo real
        </p>
      </div>

      {/* Welcome banner */}
      {stats.totalGuests === 0 && (
        <div className="glass glow-blue overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] to-transparent pointer-events-none" />
          <div className="relative p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Bienvenido al sistema</p>
              <p className="text-slate-300 text-sm mt-1">
                Seguí los pasos del menú lateral:{" "}
                <strong className="text-slate-300">Mesas → Invitados → QR Codes</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <Card className="glass glow-blue border-white/[0.14] bg-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalGuests}</div>
            <p className="text-sm text-slate-300 mt-1">Invitados registrados</p>
          </CardContent>
        </Card>

        <Card className="glass glow-emerald border-white/[0.14] bg-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{stats.arrivedGuests}</div>
            <p className="text-sm text-slate-300 mt-1">Presentes en el evento</p>
          </CardContent>
        </Card>

        <Card className="glass glow-amber border-white/[0.14] bg-white/[0.08]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{pendingCount}</div>
            <p className="text-sm text-slate-300 mt-1">Por llegar</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {stats.totalGuests > 0 && (
        <Card className="glass border-white/[0.14] bg-white/[0.08]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-300">
                Progreso de llegada
              </CardTitle>
              <span className="text-2xl font-bold text-white">{progressPct}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Progress value={progressPct} className="h-3 bg-white/[0.12] [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-400 [&>div]:shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {stats.arrivedGuests} de {stats.totalGuests} invitados presentes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tables grid */}
      {stats.tables.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Estado por mesa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.tables.map((table) => {
              const arrived = table.guests.filter((g) => g.hasArrived).length;
              const total = table.guests.length;
              const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;
              const allArrived = total > 0 && arrived === total;

              const borderColor = allArrived
                ? "border-l-emerald-500/60"
                : pct > 0
                  ? "border-l-blue-500/60"
                  : "border-l-white/[0.12]";

              return (
                <Card
                  key={table.id}
                  className={`glass glass-hover border-white/[0.14] bg-white/[0.08] border-l-2 ${borderColor} ${allArrived ? "glow-emerald" : ""}`}
                >
                  <CardContent className="pt-4 pb-4 pl-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">Mesa {table.number}</p>
                        {table.name && (
                          <p className="text-xs text-slate-400">{table.name}</p>
                        )}
                      </div>
                      {table.videoPath ? (
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/15 text-[10px] gap-1">
                          <Video className="w-3 h-3" /> Video
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400 border-white/[0.18]">
                          Sin video
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white">{arrived}/{total}</span>
                      <span className="text-xs text-slate-400">presentes</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-white/[0.12] [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-400" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Accesos rápidos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Link
            href="/admin/tables"
            className="group glass glass-hover flex items-center gap-3 md:gap-4 p-4 md:p-5 hover:glow-blue transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              Gestionar Mesas
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Link>
          <Link
            href="/admin/guests"
            className="group glass glass-hover flex items-center gap-3 md:gap-4 p-4 md:p-5 hover:glow-emerald transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              Gestionar Invitados
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Link>
          <Link
            href="/admin/qr-generator"
            className="group glass glass-hover flex items-center gap-3 md:gap-4 p-4 md:p-5 hover:glow-violet transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
              <QrCode className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              Generar QRs
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Link>
        </div>
      </div>
    </div>
  );
}
