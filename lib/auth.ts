import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
        });

        if (!usuario) {
          return null;
        }

        const passwordValid = await bcryptjs.compare(
          credentials.password,
          usuario.password
        );

        if (!passwordValid) {
          return null;
        }

        if (!usuario.activo) {
          throw new Error("inactive");
        }

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).id = user.id;
        token.nombre = user.nombre;
        token.rol = user.rol;
        token.activo = user.activo;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as number,
        nombre: token.nombre as string,
        email: token.email as string,
        rol: token.rol,
        activo: token.activo as boolean,
      };
      return session;
    },
  },
};
