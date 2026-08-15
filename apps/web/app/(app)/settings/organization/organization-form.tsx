"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";
import type { OrganizationData } from "./types";

export function OrganizationForm({ initial }: { initial: OrganizationData }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [currency, setCurrency] = useState(initial.currency);
  const [primaryColor, setPrimaryColor] = useState(initial.branding?.primaryColor ?? "#0B3C5D");
  const [accentColor, setAccentColor] = useState(initial.branding?.accentColor ?? "#1FB6A6");
  const [logoUrl, setLogoUrl] = useState(initial.branding?.logoUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await apiFetch("/organization", {
        method: "PATCH",
        body: JSON.stringify({ name, timezone, currency }),
      });
      await apiFetch("/organization/branding", {
        method: "PATCH",
        body: JSON.stringify({
          primaryColor,
          accentColor,
          ...(logoUrl ? { logoUrl } : {}),
        }),
      });
      setSuccess(true);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa los datos e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Organizacion</h1>

        <label className="flex flex-col gap-1 text-sm text-text-primary">
          Nombre de la escuela
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Zona horaria
            <input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Moneda
            <input
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              maxLength={3}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Color principal
            <input
              type="color"
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              className="h-10 rounded-md border border-border-subtle"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Color de acento
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="h-10 rounded-md border border-border-subtle"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-text-primary">
          Logo (URL, opcional)
          <input
            type="url"
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
        </label>

        {error ? <p className="text-sm text-status-error">{error}</p> : null}
        {success ? <p className="text-sm text-status-success">Cambios guardados.</p> : null}

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
