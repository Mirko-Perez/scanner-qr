import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    const existing = await prisma.user.findUnique({
      where: { username: "admin" },
    });

    if (existing) {
      return NextResponse.json(
        { message: "El usuario admin ya existe" },
        { status: 200 }
      );
    }

    const passwordHash = await hashPassword("admin123");

    const user = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash,
        role: "SUPERADMIN",
      },
    });

    return NextResponse.json({
      message: "Usuario admin creado exitosamente",
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Error seeding admin:", error);
    return NextResponse.json(
      { error: "Error creando usuario admin" },
      { status: 500 }
    );
  }
}
