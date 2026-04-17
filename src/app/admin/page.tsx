"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, Clock, UtensilsCrossed, QrCode, Video, Info } from "lucide-react";

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
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Panel de control</h2>
        <p className="text-muted-foreground text-sm mt-1">Se actualiza automáticamente cada 5 segundos</p>
      </div>

      {stats.totalGuests === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-800">Bienvenido al sistema</p>
              <p className="text-blue-700 text-sm mt-1">
                Seguí los pasos del menú lateral:{" "}
                <strong>Mesas → Invitados → QR Codes</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-primary" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground">{stats.totalGuests}</div>
            <p className="text-muted-foreground text-sm mt-1">Invitados</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Llegaron</Badge>
            </div>
            <div className="text-3xl font-bold text-green-700">{stats.arrivedGuests}</div>
            <p className="text-muted-foreground text-sm mt-1">Presentes</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendientes</Badge>
            </div>
            <div className="text-3xl font-bold text-amber-700">{pendingCount}</div>
            <p className="text-muted-foreground text-sm mt-1">Por llegar</p>
          </CardContent>
        </Card>
      </div>

      {stats.totalGuests > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progreso de llegada
              </CardTitle>
              <span className="text-sm font-bold text-primary">{progressPct}%</span>
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

      {stats.tables.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Estado por mesa
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.tables.map((table) => {
              const arrived = table.guests.filter((g) => g.hasArrived).length;
              const total = table.guests.length;
              const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;
              return (
                <Card key={table.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">Mesa {table.number}</p>
                        {table.name && (
                          <p className="text-xs text-muted-foreground">{table.name}</p>
                        )}
                      </div>
                      {table.videoPath ? (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Video className="w-3 h-3" /> Video
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Sin video
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {arrived}/{total} presentes
                    </p>
                    <Progress value={pct} className="h-1.5" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-3 gap-3">
        <Button asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/admin/tables">
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-sm">Gestionar Mesas</span>
          </Link>
        </Button>
        <Button asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/admin/guests">
            <Users className="w-5 h-5" />
            <span className="text-sm">Gestionar Invitados</span>
          </Link>
        </Button>
        <Button asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/admin/qr-generator">
            <QrCode className="w-5 h-5" />
            <span className="text-sm">Generar QRs</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
