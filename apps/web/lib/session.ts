import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Capability } from "@vonveria-swim/permissions";
import { API_URL, SESSION_COOKIE_NAME } from "./constants";

export type RoleKey = "DIRECCION" | "RECEPCION" | "INSTRUCTOR";

export interface SessionUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  roleKeys: RoleKey[];
  capabilities: string[];
}

/** Server-only: lee la cookie de sesion entrante y la reenvia a apps/api. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { user: SessionUser };
  return data.user;
}

/** Instructor puro (sin Direccion/Recepcion adicional) aterriza en /hoy en vez de /inicio. */
export function homeRouteFor(user: SessionUser): string {
  const isInstructorOnly = user.roleKeys.length === 1 && user.roleKeys[0] === "INSTRUCTOR";
  return isInstructorOnly ? "/hoy" : "/inicio";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Chequeo de UX en el server component (oculta la pantalla antes de
 * renderizarla). No reemplaza la autorizacion real: el backend vuelve a
 * exigir la misma capacidad en cada endpoint (Seccion 15: "ocultar un
 * boton no es seguridad").
 */
export async function requireCapability(capability: Capability): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.capabilities.includes(capability)) {
    redirect(homeRouteFor(user));
  }
  return user;
}

/** GET autenticado desde un server component, reenviando la cookie de sesion entrante. */
export async function serverFetch<T>(path: string): Promise<T | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}
