"use client";

import { useEffect, useRef, useState } from "react";
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-violet-900 via-purple-900 to-indigo-900">
          <div className="text-center space-y-6 animate-pulse">
            <div className="text-8xl">🎉</div>
            <h1 className="text-6xl font-bold text-white tracking-tight">
              ¡Bienvenidos!
            </h1>
            <p className="text-2xl text-violet-300">
              Escaneá tu pulsera para ver tu mesa
            </p>
          </div>
          <div className="absolute bottom-8 right-8 flex gap-2 items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-violet-400 text-sm">Sistema activo</span>
          </div>
        </div>
      )}

      {/* Guest info overlay while playing */}
      {state === "playing" && current && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-10">
          <p className="text-white/70 text-xl mb-1">Bienvenido/a</p>
          <h2 className="text-5xl font-bold text-white mb-3">{current.guestName}</h2>
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3">
            <span className="text-3xl">🍽️</span>
            <span className="text-3xl font-bold text-white">
              Mesa {current.tableNumber}
            </span>
          </div>
        </div>
      )}

      {/* No video fallback: show info fullscreen */}
      {state === "playing" && current && !current.videoPath && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-violet-900 via-purple-900 to-indigo-900">
          <div className="text-center space-y-6">
            <div className="text-8xl">🎉</div>
            <p className="text-3xl text-violet-300">Bienvenido/a</p>
            <h2 className="text-7xl font-bold text-white">{current.guestName}</h2>
            <div className="inline-flex items-center gap-4 bg-white/20 border border-white/30 rounded-3xl px-10 py-5 mt-4">
              <span className="text-5xl">🍽️</span>
              <span className="text-5xl font-bold text-white">
                Mesa {current.tableNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ending fade */}
      {state === "ending" && current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-violet-900 via-purple-900 to-indigo-900 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="text-8xl">✨</div>
            <h2 className="text-6xl font-bold text-white">{current.guestName}</h2>
            <div className="inline-flex items-center gap-4 bg-white/20 border border-white/30 rounded-3xl px-10 py-5">
              <span className="text-4xl">🍽️</span>
              <span className="text-4xl font-bold text-white">
                Dirigite a la Mesa {current.tableNumber}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
