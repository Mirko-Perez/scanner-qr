"use client";

import { useEffect, useState } from "react";

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
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tableId, setTableId] = useState<string>("");
  const [filterTable, setFilterTable] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [gRes, tRes] = await Promise.all([
      fetch("/api/guests"),
      fetch("/api/tables"),
    ]);
    if (gRes.ok) setGuests(await gRes.json());
    if (tRes.ok) setTables(await tRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !lastName || !tableId) {
      setError("Completá todos los campos");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lastName, tableId: parseInt(tableId) }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al agregar invitado");
      return;
    }
    setName("");
    setLastName("");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este invitado?")) return;
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filtered = filterTable
    ? guests.filter((g) => g.table.number === parseInt(filterTable))
    : guests;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 2 · Invitados</h2>
        <p className="text-gray-500 text-sm mt-1">
          Cargá cada invitado y asignalo a una mesa.
        </p>
      </div>

      {tables.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
          ⚠️ Primero creá las mesas en el <strong>Paso 1</strong>.
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-700">Agregar invitado</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Apellido *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Mesa *</label>
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">Seleccioná una mesa</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Mesa {t.number}{t.name ? ` · ${t.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || tables.length === 0}
          className="bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Agregar invitado"}
        </button>
      </form>

      {guests.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Filtrar por mesa:</label>
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">Todas ({guests.length})</option>
            {tables.map((t) => (
              <option key={t.id} value={t.number}>
                Mesa {t.number}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p>No hay invitados todavía.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((guest) => (
            <div
              key={guest.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-gray-800">
                  {guest.name} {guest.lastName}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  · Mesa {guest.table.number}
                  {guest.table.name ? ` (${guest.table.name})` : ""}
                </span>
                {guest.hasArrived && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Llegó
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(guest.id)}
                className="text-red-400 hover:text-red-600 text-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
