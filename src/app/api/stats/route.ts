import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalGuests, arrivedGuests, tables] = await Promise.all([
    prisma.guest.count(),
    prisma.guest.count({ where: { hasArrived: true } }),
    prisma.table.findMany({
      include: { guests: true },
      orderBy: { number: "asc" },
    }),
  ]);

  return NextResponse.json({ totalGuests, arrivedGuests, tables });
}
