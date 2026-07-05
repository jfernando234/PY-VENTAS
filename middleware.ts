import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: authSecret });
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/dashboard", "/ventas", "/productos", "/clientes", "/usuarios"];
  const isDashboard = protectedPaths.some((protectedPath) => pathname.startsWith(protectedPath));
  const isLogin = pathname === "/login";

  if (isDashboard) {
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    if (token.activo === false) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "inactive");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (isLogin && token && token.activo !== false) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/ventas/:path*", "/productos/:path*", "/clientes/:path*", "/usuarios/:path*", "/login"],
};
