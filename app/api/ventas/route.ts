import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearVenta, SalesError } from "@/lib/sales";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const venta = await crearVenta(body, session.user.id);

    return NextResponse.json({ venta }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo registrar la venta." }, { status: 500 });
  }
}
