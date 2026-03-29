"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LlegadaContent() {
  const params = useSearchParams();
  const name = params.get("name");
  const mesa = params.get("mesa");
  const error = params.get("error");
  const ya = params.get("ya");

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
        <div className="text-6xl mb-6">❓</div>
        <h1 className="text-2xl font-bold text-white mb-3">QR no reconocido</h1>
        <p className="text-gray-400 text-sm">
          Este código QR no está registrado en el sistema.
          <br />
          Consultá con el organizador.
        </p>
      </div>
    );
  }

  if (ya) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>
        <p className="text-gray-400 text-sm mb-6">Ya estás registrado/a</p>
        <div className="bg-white/10 rounded-2xl px-8 py-4 border border-white/20">
          <p className="text-gray-400 text-sm mb-1">Tu mesa es</p>
          <p className="text-5xl font-black text-white">{mesa}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "radial-gradient(ellipse at top, #3b0764 0%, #1a0533 40%, #0a0014 100%)",
      }}
    >
      {/* Decoración */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["✨", "🎉", "⭐", "🌟", "🎊", "✨", "🎈", "⭐"].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl opacity-30 animate-pulse"
            style={{
              top: `${10 + (i * 11) % 80}%`,
              left: `${5 + (i * 13) % 90}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* Ícono principal */}
        <div className="text-7xl mb-6 animate-bounce">🎉</div>

        {/* Bienvenida */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <p className="text-purple-300 text-sm font-medium uppercase tracking-widest mb-2">
            ¡Bienvenido/a!
          </p>

          {name && (
            <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
              {name}
            </h1>
          )}

          <div className="bg-purple-600/40 rounded-2xl p-5 border border-purple-400/30">
            <p className="text-purple-200 text-sm mb-1">Tu mesa es</p>
            <p className="text-6xl font-black text-white">{mesa}</p>
          </div>

          <p className="text-purple-300/70 text-xs mt-6">
            El proyector mostrará tu saludo en un momento 🎬
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
