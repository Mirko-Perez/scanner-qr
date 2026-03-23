import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tables = await prisma.table.findMany({
    include: { guests: true },
    orderBy: { number: "asc" },
  });
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const { number, name } = await req.json();

  if (!number) {
    return NextResponse.json({ error: "El numero de mesa es requerido" }, { status: 400 });
  }

  const existing = await prisma.table.findUnique({ where: { number } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una mesa con ese numero" }, { status: 409 });
  }

  const table = await prisma.table.create({ data: { number, name } });
  return NextResponse.json(table, { status: 201 });
}
