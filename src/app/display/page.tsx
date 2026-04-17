"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ScanEvent } from "@/lib/events";

type State = "idle" | "playing" | "ending";

export default function DisplayPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("idle");
  const [current, setCurrent] = useState<ScanEvent | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.onmessage = (e) => {
      const event: ScanEvent = JSON.parse(e.data);
      setCurrent(event);
      setState("playing");
    };

    es.onerror = () => {
      setTimeout(() => {}, 3000);
    };

    return () => es.close();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || state !== "playing" || !current?.videoPath) return;

    video.src = current.videoPath;
    video.load();
    video.play().catch(() => {});

    const handleEnd = () => {
      setState("ending");
      setTimeout(() => {
        setState("idle");
        setCurrent(null);
      }, 4000);
    };

    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, [state, current]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Video layer */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          state === "playing" ? "opacity-100" : "opacity-0"
        }`}
        playsInline
        muted={false}
      />

      {/* Idle screen */}
      {state === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-slate-950 to-blue-950 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
          <div className="relative text-center space-y-6 md:space-y-8">
            <Image
              src="/logo.png"
              alt="ScannFest"
              width={280}
              height={280}
              className="mx-auto w-48 h-48 md:w-72 md:h-72 drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
              style={{
                maskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
              }}
              priority
            />
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              ¡Bienvenidos!
            </h1>
            <p className="text-base md:text-xl text-blue-300/70 font-light">
              Escaneá tu pulsera para ver tu mesa
            </p>
          </div>
          <div className="absolute bottom-8 right-8 flex gap-2 items-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-slate-400 text-sm">Sistema activo</span>
          </div>
        </div>
      )}

      {/* Guest info overlay while playing */}
      {state === "playing" && current && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-10">
          <p className="text-white/75 text-base md:text-xl mb-1 font-light">
            Bienvenido/a
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            {current.guestName}
          </h2>
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 md:px-6 md:py-3">
            <span className="text-xl md:text-3xl font-bold text-white">
              Mesa {current.tableNumber}
            </span>
          </div>
        </div>
      )}

      {/* No video fallback: show info fullscreen */}
      {state === "playing" && current && !current.videoPath && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-slate-950 to-blue-950 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_60%)]" />
          <div className="relative text-center space-y-4 md:space-y-6">
            <Image
              src="/logo.png"
              alt="ScannFest"
              width={160}
              height={160}
              className="mx-auto w-28 h-28 md:w-40 md:h-40 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              style={{
                maskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
              }}
            />
            <p className="text-lg md:text-2xl text-blue-300/70 font-light">
              Bienvenido/a
            </p>
            <h2 className="text-4xl md:text-7xl font-bold text-white">
              {current.guestName}
            </h2>
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-3 md:px-10 md:py-5 mt-4">
              <span className="text-3xl md:text-5xl font-bold text-white">
                Mesa {current.tableNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ending fade */}
      {state === "ending" && current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-slate-950 to-blue-950 animate-fade-in px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_60%)]" />
          <div className="relative text-center space-y-4 md:space-y-6">
            <Image
              src="/logo.png"
              alt="ScannFest"
              width={120}
              height={120}
              className="mx-auto w-20 h-20 md:w-28 md:h-28 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              style={{
                maskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(circle, white 40%, transparent 75%)",
              }}
            />
            <h2 className="text-4xl md:text-6xl font-bold text-white">
              {current.guestName}
            </h2>
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-3 md:px-10 md:py-5">
              <span className="text-2xl md:text-4xl font-bold text-white">
                Dirigite a la Mesa {current.tableNumber}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
