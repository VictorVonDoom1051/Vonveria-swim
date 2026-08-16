"use client";

import { useState } from "react";
import { Button, Card, Modal } from "@vonveria-swim/ui";
import { apiFetch } from "../../../lib/api-client";
import type { AssessableStudent, AssessmentItem, LevelOption } from "./types";

export function AssessmentsView({
  initialAssessments,
  students,
  levels,
}: {
  initialAssessments: AssessmentItem[];
  students: AssessableStudent[];
  levels: LevelOption[];
}) {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState("");
  const [observation, setObservation] = useState("");
  const [suggestedLevelId, setSuggestedLevelId] = useState("");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/assessments", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          observation,
          ...(suggestedLevelId ? { suggestedLevelId } : {}),
        }),
      });
      setAssessments(await apiFetch<AssessmentItem[]>("/assessments"));
      setOpen(false);
      setStudentId("");
      setObservation("");
      setSuggestedLevelId("");
    } catch {
      setError("No se pudo guardar la evaluacion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Evaluaciones</h1>
          <p className="text-sm text-text-secondary">
            Observaciones de examen y el nivel que se sugiere. Cambiar al alumno de grupo se hace
            desde su ficha.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={students.length === 0}>
          Registrar evaluacion
        </Button>
      </div>

      {error ? (
        <Card className="border-status-error">
          <p className="text-sm text-status-error">{error}</p>
        </Card>
      ) : null}

      {students.length === 0 ? (
        <Card className="max-w-xl">
          <p className="text-sm text-text-secondary">
            No hay alumnos que puedas evaluar. Un instructor solo evalua a los alumnos inscritos en
            sus propios grupos.
          </p>
        </Card>
      ) : null}

      {assessments.length === 0 ? (
        <Card className="max-w-xl">
          <p className="text-sm text-text-secondary">Todavia no hay evaluaciones registradas.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {assessments.map((assessment) => (
            <Card key={assessment.id}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-text-primary">{assessment.student.fullName}</span>
                <span className="text-xs text-text-secondary">
                  {new Date(assessment.assessedAt).toLocaleDateString("es-MX")} ·{" "}
                  {assessment.evaluator.fullName}
                </span>
              </div>
              {assessment.suggestedLevel ? (
                <p className="mb-1 text-sm text-brand-deep">
                  Nivel sugerido: {assessment.suggestedLevel.name}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {assessment.observation}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar evaluacion"
        footer={
          <div className="flex gap-2">
            <Button
              onClick={() => void save()}
              disabled={saving || !studentId || observation.trim().length < 3}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Alumno
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2"
            >
              <option value="">Selecciona un alumno</option>
              {students.map((student) => {
                const group = student.enrollments[0]?.group;
                return (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                    {group ? ` — ${group.name} (${group.level.name})` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Observacion
            <textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={4}
              className="rounded-md border border-border-subtle px-3 py-2"
              placeholder="Flota sin apoyo y respira de lado. Listo para avanzar."
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Nivel sugerido (opcional)
            <select
              value={suggestedLevelId}
              onChange={(event) => setSuggestedLevelId(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2"
            >
              <option value="">Sin sugerencia</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
}
