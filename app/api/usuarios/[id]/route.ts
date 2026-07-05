import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { actualizarUsuario, UsuariosError } from "@/lib/usuarios";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.activo || session.user.rol !== "ADMINISTRADOR") {
    return null;
  }

  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const usuario = await actualizarUsuario(params.id, body, session.user.id);

    return NextResponse.json({ usuario });
  } catch (error) {
    if (error instanceof UsuariosError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo actualizar el usuario." }, { status: 500 });
  }
}
