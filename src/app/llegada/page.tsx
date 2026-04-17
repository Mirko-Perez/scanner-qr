"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function LlegadaContent() {
  const params = useSearchParams();
  const name = params.get("name");
  const mesa = params.get("mesa");
  const error = params.get("error");
  const ya = params.get("ya");

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-black px-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-400/80 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">QR no reconocido</h1>
        <p className="text-slate-400 text-sm">
          Este código QR no está registrado en el sistema.
          <br />
          Consultá con el organizador.
        </p>
      </div>
    );
  }

  if (ya) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-black px-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400/80 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>
        <p className="text-slate-400 text-sm mb-6">Ya estás registrado/a</p>
        <div className="bg-white/5 rounded-2xl px-8 py-5 border border-white/10">
          <p className="text-slate-400 text-sm mb-1">Tu mesa es</p>
          <p className="text-5xl font-black text-white">{mesa}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "radial-gradient(ellipse at top, #0c1929 0%, #060d16 40%, #000000 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-sm w-full">
        <Image
          src="/logo.png"
          alt="Lua Fest XV"
          width={140}
          height={140}
          className="mx-auto mb-6 drop-shadow-[0_0_30px_rgba(59,130,246,0.25)]"
          priority
        />

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <p className="text-blue-300/80 text-sm font-medium uppercase tracking-widest mb-2">
            ¡Bienvenido/a!
          </p>

          {name && (
            <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
              {name}
            </h1>
          )}

          <div className="bg-blue-500/15 rounded-2xl p-5 border border-blue-400/20">
            <p className="text-blue-200/70 text-sm mb-1">Tu mesa es</p>
            <p className="text-6xl font-black text-white">{mesa}</p>
          </div>

          <p className="text-slate-500 text-xs mt-6">
            El proyector mostrará tu saludo en un momento
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LlegadaPage() {
  return (
    <Suspense>
      <LlegadaContent />
    </Suspense>
  );
}
