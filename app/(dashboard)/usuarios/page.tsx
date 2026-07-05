import { listarUsuarios } from "@/lib/usuarios";
import { InternalPageShell } from "@/components/internal/internal-ui";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UsuariosManager from "@/components/usuarios/usuarios-manager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.activo) {
    redirect("/login");
  }

  if (session.user.rol !== "ADMINISTRADOR") {
    redirect("/dashboard");
  }

  const usuarios = await listarUsuarios();

  return (
    <InternalPageShell>
      <UsuariosManager initialUsers={usuarios} currentUserId={session.user.id} />
    </InternalPageShell>
  );
}
