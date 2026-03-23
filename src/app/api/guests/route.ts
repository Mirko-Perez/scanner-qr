import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");

  const guests = await prisma.guest.findMany({
    where: tableId ? { tableId: parseInt(tableId) } : undefined,
    include: { table: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(guests);
}

export async function POST(req: NextRequest) {
  const { name, lastName, tableId } = await req.json();

  if (!name || !lastName || !tableId) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const guest = await prisma.guest.create({
    data: { name, lastName, tableId },
    include: { table: true },
  });
  return NextResponse.json(guest, { status: 201 });
}
