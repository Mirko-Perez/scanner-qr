"use client";

import { useEffect, useState, useRef } from "react";

type TableData = {
  id: number;
  number: number;
  name: string | null;
  videoPath: string | null;
  guests: { id: string }[];
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchTables = async () => {
    const res = await fetch("/api/tables");
    if (res.ok) setTables(await res.json());
  };

  useEffect(() => { fetchTables(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!number) { setError("Ingresá el número de mesa"); return; }
    setLoading(true);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: parseInt(number), name: name || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al crear la mesa");
      return;
    }
    setNumber("");
    setName("");
    fetchTables();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta mesa y todos sus invitados?")) return;
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    fetchTables();
  };

  const handleVideoUpload = async (tableId: number, file: File) => {
    setUploadingId(tableId);
    const formData = new FormData();
    formData.append("video", file);
    formData.append("tableId", String(tableId));
    await fetch("/api/upload-video", { method: "POST", body: formData });
    setUploadingId(null);
    fetchTables();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 1 · Mesas</h2>
        <p className="text-gray-500 text-sm mt-1">
          Creá cada mesa y subí el video de saludo que la cumpleañera grabó para cada una.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-700">Agregar mesa</h3>
        <div className="flex gap-3">
          <div className="w-28">
            <label className="text-xs text-gray-500 mb-1 block">Número *</label>
            <input
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Nombre (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mesa de los amigos"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Agregar mesa"}
        </button>
      </form>

      {tables.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p>Todavía no hay mesas. ¡Agregá la primera!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-800">Mesa {table.number}</span>
                  {table.name && <span className="text-gray-400 text-sm ml-2">· {table.name}</span>}
                  <p className="text-xs text-gray-400 mt-0.5">{table.guests.length} invitado(s)</p>
                </div>
                <button
                  onClick={() => handleDelete(table.id)}
                  className="text-red-400 hover:text-red-600 text-sm transition-colors"
                >
                  Eliminar
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {table.videoPath ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      ✓ Video cargado
                    </span>
                    <button
                      onClick={() => fileInputRefs.current[table.id]?.click()}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[table.id]?.click()}
                    className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                  >
                    📹 Subir video de saludo
                  </button>
                )}

                {uploadingId === table.id && (
                  <span className="text-xs text-gray-400">Subiendo...</span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
