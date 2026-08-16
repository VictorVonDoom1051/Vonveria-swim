"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/");
      router.refresh();
    } catch {
      setError("Correo o contrasena incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-deep">VonverIA Swim</h1>
        <p className="mb-6 text-sm text-text-secondary">Inicia sesion para continuar</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Correo
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Contrasena
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-turquoise"
            />
          </label>
          {error ? <p className="text-sm text-status-error">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/auth/forgot-password" className="text-sm text-brand-turquoise hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </Card>
    </main>
  );
}
