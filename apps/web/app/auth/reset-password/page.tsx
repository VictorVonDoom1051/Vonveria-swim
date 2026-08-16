"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../lib/api-client";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <Card className="w-full max-w-sm">
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold text-status-error">Enlace inválido</h1>
            <p className="text-sm text-text-secondary">
              El enlace no contiene un token válido. Solicita uno nuevo.
            </p>
            <Link href="/auth/forgot-password">
              <Button className="w-full">Solicitar nuevo enlace</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password-confirm", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      router.push("/login");
    } catch {
      setError("El enlace es inválido o ha expirado. Solicita uno nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-deep">Restablecer contraseña</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Ingresa tu nueva contraseña
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Nueva contraseña
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Confirmar contraseña
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
            />
          </label>
          {error ? <p className="text-sm text-status-error">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
          <Link href="/login" className="text-center text-sm text-brand-turquoise hover:underline">
            Volver al login
          </Link>
        </form>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
          <Card className="w-full max-w-sm">
            <p className="text-sm text-text-secondary">Cargando...</p>
          </Card>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
