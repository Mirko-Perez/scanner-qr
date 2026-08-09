import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    // Only bootstraps the very first user. This route is public (no admin
    // session exists yet on a fresh install), so once any user is in the DB
    // it must refuse forever — otherwise deleting the "admin" account would
    // let anyone recreate a SUPERADMIN with this hardcoded password.
    const userCount = await prisma.user.count();

    if (userCount > 0) {
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
