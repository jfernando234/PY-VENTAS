import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearUsuario, listarUsuarios, UsuariosError } from "@/lib/usuarios";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.activo || session.user.rol !== "ADMINISTRADOR") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usuarios = await listarUsuarios();

  return NextResponse.json({ usuarios });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const usuario = await crearUsuario(body);

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    if (error instanceof UsuariosError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
  }
}
