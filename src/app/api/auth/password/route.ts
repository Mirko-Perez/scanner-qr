import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword, hashPassword, createToken, getAuthCookieOptions } from "@/lib/auth";

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Contraseña actual y nueva son requeridas" },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { passwordHash: newHash },
    });

    // Refresh token
    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieOptions = getAuthCookieOptions();
    const response = NextResponse.json({ ok: true, message: "Contraseña actualizada" });
    response.cookies.set(cookieOptions.name, token, cookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Error actualizando contraseña" },
      { status: 500 }
    );
  }
}
