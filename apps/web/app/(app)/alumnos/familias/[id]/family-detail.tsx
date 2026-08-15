"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../../lib/api-client";
import type { FamilyDetail } from "../../types";

export function FamilyDetailView({ initial }: { initial: FamilyDetail }) {
  const [family, setFamily] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showGuardianForm, setShowGuardianForm] = useState(false);

  async function refresh(): Promise<void> {
    const data = await apiFetch<FamilyDetail>(`/families/${family.id}`);
    setFamily(data);
  }

  async function handleAddGuardian(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");
    setError(null);
    try {
      await apiFetch(`/families/${family.id}/guardians`, {
        method: "POST",
        body: JSON.stringify({
          fullName,
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
        }),
      });
      form.reset();
      setShowGuardianForm(false);
      await refresh();
    } catch {
      setError("No se pudo agregar el tutor.");
    }
  }

  async function handleAddStudent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") ?? "");
    const birthDate = String(formData.get("birthDate") ?? "");
    const medicalAlerts = String(formData.get("medicalAlerts") ?? "");
    setError(null);
    try {
      await apiFetch(`/families/${family.id}/students`, {
        method: "POST",
        body: JSON.stringify({
          fullName,
          ...(birthDate ? { birthDate } : {}),
          ...(medicalAlerts ? { medicalAlerts } : {}),
        }),
      });
      form.reset();
      setShowStudentForm(false);
      await refresh();
    } catch {
      setError("No se pudo registrar el alumno.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-2xl">
        <h1 className="mb-3 text-lg font-semibold text-text-primary">Tutores</h1>
        <ul className="mb-3 flex flex-col gap-1 text-sm text-text-primary">
          {family.guardians.map((guardian) => (
            <li key={guardian.id}>
              {guardian.fullName}
              {guardian.phone ? ` · ${guardian.phone}` : ""}
              {guardian.email ? ` · ${guardian.email}` : ""}
            </li>
          ))}
        </ul>
        {showGuardianForm ? (
          <form
            onSubmit={handleAddGuardian}
            className="flex flex-col gap-2 border-t border-border-subtle pt-3"
          >
            <input
              name="fullName"
              required
              placeholder="Nombre del tutor"
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="Telefono (opcional)"
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Correo (opcional)"
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="ghost" onClick={() => setShowGuardianForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" onClick={() => setShowGuardianForm(true)}>
            + Agregar tutor
          </Button>
        )}
      </Card>

      <Card className="max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Alumnos</h2>
        <div className="mb-3 flex flex-col gap-2">
          {family.students.map((student) => (
            <Link key={student.id} href={`/alumnos/estudiantes/${student.id}`}>
              <div className="rounded-md border border-border-subtle p-3 text-sm hover:border-brand-turquoise">
                <p className="font-medium text-text-primary">{student.fullName}</p>
                {student.medicalAlerts ? (
                  <p className="text-xs text-status-attention">Alerta: {student.medicalAlerts}</p>
                ) : null}
              </div>
            </Link>
          ))}
          {family.students.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin alumnos todavia.</p>
          ) : null}
        </div>
        {showStudentForm ? (
          <form
            onSubmit={handleAddStudent}
            className="flex flex-col gap-2 border-t border-border-subtle pt-3"
          >
            <input
              name="fullName"
              required
              placeholder="Nombre del alumno"
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-text-secondary">
              Fecha de nacimiento (opcional)
              <input
                name="birthDate"
                type="date"
                className="rounded-md border border-border-subtle px-3 py-2 text-sm"
              />
            </label>
            <textarea
              name="medicalAlerts"
              placeholder="Alertas medicas (opcional)"
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="ghost" onClick={() => setShowStudentForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" onClick={() => setShowStudentForm(true)}>
            + Agregar alumno
          </Button>
        )}
      </Card>

      {error ? <p className="text-sm text-status-error">{error}</p> : null}
    </div>
  );
}
