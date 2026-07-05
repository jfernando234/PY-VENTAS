import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearCliente, listarClientes, SalesError } from "@/lib/sales";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const clientes = await listarClientes(query);

  return NextResponse.json({ clientes });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cliente = await crearCliente(body);

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo crear el cliente." }, { status: 500 });
  }
}
