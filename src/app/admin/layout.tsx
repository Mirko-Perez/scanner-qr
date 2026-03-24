"use client";

import Link from "next/link";
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
  ScanLine,
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
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-3 shadow-md">
        <span className="text-2xl">🎉</span>
        <h1 className="text-xl font-bold tracking-tight">Sistema QR · Panel Admin</h1>
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
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-muted-foreground" asChild>
              <Link href="/scan" target="_blank">
                <ScanLine className="w-4 h-4" />
                Abrir Scanner
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
