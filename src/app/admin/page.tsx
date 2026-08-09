"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UtensilsCrossed, QrCode, Video, Info, ArrowRight } from "lucide-react";

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
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-border" />
        <Skeleton className="h-28 rounded-2xl bg-border" />
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
        <h2 className="text-2xl font-bold text-foreground">Panel de control</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen del evento en tiempo real
        </p>
      </div>

      {/* Welcome banner */}
      {stats.totalGuests === 0 && (
        <div className="bg-primary/[0.06] border border-primary/[0.12] rounded-2xl overflow-hidden relative">
          <div className="relative p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Bienvenido al sistema</p>
              <p className="text-muted-foreground text-sm mt-1">
                Seguí los pasos del menú lateral:{" "}
                <strong className="text-foreground/80">Mesas → Invitados → QR Codes</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Arrival tracker — single coherent unit */}
      <div className="bg-card border border-border rounded-2xl px-6 py-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground leading-none">
              {stats.arrivedGuests}
            </span>
            <span className="text-5xl font-light text-muted-foreground/40 leading-none mx-1">/</span>
            <span className="text-2xl font-medium text-muted-foreground leading-none">
              {stats.totalGuests}
            </span>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">invitados presentes</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-semibold tabular-nums text-foreground leading-none">{progressPct}<span className="text-base font-normal text-muted-foreground">%</span></span>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">ingresaron</p>
          </div>
        </div>
        <Progress
          value={progressPct}
          className="h-1.5 bg-border [&>div]:bg-primary [&>div]:transition-transform [&>div]:duration-700"
        />
        {pendingCount > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {pendingCount} {pendingCount === 1 ? "invitado" : "invitados"} por llegar
          </p>
        )}
      </div>

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

              const statusBg = allArrived
                ? "bg-emerald-500/[0.06] border-emerald-500/20"
                : pct > 0
                  ? "bg-primary/[0.05] border-primary/15"
                  : "bg-card border-border";

              return (
                <Card
                  key={table.id}
                  className={`${statusBg} hover:bg-secondary/40 transition-colors duration-200 rounded-2xl`}
                >
                  <CardContent className="pt-4 pb-4 pl-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">Mesa {table.number}</p>
                        {table.name && (
                          <p className="text-xs text-muted-foreground">{table.name}</p>
                        )}
                      </div>
                      {table.videoPath ? (
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/15 text-[10px] gap-1">
                          <Video className="w-3 h-3" /> Video
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                          Sin video
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">{arrived}/{total}</span>
                      <span className="text-xs text-muted-foreground">presentes</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-border [&>div]:bg-primary [&>div]:transition-transform" />
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
          <Link
            href="/admin/tables"
            className="group glass glass-hover flex items-center gap-3 md:gap-4 p-4 md:p-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Gestionar Mesas
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-200" />
          </Link>
          <Link
            href="/admin/guests"
            className="group glass glass-hover flex items-center gap-3 md:gap-4 p-4 md:p-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Gestionar Invitados
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-200" />
          </Link>
          <Link
            href="/admin/qr-generator"
            className="group glass glass-hover flex items-center gap-3 md:gap-4 p-4 md:p-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
              <QrCode className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Generar QRs
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-200" />
          </Link>
        </div>
      </div>
    </div>
  );
}
