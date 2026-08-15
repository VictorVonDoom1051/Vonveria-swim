"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch, ApiRequestError } from "../../../../lib/api-client";
import { WEEKDAY_LABELS } from "../types";

interface ProgramOption {
  id: string;
  name: string;
  levels: Array<{ id: string; name: string }>;
}
interface LaneOption {
  id: string;
  name: string;
}
interface PoolOption {
  id: string;
  name: string;
  lanes: LaneOption[];
}
interface BranchOption {
  id: string;
  name: string;
  pools: PoolOption[];
}
interface InstructorOption {
  id: string;
  fullName: string;
}
interface RuleRow {
  weekDay: string;
  startTime: string;
  durationMinutes: number;
}

const WEEKDAYS = Object.keys(WEEKDAY_LABELS);

export function NewGroupForm({
  programs,
  branches,
  instructors,
}: {
  programs: ProgramOption[];
  branches: BranchOption[];
  instructors: InstructorOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [poolId, setPoolId] = useState("");
  const [laneId, setLaneId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [rules, setRules] = useState<RuleRow[]>([
    { weekDay: "MONDAY", startTime: "16:00", durationMinutes: 45 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedProgram = programs.find((program) => program.id === programId);
  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const selectedPool = selectedBranch?.pools.find((pool) => pool.id === poolId);

  function updateRule(index: number, patch: Partial<RuleRow>): void {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }
  function addRule(): void {
    setRules((prev) => [...prev, { weekDay: "MONDAY", startTime: "16:00", durationMinutes: 45 }]);
  }
  function removeRule(index: number): void {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const group = await apiFetch<{ id: string }>("/scheduling/groups", {
        method: "POST",
        body: JSON.stringify({
          name,
          programId,
          levelId,
          branchId,
          poolId,
          ...(laneId ? { laneId } : {}),
          ...(instructorId ? { instructorId } : {}),
          capacity,
          scheduleRules: rules,
        }),
      });
      router.push(`/clases/${group.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.body.errorCode === "SCHEDULING_CONFLICT") {
        setError("El instructor o el carril ya tienen otra clase en ese horario.");
      } else {
        setError("No se pudo crear el grupo. Revisa los datos.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-text-primary">Nuevo grupo</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-primary">
          Nombre del grupo
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Programa
            <select
              required
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                setLevelId("");
              }}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="">Selecciona</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Nivel
            <select
              required
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              disabled={!selectedProgram}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="">Selecciona</option>
              {selectedProgram?.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Sucursal
            <select
              required
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setPoolId("");
                setLaneId("");
              }}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="">Selecciona</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Alberca
            <select
              required
              value={poolId}
              onChange={(event) => {
                setPoolId(event.target.value);
                setLaneId("");
              }}
              disabled={!selectedBranch}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="">Selecciona</option>
              {selectedBranch?.pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Carril (opcional)
            <select
              value={laneId}
              onChange={(event) => setLaneId(event.target.value)}
              disabled={!selectedPool}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {selectedPool?.lanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Instructor (opcional)
            <select
              value={instructorId}
              onChange={(event) => setInstructorId(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-primary">
            Capacidad
            <input
              type="number"
              min={1}
              max={200}
              required
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              className="rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Horario</p>
          <div className="flex flex-col gap-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={rule.weekDay}
                  onChange={(event) => updateRule(index, { weekDay: event.target.value })}
                  className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>
                      {WEEKDAY_LABELS[day]}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={rule.startTime}
                  onChange={(event) => updateRule(index, { startTime: event.target.value })}
                  className="rounded-md border border-border-subtle px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={rule.durationMinutes}
                  onChange={(event) =>
                    updateRule(index, { durationMinutes: Number(event.target.value) })
                  }
                  className="w-20 rounded-md border border-border-subtle px-2 py-1.5 text-sm"
                />
                <span className="text-xs text-text-secondary">min</span>
                {rules.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-xs text-status-error"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" onClick={addRule}>
            + Agregar horario
          </Button>
        </div>

        {error ? <p className="text-sm text-status-error">{error}</p> : null}

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear grupo"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
