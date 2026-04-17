"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  QrCode,
  Monitor,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, step: 0 },
  { href: "/admin/tables", label: "Mesas", icon: UtensilsCrossed, step: 1 },
  { href: "/admin/guests", label: "Invitados", icon: Users, step: 2 },
  { href: "/admin/qr-generator", label: "QR Codes", icon: QrCode, step: 3 },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
          Navegación
        </p>
      </div>

      <div className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, step }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative",
                active
                  ? "bg-blue-600/15 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full" />
              )}
              {step > 0 ? (
                <span
                  className={cn(
                    "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors",
                    active
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"
                  )}
                >
                  {step}
                </span>
              ) : (
                <Icon className={cn("w-5 h-5 shrink-0", active ? "text-blue-400" : "")} />
              )}
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-3 pb-4 mt-auto">
        <div className="h-px bg-slate-700/50 mb-3" />
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
          Evento
        </p>
        <Link
          href="/display"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all group"
        >
          <Monitor className="w-5 h-5 shrink-0" />
          <span className="font-medium flex-1">Proyector</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-white px-4 md:px-5 py-3 flex items-center gap-3 md:gap-4 shadow-lg relative z-30">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Image
          src="/logo.png"
          alt="Lua Fest XV"
          width={36}
          height={36}
          className="rounded-lg ring-1 ring-white/10 md:w-10 md:h-10"
        />
        <div className="flex flex-col">
          <h1 className="text-sm md:text-base font-bold tracking-tight leading-tight">Lua Fest XV</h1>
          <span className="text-[10px] md:text-[11px] text-blue-300/70 font-medium tracking-wide">Panel de Administración</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — desktop: always visible, mobile: slide-in */}
        <nav
          className={cn(
            "bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 transition-transform duration-200 ease-out",
            "fixed md:relative top-0 md:top-auto left-0 h-full w-64 md:w-60 pt-16 md:pt-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
