"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  QrCode,
  Monitor,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/tables", label: "Paso 1 · Mesas", icon: UtensilsCrossed },
  { href: "/admin/guests", label: "Paso 2 · Invitados", icon: Users },
  { href: "/admin/qr-generator", label: "Paso 3 · QR Codes", icon: QrCode },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-3 flex items-center gap-4 shadow-lg border-b border-blue-500/20">
        <Image
          src="/logo.png"
          alt="Lua Fest XV"
          width={44}
          height={44}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight leading-tight">Lua Fest XV</h1>
          <span className="text-xs text-blue-300/80 font-medium tracking-wide">Panel de Administración</span>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 bg-card border-r border-border p-3 flex flex-col gap-1 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 mt-1">
            Configuración
          </p>

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Button
                key={href}
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 text-sm",
                  !active && "text-muted-foreground"
                )}
                asChild
              >
                <Link href={href}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </Button>
            );
          })}

          <div className="mt-auto">
            <Separator className="my-3" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Evento
            </p>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-muted-foreground" asChild>
              <Link href="/display" target="_blank">
                <Monitor className="w-4 h-4" />
                Abrir Proyector
              </Link>
            </Button>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
