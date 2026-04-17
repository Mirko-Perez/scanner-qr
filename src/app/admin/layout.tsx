"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  QrCode,
  Camera,
  ScanLine,
  Monitor,
  ExternalLink,
  Menu,
  X,
  Image as ImageIcon,
  LogOut,
  ShieldCheck,
  KeyRound,
  UserCog,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, step: 0 },
  { href: "/admin/tables", label: "Mesas", icon: UtensilsCrossed, step: 1 },
  { href: "/admin/guests", label: "Invitados", icon: Users, step: 2 },
  { href: "/admin/qr-generator", label: "QR Codes", icon: QrCode, step: 3 },
  { href: "/admin/recuerdos", label: "Recuerdos", icon: Camera, step: 4 },
  { href: "/admin/qr-mesas", label: "QR Mesas", icon: ScanLine, step: 5 },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog, step: 0 },
];

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  currentUser,
  onChangePassword,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
  currentUser: { username: string; role: string } | null;
  onChangePassword: () => void;
}) {
  return (
    <>
      {/* Brand section */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="ScannFest"
            width={36}
            height={36}
            className="rounded-xl ring-1 ring-white/10"
          />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              ScannFest
            </p>
            <p className="text-[10px] text-blue-400/70 font-medium">
              Event Manager
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.10] mx-4" />

      {/* Navigation */}
      <div className="flex-1 px-3 pt-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, step }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group relative",
                active
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/[0.08] hover:text-slate-200",
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full" />
              )}
              {step > 0 ? (
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors",
                    active
                      ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-white/[0.10] text-slate-400 group-hover:text-slate-300",
                  )}
                >
                  {step}
                </span>
              ) : (
                <Icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0",
                    active ? "text-blue-400" : "",
                  )}
                />
              )}
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Evento section */}
      <div className="px-3 pb-4 mt-auto">
        <div className="h-px bg-white/[0.10] mx-1 mb-3" />
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.15em] px-3 mb-2">
          Evento
        </p>
        {[
          { href: "/display", label: "Proyector", icon: Monitor },
          {
            href: "/recuerdos/monitor",
            label: "Monitor Recuerdos",
            icon: ImageIcon,
          },
          { href: "/recuerdos", label: "Galería", icon: Camera },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300 transition-all group"
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium flex-1">{label}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}

        {/* User profile section */}
        {currentUser && (
          <>
            <div className="h-px bg-white/[0.10] mx-1 my-3" />
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.10] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-slate-300 uppercase">
                  {currentUser.username.slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser.username}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {currentUser.role === "SUPERADMIN" ? "Admin" : "Invitado"}
                </p>
              </div>
            </div>
            <button
              onClick={onChangePassword}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300 transition-all group w-full"
            >
              <KeyRound className="w-[18px] h-[18px] shrink-0" />
              <span className="font-medium">Cambiar contraseña</span>
            </button>
          </>
        )}

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-400 transition-all group w-full mt-1"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
  } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);

    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setChangingPassword(false);

    if (!res.ok) {
      toast.error(data.error);
      return;
    }

    toast.success("Contraseña actualizada");
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.06)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.04)_0%,transparent_50%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 border-b border-white/[0.14] bg-white/[0.10] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 md:px-5 py-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/[0.10] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-slate-300" />
            ) : (
              <Menu className="w-5 h-5 text-slate-300" />
            )}
          </button>
          <div className="hidden md:block w-[228px]" />
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">
              Sistema activo
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav
          className={cn(
            "flex flex-col z-20 transition-transform duration-200 ease-out shrink-0",
            "bg-[#131c2e]/90 backdrop-blur-xl border-r border-white/[0.14]",
            "fixed md:static inset-y-0 left-0 w-64 md:w-[240px] pt-14 md:pt-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex flex-col flex-1 overflow-y-auto">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              currentUser={currentUser}
              onChangePassword={() => setShowPasswordModal(true)}
            />
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto relative">
          <div key={pathname} className="p-4 md:p-8 page-transition">{children}</div>
        </main>
      </div>

      {/* Change password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a2538] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Cambiar contraseña
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-white/[0.12] text-sm text-slate-300 hover:bg-white/[0.06] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {changingPassword ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
