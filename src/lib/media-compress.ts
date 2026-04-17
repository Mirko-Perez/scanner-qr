import imageCompression from "browser-image-compression";

export type CompressionProgress = {
  stage: "compressing" | "done" | "skipped" | "error";
  progress: number; // 0-100
  originalSize: number;
  compressedSize: number | null;
};

type ProgressCallback = (p: CompressionProgress) => void;

const IMAGE_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.82,
};

const IMAGE_SKIP_THRESHOLD = 500 * 1024; // Skip if already < 500KB
const VIDEO_SKIP_THRESHOLD = 5 * 1024 * 1024; // Skip if already < 5MB

export async function compressImage(
  file: File,
  onProgress?: ProgressCallback
): Promise<File> {
  const originalSize = file.size;

  if (originalSize < IMAGE_SKIP_THRESHOLD) {
    onProgress?.({
      stage: "skipped",
      progress: 100,
      originalSize,
      compressedSize: originalSize,
    });
    return file;
  }

  onProgress?.({
    stage: "compressing",
    progress: 10,
    originalSize,
    compressedSize: null,
  });

  try {
    const compressed = await imageCompression(file, {
      ...IMAGE_OPTIONS,
      onProgress: (p: number) => {
        onProgress?.({
          stage: "compressing",
          progress: Math.min(Math.round(p), 95),
          originalSize,
          compressedSize: null,
        });
      },
    });

    // Keep original if compression didn't help
    const result = compressed.size < originalSize ? compressed : file;
    const finalFile = new File([result], file.name, { type: result.type });

    onProgress?.({
      stage: "done",
      progress: 100,
      originalSize,
      compressedSize: finalFile.size,
    });

    return finalFile;
  } catch {
    onProgress?.({
      stage: "error",
      progress: 100,
      originalSize,
      compressedSize: originalSize,
    });
    return file;
  }
}

export async function compressVideo(
  file: File,
  onProgress?: ProgressCallback
): Promise<File> {
  const originalSize = file.size;

  if (originalSize < VIDEO_SKIP_THRESHOLD) {
    onProgress?.({
      stage: "skipped",
      progress: 100,
      originalSize,
      compressedSize: originalSize,
    });
    return file;
  }

  onProgress?.({
    stage: "compressing",
    progress: 5,
    originalSize,
    compressedSize: null,
  });

  try {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();

    onProgress?.({
      stage: "compressing",
      progress: 15,
      originalSize,
      compressedSize: null,
    });

    ffmpeg.on("progress", ({ progress }) => {
      // FFmpeg progress goes 0→1
      const pct = Math.min(Math.round(15 + progress * 80), 95);
      onProgress?.({
        stage: "compressing",
        progress: pct,
        originalSize,
        compressedSize: null,
      });
    });

    await ffmpeg.load();

    onProgress?.({
      stage: "compressing",
      progress: 20,
      originalSize,
      compressedSize: null,
    });

    const inputName = "input" + getExtension(file.name);
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // H.264, CRF 28 (good quality/size), scale to max 720p, fast preset
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const uint8 = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
    // Copy into a plain ArrayBuffer to satisfy strict Blob typing
    const ab = new ArrayBuffer(uint8.byteLength);
    new Uint8Array(ab).set(uint8);
    const compressedBlob = new Blob([ab], { type: "video/mp4" });

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    ffmpeg.terminate();

    // Keep original if compression didn't help
    if (compressedBlob.size >= originalSize) {
      onProgress?.({
        stage: "done",
        progress: 100,
        originalSize,
        compressedSize: originalSize,
      });
      return file;
    }

    const finalFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, ".mp4"), {
      type: "video/mp4",
    });

    onProgress?.({
      stage: "done",
      progress: 100,
      originalSize,
      compressedSize: finalFile.size,
    });

    return finalFile;
  } catch (err) {
    console.warn("Video compression failed, uploading original:", err);
    onProgress?.({
      stage: "error",
      progress: 100,
      originalSize,
      compressedSize: originalSize,
    });
    return file;
  }
}

export async function compressMedia(
  file: File,
  onProgress?: ProgressCallback
): Promise<File> {
  if (file.type.startsWith("image/")) {
    return compressImage(file, onProgress);
  }
  if (file.type.startsWith("video/")) {
    return compressVideo(file, onProgress);
  }
  // Unknown type — return as-is
  onProgress?.({
    stage: "skipped",
    progress: 100,
    originalSize: file.size,
    compressedSize: file.size,
  });
  return file;
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.substring(dot) : "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
