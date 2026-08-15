"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, Card, StatusBadge } from "@vonveria-swim/ui";
import { apiFetch, ApiRequestError } from "../../../../../lib/api-client";
import { BillingSection, type BillingData, type BillingSectionHandle } from "./billing-section";
import type { StudentDetail } from "../../types";

interface ProgramOption {
  id: string;
  name: string;
  levels: Array<{ id: string; name: string }>;
}

interface CompatibleGroup {
  id: string;
  name: string;
  availableSpots: number;
  branch: { name: string };
  pool: { name: string };
  lane: { name: string } | null;
  instructor: { fullName: string } | null;
  scheduleRules: Array<{ weekDay: string; startTime: string; durationMinutes: number }>;
}

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mie",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sab",
  SUNDAY: "Dom",
};

export function StudentDetailView({
  initial,
  programs,
  billing,
}: {
  initial: StudentDetail;
  programs: ProgramOption[];
  billing: BillingData | null;
}) {
  const [student, setStudent] = useState(initial);
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [compatibleGroups, setCompatibleGroups] = useState<CompatibleGroup[]>([]);
  const [searchedGroups, setSearchedGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [billingModality, setBillingModality] = useState("NONE");
  const [monthlyRateAmount, setMonthlyRateAmount] = useState("");
  const [monthlyDueDay, setMonthlyDueDay] = useState("1");
  const [enrollmentFeeAmount, setEnrollmentFeeAmount] = useState("");
  const billingSectionRef = useRef<BillingSectionHandle>(null);

  const selectedProgram = programs.find((program) => program.id === programId);

  async function handleFindGroups(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSearchedGroups(true);
    const data = await apiFetch<CompatibleGroup[]>(
      `/enrollments/compatible-groups?programId=${programId}&levelId=${levelId}`,
    );
    setCompatibleGroups(data);
  }

  async function handleEnroll(groupId: string): Promise<void> {
    setEnrolling(groupId);
    setError(null);
    try {
      await apiFetch("/enrollments", {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          groupId,
          startDate: new Date().toISOString().slice(0, 10),
          ...(billing ? { billingModality } : {}),
          ...(billing && enrollmentFeeAmount ? { enrollmentFeeAmount } : {}),
          ...(billing && billingModality === "MONTHLY" && monthlyRateAmount
            ? { monthlyRateAmount, monthlyDueDay: Number(monthlyDueDay) }
            : {}),
        }),
      });
      const refreshed = await apiFetch<StudentDetail>(`/students/${student.id}`);
      setStudent(refreshed);
      setCompatibleGroups([]);
      setSearchedGroups(false);
      await billingSectionRef.current?.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError && err.body.errorCode === "GROUP_FULL") {
        setError("El grupo ya no tiene cupo disponible.");
      } else if (err instanceof ApiRequestError && err.body.errorCode === "ALREADY_ENROLLED") {
        setError("El alumno ya esta inscrito en ese grupo.");
      } else {
        setError("No se pudo inscribir al alumno.");
      }
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-2xl">
        <h1 className="text-lg font-semibold text-text-primary">{student.fullName}</h1>
        <p className="text-sm text-text-secondary">
          Familia: {student.family.guardians.map((guardian) => guardian.fullName).join(", ")}
        </p>
        {student.medicalAlerts ? (
          <p className="mt-1 text-sm text-status-attention">
            Alerta medica: {student.medicalAlerts}
          </p>
        ) : null}
      </Card>

      <Card className="max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Inscripciones</h2>
        <div className="mb-4 flex flex-col gap-2">
          {student.enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between rounded-md border border-border-subtle p-3 text-sm"
            >
              <div>
                <p className="font-medium text-text-primary">{enrollment.group.name}</p>
                <p className="text-text-secondary">
                  {enrollment.group.program.name} · {enrollment.group.level.name}
                </p>
              </div>
              <StatusBadge tone={enrollment.status === "ACTIVE" ? "success" : "attention"}>
                {enrollment.status}
              </StatusBadge>
            </div>
          ))}
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin inscripciones todavia.</p>
          ) : null}
        </div>

        <h3 className="mb-2 text-sm font-semibold text-text-primary">Inscribir en un grupo</h3>
        <form onSubmit={handleFindGroups} className="mb-3 flex flex-col gap-2 sm:flex-row">
          <select
            required
            value={programId}
            onChange={(event) => {
              setProgramId(event.target.value);
              setLevelId("");
            }}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          >
            <option value="">Programa</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
          <select
            required
            value={levelId}
            onChange={(event) => setLevelId(event.target.value)}
            disabled={!selectedProgram}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm"
          >
            <option value="">Nivel</option>
            {selectedProgram?.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
          <Button type="submit">Buscar grupos</Button>
        </form>

        {billing ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <label className="text-text-secondary">Modalidad de cobro</label>
            <select
              value={billingModality}
              onChange={(event) => setBillingModality(event.target.value)}
              className="rounded-md border border-border-subtle px-2 py-1 text-sm"
            >
              <option value="NONE">Sin cobro recurrente</option>
              <option value="MONTHLY">Mensualidad</option>
              <option value="PACKAGE">Paquete</option>
              <option value="SINGLE_CLASS">Clase individual</option>
            </select>
            <input
              value={enrollmentFeeAmount}
              onChange={(event) => setEnrollmentFeeAmount(event.target.value)}
              placeholder="Cuota de inscripcion (opcional)"
              className="w-48 rounded-md border border-border-subtle px-2 py-1 text-sm"
            />
            {billingModality === "MONTHLY" ? (
              <>
                <input
                  value={monthlyRateAmount}
                  onChange={(event) => setMonthlyRateAmount(event.target.value)}
                  placeholder="Monto mensual"
                  className="w-32 rounded-md border border-border-subtle px-2 py-1 text-sm"
                />
                <input
                  value={monthlyDueDay}
                  onChange={(event) => setMonthlyDueDay(event.target.value)}
                  type="number"
                  min="1"
                  max="28"
                  className="w-20 rounded-md border border-border-subtle px-2 py-1 text-sm"
                  title="Dia de vencimiento"
                />
              </>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mb-2 text-sm text-status-error">{error}</p> : null}

        {searchedGroups && compatibleGroups.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No hay grupos publicados con cupo para ese programa y nivel.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {compatibleGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-md border border-border-subtle p-3 text-sm"
            >
              <div>
                <p className="font-medium text-text-primary">{group.name}</p>
                <p className="text-text-secondary">
                  {group.branch.name} · {group.pool.name}
                  {group.lane ? ` · Carril ${group.lane.name}` : ""}
                  {group.instructor ? ` · ${group.instructor.fullName}` : ""}
                </p>
                <p className="text-text-secondary">
                  {group.scheduleRules
                    .map((rule) => `${WEEKDAY_LABELS[rule.weekDay]} ${rule.startTime}`)
                    .join(", ")}
                </p>
                <p className="text-status-success">{group.availableSpots} cupos disponibles</p>
              </div>
              <Button onClick={() => void handleEnroll(group.id)} disabled={enrolling === group.id}>
                {enrolling === group.id ? "Inscribiendo..." : "Inscribir"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {billing ? (
        <BillingSection ref={billingSectionRef} studentId={student.id} initial={billing} />
      ) : null}
    </div>
  );
}
