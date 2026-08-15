"use client";

import { useState, type FormEvent } from "react";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";
import { PROGRAM_TYPE_LABELS, type ProgramItem, type ProgramTypeValue } from "./types";

export function ProgramsManager({ initial }: { initial: ProgramItem[] }) {
  const [programs, setPrograms] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    const data = await apiFetch<ProgramItem[]>("/programs");
    setPrograms(data);
  }

  async function handleCreateProgram(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const type = String(formData.get("type") ?? "GROUP") as ProgramTypeValue;
    setError(null);
    try {
      await apiFetch("/programs", { method: "POST", body: JSON.stringify({ name, type }) });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo crear el programa.");
    }
  }

  async function handleCreateLevel(
    programId: string,
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    setError(null);
    try {
      await apiFetch(`/programs/${programId}/levels`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo crear el nivel.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-md">
        <h1 className="mb-3 text-lg font-semibold text-text-primary">Nuevo programa</h1>
        <form onSubmit={handleCreateProgram} className="flex flex-col gap-3">
          <input
            name="name"
            required
            placeholder="Nombre del programa"
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
          <select
            name="type"
            defaultValue="GROUP"
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          >
            {Object.entries(PROGRAM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Card>

      {error ? <p className="text-sm text-status-error">{error}</p> : null}

      <div className="flex flex-col gap-4">
        {programs.map((program) => (
          <Card key={program.id} className="max-w-2xl">
            <h2 className="mb-1 font-semibold text-text-primary">{program.name}</h2>
            <p className="mb-2 text-xs text-text-secondary">{PROGRAM_TYPE_LABELS[program.type]}</p>
            <p className="mb-2 text-sm text-text-secondary">
              Niveles: {program.levels.map((level) => level.name).join(", ") || "ninguno"}
            </p>
            <form
              onSubmit={(event) => void handleCreateLevel(program.id, event)}
              className="flex gap-2"
            >
              <input
                name="name"
                required
                placeholder="Nuevo nivel"
                className="flex-1 rounded-md border border-border-subtle px-3 py-1.5 text-sm"
              />
              <Button type="submit" variant="ghost">
                Agregar
              </Button>
            </form>
          </Card>
        ))}
        {programs.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin programas todavia.</p>
        ) : null}
      </div>
    </div>
  );
}
