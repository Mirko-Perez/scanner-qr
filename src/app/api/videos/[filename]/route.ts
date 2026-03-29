import { NextRequest, NextResponse } from "next/server";
import { stat, open } from "fs/promises";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4":  "video/mp4",
  ".mov":  "video/quicktime",
  ".webm": "video/webm",
  ".avi":  "video/x-msvideo",
  ".mkv":  "video/x-matroska",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", "videos", filename);
  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "video/mp4";

  let fileSize: number;
  try {
    const stats = await stat(filePath);
    fileSize = stats.size;
  } catch {
    return new NextResponse("Video not found", { status: 404 });
  }

  const range = req.headers.get("range");

  if (range) {
    // Parse Range header: "bytes=start-end"
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) return new NextResponse("Invalid Range", { status: 416 });

    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end   = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fd = await open(filePath, "r");
    const buffer = Buffer.allocUnsafe(chunkSize);
    await fd.read(buffer, 0, chunkSize, start);
    await fd.close();

    return new NextResponse(buffer, {
      status: 206,
      headers: {
        "Content-Type":   contentType,
        "Content-Range":  `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(chunkSize),
        "Accept-Ranges":  "bytes",
      },
    });
  }

  // Full file
  const fd = await open(filePath, "r");
  const buffer = Buffer.allocUnsafe(fileSize);
  await fd.read(buffer, 0, fileSize, 0);
  await fd.close();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":   contentType,
      "Content-Length": String(fileSize),
      "Accept-Ranges":  "bytes",
    },
  });
}
