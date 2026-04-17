import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (role && !["SUPERADMIN", "INVITADO"].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser SUPERADMIN o INVITADO" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        role: role || "INVITADO",
      },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 }
    );
  }
}
