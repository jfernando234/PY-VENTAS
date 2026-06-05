import type { Rol } from "@/app/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      nombre: string;
      email: string;
      rol: Rol;
      activo: boolean;
    };
  }

  interface User {
    id: number;
    nombre: string;
    email: string;
    rol: Rol;
    activo: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    nombre: string;
    rol: Rol;
    activo: boolean;
  }
}
