"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
      setEmail("");
    } catch {
      setError("Error al procesar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
        <Card className="w-full max-w-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="mb-1 text-xl font-semibold text-brand-deep">Revisa tu correo</h1>
              <p className="text-sm text-text-secondary">
                Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              El enlace expira en 24 horas.
            </p>
            <Link href="/login">
              <Button className="w-full">Volver al login</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-deep">Recuperar contraseña</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Ingresa tu correo para recibir un enlace de recuperación
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Correo
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
            />
          </label>
          {error ? <p className="text-sm text-status-error">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>
          <Link href="/login" className="text-center text-sm text-brand-turquoise hover:underline">
            Volver al login
          </Link>
        </form>
      </Card>
    </main>
  );
}
