"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";

export function NewFamilyForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const family = await apiFetch<{ id: string }>("/families", {
        method: "POST",
        body: JSON.stringify({
          guardian: {
            fullName,
            ...(phone ? { phone } : {}),
            ...(email ? { email } : {}),
          },
        }),
      });
      router.push(`/alumnos/familias/${family.id}`);
    } catch {
      setError("No se pudo crear la familia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-text-primary">Nueva familia</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          Nombre del tutor
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          Telefono (opcional)
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          Correo (opcional)
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
        </label>
        {error ? <p className="text-sm text-status-error">{error}</p> : null}
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear familia"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
