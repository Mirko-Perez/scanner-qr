"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PageState = "form" | "uploading" | "success";

function SubirContent() {
  const params = useSearchParams();
  const mesa = params.get("mesa");

  const [state, setState] = useState<PageState>("form");
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setAuthorName("");
    setMessage("");
    setFile(null);
    setPreview(null);
    setState("form");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      toast.error("El archivo supera los 50 MB permitidos");
      e.target.value = "";
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const removeFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !authorName.trim() || !mesa) return;

    setState("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorName", authorName.trim());
      formData.append("tableNumber", mesa);
      if (message.trim()) formData.append("message", message.trim());

      const res = await fetch("/api/memories", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al subir el recuerdo");
      }

      setState("success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
      setState("form");
    }
  };

  // No mesa param — show error
  if (!mesa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-black px-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400/80 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">
          Falta el número de mesa
        </h1>
        <p className="text-slate-400 text-sm">
          Escaneá el código QR de tu mesa para subir un recuerdo.
        </p>
      </div>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-black px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-sm w-full">
          <CheckCircle2 className="w-16 h-16 text-emerald-400/80 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            ¡Recuerdo guardado!
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            Gracias por compartir este momento 💙
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold transition-colors"
          >
            Subir otro recuerdo
          </button>
        </div>
      </div>
    );
  }

  // Form / uploading state
  const isUploading = state === "uploading";
  const isVideo = file?.type.startsWith("video/");

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8 text-center"
      style={{
        background:
          "radial-gradient(ellipse at top, #0c1929 0%, #060d16 40%, #000000 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-sm w-full">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Lua Fest XV"
          width={100}
          height={100}
          className="mx-auto w-20 h-20 drop-shadow-[0_0_30px_rgba(59,130,246,0.25)]"
          style={{
            maskImage:
              "radial-gradient(circle, white 40%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(circle, white 40%, transparent 75%)",
          }}
          priority
        />

        {/* Mesa badge */}
        <div className="mt-3 mb-5 inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 rounded-full px-4 py-1.5">
          <span className="text-blue-200/80 text-xs font-medium uppercase tracking-wider">
            Mesa {mesa}
          </span>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-2xl text-left space-y-4"
        >
          <h2 className="text-lg font-semibold text-white text-center">
            Subí tu recuerdo
          </h2>

          {/* Author name */}
          <div>
            <label
              htmlFor="authorName"
              className="block text-sm text-slate-300 mb-1.5"
            >
              Tu nombre <span className="text-red-400">*</span>
            </label>
            <input
              id="authorName"
              type="text"
              required
              disabled={isUploading}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej: María García"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 transition"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm text-slate-300 mb-1.5"
            >
              Tu mensaje{" "}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <textarea
              id="message"
              disabled={isUploading}
              value={message}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, 200))
              }
              placeholder="Dejá un mensaje para el recuerdo..."
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 transition resize-none"
            />
            <p className="text-right text-xs text-slate-500 mt-1">
              {message.length}/200
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">
              Foto o video <span className="text-red-400">*</span>
            </label>

            {!file ? (
              <label
                htmlFor="fileInput"
                className="flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed border-white/15 hover:border-blue-400/40 bg-white/[0.02] cursor-pointer transition"
              >
                <Camera className="w-8 h-8 text-slate-500" />
                <span className="text-sm text-slate-400">
                  Tocá para elegir archivo
                </span>
                <span className="text-xs text-slate-600">
                  Máx. 50 MB · Foto o video
                </span>
              </label>
            ) : (
              <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/30">
                {/* Remove button */}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 rounded-full p-1.5 transition"
                    aria-label="Quitar archivo"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}

                {/* Preview */}
                {isVideo ? (
                  <video
                    src={preview!}
                    controls
                    className="w-full max-h-52 object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview!}
                    alt="Preview"
                    className="w-full max-h-52 object-contain"
                  />
                )}

                <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[60%]">{file.name}</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/*,video/*"
              disabled={isUploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading || !file || !authorName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold transition-colors"
          >
            {isUploading ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Subiendo…
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Subir recuerdo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SubirRecuerdoPage() {
  return (
    <Suspense>
      <SubirContent />
    </Suspense>
  );
}
