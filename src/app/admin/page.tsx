"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <div className="flex items-center justify-center h-64 text-gray-400">
        Cargando...
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
        <h2 className="text-2xl font-bold text-gray-800">Panel de control</h2>
        <p className="text-gray-500 text-sm mt-1">Se actualiza cada 5 segundos</p>
      </div>

      {stats.totalGuests === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <span className="text-2xl">👋</span>
          <div>
            <p className="font-semibold text-amber-800">Bienvenido al sistema</p>
            <p className="text-amber-700 text-sm mt-1">
              Seguí los pasos del menú lateral para configurar la fiesta:{" "}
              <strong>Mesas → Invitados → QR Codes</strong>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total invitados" value={stats.totalGuests} color="violet" icon="👥" />
        <StatCard label="Llegaron" value={stats.arrivedGuests} color="green" icon="✅" />
        <StatCard label="Pendientes" value={pendingCount} color="amber" icon="⏳" />
      </div>

      {stats.totalGuests > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de llegada</span>
            <span className="text-sm font-bold text-violet-600">{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-violet-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {stats.tables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Estado por mesa</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.tables.map((table) => {
              const arrived = table.guests.filter((g) => g.hasArrived).length;
              const total = table.guests.length;
              return (
                <div
                  key={table.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">Mesa {table.number}</span>
                    {table.videoPath ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Video ✓</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Sin video</span>
                    )}
                  </div>
                  {table.name && <p className="text-xs text-gray-400 mb-2">{table.name}</p>}
                  <p className="text-sm text-gray-600">
                    {arrived} / {total} llegaron
                  </p>
                  {total > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-violet-400 h-1.5 rounded-full"
                        style={{ width: `${Math.round((arrived / total) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 pt-2">
        <Link href="/admin/tables" className="bg-violet-600 text-white rounded-xl p-4 text-center hover:bg-violet-700 transition-colors">
          <div className="text-2xl mb-1">🍽️</div>
          <div className="font-medium text-sm">Gestionar Mesas</div>
        </Link>
        <Link href="/admin/guests" className="bg-violet-600 text-white rounded-xl p-4 text-center hover:bg-violet-700 transition-colors">
          <div className="text-2xl mb-1">👥</div>
          <div className="font-medium text-sm">Gestionar Invitados</div>
        </Link>
        <Link href="/admin/qr-generator" className="bg-violet-600 text-white rounded-xl p-4 text-center hover:bg-violet-700 transition-colors">
          <div className="text-2xl mb-1">🔳</div>
          <div className="font-medium text-sm">Generar QRs</div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "violet" | "green" | "amber";
  icon: string;
}) {
  const colors = {
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    green: "bg-green-50 border-green-100 text-green-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div className={`rounded-xl border shadow-sm p-5 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 font-medium opacity-80">{label}</div>
    </div>
  );
}
