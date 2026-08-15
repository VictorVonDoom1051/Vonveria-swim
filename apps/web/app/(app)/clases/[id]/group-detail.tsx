"use client";

import { useState } from "react";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";
import { WEEKDAY_LABELS, type GroupDetail } from "../types";

export function GroupDetailView({ initial }: { initial: GroupDetail }) {
  const [group, setGroup] = useState(initial);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish(): Promise<void> {
    setPublishing(true);
    setError(null);
    try {
      const updated = await apiFetch<GroupDetail>(`/scheduling/groups/${group.id}/publish`, {
        method: "POST",
      });
      setGroup(updated);
    } catch {
      setError("No se pudo publicar el grupo.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-text-primary">{group.name}</h1>
          <StatusBadge tone={group.isPublished ? "success" : "attention"}>
            {group.isPublished ? "Publicado" : "Borrador"}
          </StatusBadge>
        </div>
        <p className="text-sm text-text-secondary">
          {group.program.name} · {group.level.name}
        </p>
        <p className="text-sm text-text-secondary">
          {group.branch.name} · {group.pool.name}
          {group.lane ? ` · Carril ${group.lane.name}` : ""}
        </p>
        <p className="text-sm text-text-secondary">
          Instructor: {group.instructor?.fullName ?? "Sin asignar"}
        </p>
        <p className="text-sm text-text-secondary">
          Cupo: {group.enrollments.length}/{group.capacity}
        </p>

        <div className="my-3 flex flex-col gap-1 text-sm text-text-primary">
          {group.scheduleRules.map((rule) => (
            <span key={rule.id}>
              {WEEKDAY_LABELS[rule.weekDay]} {rule.startTime} ({rule.durationMinutes} min)
            </span>
          ))}
        </div>

        {error ? <p className="mb-2 text-sm text-status-error">{error}</p> : null}

        {!group.isPublished ? (
          <Button onClick={() => void handlePublish()} disabled={publishing}>
            {publishing ? "Publicando..." : "Publicar (genera sesiones)"}
          </Button>
        ) : (
          <p className="text-sm text-text-secondary">
            {group.sessions.length > 0
              ? `Proxima sesion: ${new Date(group.sessions[0]!.startsAt).toLocaleString("es-MX")}`
              : "Sin sesiones generadas."}
          </p>
        )}
      </Card>

      <Card className="max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Alumnos inscritos</h2>
        <ul className="flex flex-col gap-1 text-sm text-text-primary">
          {group.enrollments.map((enrollment) => (
            <li key={enrollment.id}>{enrollment.student.fullName}</li>
          ))}
          {group.enrollments.length === 0 ? (
            <li className="text-text-secondary">Sin alumnos inscritos todavia.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
