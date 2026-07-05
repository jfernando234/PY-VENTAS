import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearProducto, listarProductos, SalesError } from "@/lib/sales";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const productos = await listarProductos(query);

  return NextResponse.json({ productos });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const producto = await crearProducto(body);

    return NextResponse.json({ producto }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }
}
