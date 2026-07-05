import bcryptjs from "bcryptjs";
import { Prisma } from "@/app/generated/prisma/client";
import { Rol } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const USER_ROLES = [Rol.ADMINISTRADOR, Rol.VENDEDOR, Rol.CAJERO] as const;

export type RolUsuario = (typeof USER_ROLES)[number];

export interface UsuarioGestion {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt: string;
}

export class UsuariosError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UsuariosError";
    this.status = status;
  }
}

export class ValidationError extends UsuariosError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends UsuariosError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends UsuariosError {
  constructor(message: string) {
    super(message, 409);
  }
}

function normalizeText(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} is required.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new ValidationError(`${field} is required.`);
  }

  return normalized;
}

function normalizeEmail(value: unknown) {
  const email = normalizeText(value, "email");

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ValidationError("email is invalid.");
  }

  return email;
}

function normalizePassword(value: unknown) {
  const password = normalizeText(value, "password");

  if (password.length < 8) {
    throw new ValidationError("password must be at least 8 characters long.");
  }

  return password;
}

function normalizeBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new ValidationError(`${field} is invalid.`);
  }

  return value;
}

function normalizeRol(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return Rol.VENDEDOR;
  }

  if (USER_ROLES.includes(value as RolUsuario)) {
    return value as RolUsuario;
  }

  throw new ValidationError("rol is invalid.");
}

function normalizeId(value: unknown) {
  const id = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("id is invalid.");
  }

  return id;
}

function mapUsuario(usuario: {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt: Date;
}): UsuarioGestion {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt.toISOString(),
  };
}

export async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
  });

  return usuarios.map(mapUsuario);
}

export async function crearUsuario(data: {
  nombre: unknown;
  email: unknown;
  password: unknown;
  rol?: unknown;
  activo?: unknown;
}) {
  const nombre = normalizeText(data.nombre, "nombre");
  const email = normalizeEmail(data.email);
  const password = normalizePassword(data.password);
  const rol = normalizeRol(data.rol);
  const activo = data.activo === undefined ? true : normalizeBoolean(data.activo, "activo");
  const passwordHash = await bcryptjs.hash(password, 10);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordHash,
        rol,
        activo,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return mapUsuario(usuario);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("El email ya está registrado.");
    }

    throw error;
  }
}

export async function actualizarUsuario(
  id: unknown,
  data: {
    nombre?: unknown;
    email?: unknown;
    rol?: unknown;
    activo?: unknown;
  },
  currentUserId?: number
) {
  const usuarioId = normalizeId(id);
  const updateData: {
    nombre?: string;
    email?: string;
    rol?: RolUsuario;
    activo?: boolean;
  } = {};

  if (data.nombre !== undefined) {
    updateData.nombre = normalizeText(data.nombre, "nombre");
  }

  if (data.email !== undefined) {
    updateData.email = normalizeEmail(data.email);
  }

  if (data.rol !== undefined) {
    updateData.rol = normalizeRol(data.rol);
  }

  if (data.activo !== undefined) {
    const activo = normalizeBoolean(data.activo, "activo");

    if (currentUserId === usuarioId && !activo) {
      throw new ValidationError("No podés desactivar tu propia cuenta.");
    }

    updateData.activo = activo;
  }

  if (!Object.keys(updateData).length) {
    throw new ValidationError("No hay cambios para guardar.");
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return mapUsuario(usuario);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictError("El email ya está registrado.");
      }

      if (error.code === "P2025") {
        throw new NotFoundError("El usuario no existe.");
      }
    }

    throw error;
  }
}
