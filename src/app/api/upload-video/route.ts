import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

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
  const filename = `videos/mesa-${table.number}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  const updated = await prisma.table.update({
    where: { id: tableId },
    data: { videoPath: blob.url },
  });

  return NextResponse.json(updated);
}
