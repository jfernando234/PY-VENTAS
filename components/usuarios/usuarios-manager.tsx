"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { RolUsuario, UsuarioGestion } from "@/lib/usuarios";
import {
  InternalBadge,
  InternalEmptyState,
  InternalMetricCard,
  InternalPageHeader,
  InternalSection,
  cn,
  internalDangerButtonClassName,
  internalInputClassName,
  internalPrimaryButtonClassName,
  internalSecondaryButtonClassName,
  internalSurfaceClassName,
  internalTertiaryButtonClassName,
} from "@/components/internal/internal-ui";

const DEFAULT_ROL: RolUsuario = "VENDEDOR";

type UsuarioFormState = {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: RolUsuario;
  activo: boolean;
};

type UsuarioEditState = {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
} | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function roleLabel(rol: RolUsuario) {
  return rol === "ADMINISTRADOR" ? "Administrador" : rol === "VENDEDOR" ? "Vendedor" : "Cajero";
}

function sortUsers(users: UsuarioGestion[]) {
  return [...users].sort((a, b) => {
    if (a.activo !== b.activo) {
      return Number(b.activo) - Number(a.activo);
    }

    return a.nombre.localeCompare(b.nombre);
  });
}

export default function UsuariosManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UsuarioGestion[];
  currentUserId: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [createError, setCreateError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<UsuarioEditState>(null);
  const [createForm, setCreateForm] = useState<UsuarioFormState>({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: DEFAULT_ROL,
    activo: true,
  });

  const metrics = useMemo(() => {
    const active = users.filter((user) => user.activo).length;
    const admins = users.filter((user) => user.rol === "ADMINISTRADOR").length;

    return { total: users.length, active, admins };
  }, [users]);

  function updateUserInState(updatedUser: UsuarioGestion) {
    setUsers((current) => sortUsers(current.map((user) => (user.id === updatedUser.id ? updatedUser : user))));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setTableError(null);

    if (!createForm.nombre.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError("Completá nombre, email y contraseña.");
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setCreateError("Las contraseñas no coinciden.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el usuario.");
      }

      setUsers((current) => sortUsers([payload.usuario, ...current]));
      setCreateForm({
        nombre: "",
        email: "",
        password: "",
        confirmPassword: "",
        rol: DEFAULT_ROL,
        activo: true,
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No se pudo crear el usuario.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError(null);
    setTableError(null);

    if (!editingUser) {
      return;
    }

    setSavingUserId(editingUser.id);

    try {
      const response = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editingUser.nombre,
          email: editingUser.email,
          rol: editingUser.rol,
          activo: editingUser.activo,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar el usuario.");
      }

      updateUserInState(payload.usuario);
      setEditingUser(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "No se pudo actualizar el usuario.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function toggleActive(user: UsuarioGestion) {
    setTableError(null);

    if (user.id === currentUserId && user.activo) {
      setTableError("No podés desactivar tu propia cuenta.");
      return;
    }

    setSavingUserId(user.id);

    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !user.activo }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo cambiar el estado del usuario.");
      }

      updateUserInState(payload.usuario);
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "No se pudo cambiar el estado del usuario.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Alta, edición y control de acceso para cuentas internas del sistema. La creación usa contraseña inicial; la edición no cambia credenciales."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.35fr)]">
        <section className={cn(internalSurfaceClassName, "overflow-hidden")}>
          <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Nuevo acceso</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">Crear usuario</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Definí el rol inicial y una contraseña temporal segura. El usuario podrá ingresar apenas se cree.
            </p>
          </div>

          <div className="grid gap-3 border-b border-slate-800 px-5 py-4 sm:grid-cols-3 sm:px-6">
            <InternalMetricCard label="Usuarios" value={String(metrics.total)} detail="Cuentas cargadas" />
            <InternalMetricCard label="Activos" value={String(metrics.active)} detail="Con acceso habilitado" />
            <InternalMetricCard label="Admins" value={String(metrics.admins)} detail="Con acceso total" />
          </div>

          <form onSubmit={handleCreate} className="space-y-4 px-5 py-5 sm:px-6">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-200">Nombre</span>
              <input
                value={createForm.nombre}
                onChange={(event) => setCreateForm((current) => ({ ...current, nombre: event.target.value }))}
                className={internalInputClassName}
                placeholder="Nombre y apellido"
                autoComplete="name"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-200">Email</span>
              <input
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                className={internalInputClassName}
                placeholder="usuario@empresa.com"
                type="email"
                autoComplete="email"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-200">Rol</span>
                <select
                  value={createForm.rol}
                  onChange={(event) => setCreateForm((current) => ({ ...current, rol: event.target.value as RolUsuario }))}
                  className={internalInputClassName}
                >
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="CAJERO">Cajero</option>
                </select>
              </label>

              <label className="flex items-end gap-3 rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={createForm.activo}
                  onChange={(event) => setCreateForm((current) => ({ ...current, activo: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-400"
                />
                <span>
                  <span className="block font-medium">Cuenta activa</span>
                  <span className="block text-xs text-slate-400">Desmarcala si querés dejarla creada pero bloqueada.</span>
                </span>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-200">Contraseña temporal</span>
                <input
                  value={createForm.password}
                  onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                  className={internalInputClassName}
                  type="password"
                  autoComplete="new-password"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-200">Confirmar contraseña</span>
                <input
                  value={createForm.confirmPassword}
                  onChange={(event) => setCreateForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className={internalInputClassName}
                  type="password"
                  autoComplete="new-password"
                />
              </label>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              La contraseña inicial debe tener al menos 8 caracteres. No hay flujo de reseteo todavía.
            </p>

            {createError && <p className="text-sm text-rose-200">{createError}</p>}

            <button type="submit" disabled={isCreating} className={`${internalPrimaryButtonClassName} w-full`}>
              {isCreating ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        </section>

        <InternalSection
          eyebrow="Acceso interno"
          title="Cuentas del sistema"
          description="Editá nombre, email y rol. Activá o desactivá accesos desde la misma grilla."
          action={<InternalBadge tone="accent">{users.length} cuentas</InternalBadge>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Usuario</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Rol</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Estado</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Alta</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 align-top sm:px-6">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-50">{user.nombre}</span>
                          {user.id === currentUserId && <InternalBadge tone="accent">Tu cuenta</InternalBadge>}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top sm:px-6">
                      <InternalBadge tone={user.rol === "ADMINISTRADOR" ? "accent" : "neutral"}>{roleLabel(user.rol)}</InternalBadge>
                    </td>
                    <td className="px-5 py-4 align-top sm:px-6">
                      <InternalBadge tone={user.activo ? "success" : "warning"}>{user.activo ? "Activo" : "Inactivo"}</InternalBadge>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4 align-top sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditError(null);
                            setEditingUser({
                              id: user.id,
                              nombre: user.nombre,
                              email: user.email,
                              rol: user.rol,
                              activo: user.activo,
                            });
                          }}
                          className={internalSecondaryButtonClassName}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={savingUserId === user.id || (user.id === currentUserId && user.activo)}
                          onClick={() => toggleActive(user)}
                          title={user.id === currentUserId && user.activo ? "No podés desactivar tu propia cuenta." : undefined}
                          className={user.activo ? internalDangerButtonClassName : internalTertiaryButtonClassName}
                        >
                          {user.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!users.length && (
                  <tr>
                    <td className="px-5 py-6 sm:px-6" colSpan={5}>
                      <InternalEmptyState
                        title="No hay usuarios cargados."
                        description="Creá la primera cuenta interna desde el panel de alta."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {tableError && <p className="px-5 pb-5 pt-2 text-sm text-rose-200 sm:px-6">{tableError}</p>}
        </InternalSection>
      </div>

      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setEditingUser(null);
              setEditError(null);
            }
          }}
        >
          <div className={`${internalSurfaceClassName} w-full max-w-2xl overflow-hidden`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Editar usuario</p>
                <h3 id="edit-user-title" className="mt-2 text-lg font-semibold tracking-tight text-slate-50">
                  {editingUser.nombre}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">Modificá identidad, rol y estado sin tocar la contraseña.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setEditError(null);
                }}
                className={internalSecondaryButtonClassName}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 px-5 py-5 sm:px-6">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-200">Nombre</span>
                <input
                  value={editingUser.nombre}
                  onChange={(event) => setEditingUser((current) => (current ? { ...current, nombre: event.target.value } : current))}
                  className={internalInputClassName}
                  autoFocus
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-200">Email</span>
                <input
                  value={editingUser.email}
                  onChange={(event) => setEditingUser((current) => (current ? { ...current, email: event.target.value } : current))}
                  className={internalInputClassName}
                  type="email"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-200">Rol</span>
                  <select
                    value={editingUser.rol}
                    onChange={(event) => setEditingUser((current) => (current ? { ...current, rol: event.target.value as RolUsuario } : current))}
                    className={internalInputClassName}
                  >
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="CAJERO">Cajero</option>
                  </select>
                </label>

                <label className="flex items-end gap-3 rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingUser.activo}
                    onChange={(event) => setEditingUser((current) => (current ? { ...current, activo: event.target.checked } : current))}
                    disabled={editingUser.id === currentUserId && editingUser.activo}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span>
                    <span className="block font-medium">Cuenta activa</span>
                    <span className="block text-xs text-slate-400">
                      {editingUser.id === currentUserId && editingUser.activo
                        ? "No podés desactivar tu propia sesión desde esta pantalla."
                        : "Controla si el usuario puede iniciar sesión."}
                    </span>
                  </span>
                </label>
              </div>

              {editError && <p className="text-sm text-rose-200">{editError}</p>}

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={savingUserId === editingUser.id} className={internalPrimaryButtonClassName}>
                  {savingUserId === editingUser.id ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditError(null);
                  }}
                  className={internalSecondaryButtonClassName}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
