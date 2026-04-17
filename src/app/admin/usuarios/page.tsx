"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

type User = {
  id: number;
  username: string;
  role: string;
  createdAt: string;
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("INVITADO");
  const [creating, setCreating] = useState(false);

  async function fetchUsers() {
    const res = await fetch("/api/auth/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        role: newRole,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      toast.error(data.error);
      return;
    }

    toast.success(`Usuario "${data.username}" creado`);
    setNewUsername("");
    setNewPassword("");
    setNewRole("INVITADO");
    setShowCreate(false);
    fetchUsers();
  }

  async function handleRoleChange(user: User) {
    const newRole = user.role === "SUPERADMIN" ? "INVITADO" : "SUPERADMIN";

    const res = await fetch(`/api/auth/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error);
      return;
    }

    toast.success(`Rol de "${user.username}" cambiado a ${newRole}`);
    fetchUsers();
  }

  async function handleDelete(user: User) {
    if (!confirm(`¿Eliminar al usuario "${user.username}"?`)) return;

    const res = await fetch(`/api/auth/users/${user.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error);
      return;
    }

    toast.success(`Usuario "${user.username}" eliminado`);
    fetchUsers();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Usuarios</h2>
          <p className="text-slate-300 text-sm mt-1">
            Gestionar accesos y roles del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all glow-blue text-sm"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Crear usuario</h3>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="nombre_usuario"
                className="w-full px-3 py-2.5 bg-white/12 border border-white/[0.18] rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2.5 bg-white/12 border border-white/[0.18] rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                required
                minLength={4}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Rol
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/12 border border-white/[0.18] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              >
                <option value="INVITADO" className="bg-[#1e2940]">Invitado</option>
                <option value="SUPERADMIN" className="bg-[#1e2940]">Super Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.12]">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                  Usuario
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                  Rol
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 hidden sm:table-cell">
                  Creado
                </th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay usuarios registrados</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.10] flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-300 uppercase">
                            {user.username.slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleRoleChange(user)}
                        className="inline-flex items-center gap-1.5 group"
                        title="Click para cambiar rol"
                      >
                        {user.role === "SUPERADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-semibold ring-1 ring-amber-500/25 group-hover:ring-amber-500/40 transition-all">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/15 text-slate-300 text-xs font-semibold ring-1 ring-slate-500/25 group-hover:ring-slate-400/40 transition-all">
                            <Shield className="w-3.5 h-3.5" />
                            Invitado
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
