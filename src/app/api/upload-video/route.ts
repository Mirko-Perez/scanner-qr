import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("video") as File;
  const tableId = parseInt(formData.get("tableId") as string);

  if (!file || !tableId) {
    return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const ext = file.name.split(".").pop();
  const filename = `mesa-${table.number}.${ext}`;
  const videosDir = path.join(process.cwd(), "public", "videos");

  await mkdir(videosDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(videosDir, filename), buffer);

  const videoPath = `/videos/${filename}`;
  const updated = await prisma.table.update({
    where: { id: tableId },
    data: { videoPath },
  });

  return NextResponse.json(updated);
}
