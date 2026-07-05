import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerVenta } from "@/lib/sales";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const ventaId = Number(id);

  if (!Number.isInteger(ventaId) || ventaId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const venta = await obtenerVenta(ventaId);

  if (!venta) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json({ venta });
}
