"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { href: "/admin", label: "Panel", icon: "📊", step: null },
  { href: "/admin/tables", label: "Paso 1 · Mesas", icon: "🍽️", step: 1 },
  { href: "/admin/guests", label: "Paso 2 · Invitados", icon: "👥", step: 2 },
  { href: "/admin/qr-generator", label: "Paso 3 · QR Codes", icon: "🔳", step: 3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-violet-700 text-white px-6 py-4 flex items-center gap-3 shadow-md">
        <span className="text-2xl">🎉</span>
        <h1 className="text-xl font-bold tracking-tight">Sistema QR - Panel Admin</h1>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 bg-white border-r border-violet-100 p-4 flex flex-col gap-1 shadow-sm">
          {steps.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-gray-700 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-1">
            <Link
              href="/display"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <span>📽️</span>
              Abrir Proyector
            </Link>
            <Link
              href="/scan"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <span>📷</span>
              Abrir Scanner
            </Link>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
