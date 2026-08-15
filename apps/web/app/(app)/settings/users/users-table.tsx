"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";
import type { CreatedUserResult, UserListItem, UserRoleKey } from "./types";

const ROLE_LABELS: Record<UserRoleKey, string> = {
  DIRECCION: "Direccion",
  RECEPCION: "Recepcion",
  INSTRUCTOR: "Instructor",
};

interface RevealedPassword {
  email: string;
  password: string;
}

export function UsersTable({ initial }: { initial: UserListItem[] }) {
  const [users, setUsers] = useState(initial);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleKey, setRoleKey] = useState<UserRoleKey>("RECEPCION");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<RevealedPassword | null>(null);

  async function refreshUsers() {
    const refreshed = await apiFetch<UserListItem[]>("/users");
    setUsers(refreshed);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await apiFetch<CreatedUserResult>("/users", {
        method: "POST",
        body: JSON.stringify({ email, fullName, roleKey }),
      });
      setRevealedPassword({ email: created.email, password: created.temporaryPassword });
      setEmail("");
      setFullName("");
      await refreshUsers();
    } catch {
      setError("No se pudo crear el usuario. Revisa el correo (puede que ya exista).");
    } finally {
      setCreating(false);
    }
  }

  async function handleResetPassword(userId: string, userEmail: string) {
    setError(null);
    try {
      const result = await apiFetch<{ temporaryPassword: string }>(
        `/users/${userId}/reset-password`,
        {
          method: "POST",
        },
      );
      setRevealedPassword({ email: userEmail, password: result.temporaryPassword });
    } catch {
      setError("No se pudo resetear la contrasena.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-xl">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-text-primary">Nuevo usuario</h1>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Correo
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Nombre completo
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Rol
            <select
              value={roleKey}
              onChange={(event) => setRoleKey(event.target.value as UserRoleKey)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="RECEPCION">Recepcion</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="DIRECCION">Direccion</option>
            </select>
          </label>
          {error ? <p className="text-sm text-status-error">{error}</p> : null}
          <div>
            <Button type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </Card>

      {revealedPassword ? (
        <Card className="max-w-xl">
          <p className="text-sm text-text-primary">
            Contrasena temporal para <strong>{revealedPassword.email}</strong>:
          </p>
          <p className="mt-1 font-mono text-lg text-brand-deep">{revealedPassword.password}</p>
          <p className="mt-1 text-xs text-text-secondary">
            Comparte este dato de forma segura. No se volvera a mostrar.
          </p>
        </Card>
      ) : null}

      <Card className="max-w-3xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th className="py-2 pr-4 font-medium">Nombre</th>
              <th className="py-2 pr-4 font-medium">Correo</th>
              <th className="py-2 pr-4 font-medium">Rol</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-4">{user.fullName}</td>
                <td className="py-2 pr-4">{user.email}</td>
                <td className="py-2 pr-4">
                  {user.roles.map((userRole) => ROLE_LABELS[userRole.role.key]).join(", ")}
                </td>
                <td className="py-2 pr-4">
                  <StatusBadge tone={user.status === "ACTIVE" ? "success" : "attention"}>
                    {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
                  </StatusBadge>
                </td>
                <td className="py-2 pr-4">
                  <Button variant="ghost" onClick={() => handleResetPassword(user.id, user.email)}>
                    Resetear contrasena
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
