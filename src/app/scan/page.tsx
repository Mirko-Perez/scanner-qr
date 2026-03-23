"use client";

import { useEffect, useRef, useState } from "react";

type ScanResult = {
  guestName: string;
  tableNumber: number;
} | null;

type ScanStatus = "idle" | "scanning" | "success" | "error" | "notfound";

export default function ScanPage() {
  const scannerRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<ScanResult>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const cooldownRef = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void> } | null = null;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!containerRef.current) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      scanner = html5QrCode;

      setStatus("scanning");

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;

          try {
            const res = await fetch("/api/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guestId: decodedText }),
            });

            const data = await res.json();

            if (res.ok) {
              setResult({ guestName: data.event.guestName, tableNumber: data.event.tableNumber });
              setStatus("success");
            } else if (res.status === 404) {
              setStatus("notfound");
            } else {
              setErrorMsg(data.error || "Error desconocido");
              setStatus("error");
            }
          } catch {
            setStatus("error");
            setErrorMsg("Error de conexión con el servidor");
          }

          setTimeout(() => {
            cooldownRef.current = false;
            setStatus("scanning");
            setResult(null);
          }, 3000);
        },
        () => {}
      );
    };

    startScanner();

    return () => {
      scanner?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">📷 Scanner QR</h1>
          <p className="text-gray-400 text-sm mt-1">Apuntá la cámara al QR de la pulsera</p>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black">
          <div id="qr-reader" ref={containerRef} className="w-full" />

          {status === "success" && result && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white text-center p-6 rounded-2xl">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-xl font-bold">{result.guestName}</p>
              <p className="text-lg mt-2">Mesa {result.tableNumber}</p>
            </div>
          )}

          {status === "notfound" && (
            <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center text-white text-center p-6 rounded-2xl">
              <div className="text-5xl mb-3">❌</div>
              <p className="text-lg font-semibold">Invitado no encontrado</p>
              <p className="text-sm mt-1 opacity-80">QR no registrado en el sistema</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 bg-orange-500/90 flex flex-col items-center justify-center text-white text-center p-6 rounded-2xl">
              <div className="text-5xl mb-3">⚠️</div>
              <p className="text-lg font-semibold">Error</p>
              <p className="text-sm mt-1 opacity-80">{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-4 text-center">
          {status === "scanning" && (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm">Esperando QR...</span>
            </div>
          )}
          {status === "idle" && (
            <p className="text-gray-400 text-sm">Iniciando cámara...</p>
          )}
          {status === "success" && result && (
            <p className="text-green-400 text-sm font-medium">
              ✓ Check-in enviado al proyector
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
