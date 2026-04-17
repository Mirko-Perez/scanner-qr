import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  try {
    const { role } = await request.json();

    if (!["SUPERADMIN", "INVITADO"].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Error actualizando usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  // Prevent self-deletion
  if (userId === currentUser.userId) {
    return NextResponse.json(
      { error: "No podés eliminar tu propio usuario" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error eliminando usuario" },
      { status: 500 }
    );
  }
}
