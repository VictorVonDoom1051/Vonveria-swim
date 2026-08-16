"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch, ApiRequestError } from "../../../../lib/api-client";
import { buildChargeSummary } from "./charge-summary";
import type { FamilySearchResult } from "../types";

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

interface PreselectedStudent {
  id: string;
  fullName: string;
  hasPaidEnrollmentFee: boolean;
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

const STEPS = ["Familia", "Alumno", "Grupo", "Cobro", "Confirmar"] as const;

function scheduleLabel(group: CompatibleGroup): string {
  return group.scheduleRules
    .map((rule) => `${WEEKDAY_LABELS[rule.weekDay] ?? rule.weekDay} ${rule.startTime}`)
    .join(", ");
}

export function EnrollmentWizard({
  programs,
  defaultAnnualFee,
  defaultEnrollmentFee,
  currency,
  preselectedStudent,
}: {
  programs: ProgramOption[];
  defaultAnnualFee: string;
  defaultEnrollmentFee: string;
  currency: string;
  preselectedStudent: PreselectedStudent | null;
}) {
  const router = useRouter();

  // Con un alumno preseleccionado los dos primeros pasos ya estan resueltos.
  const [step, setStep] = useState(preselectedStudent ? 2 : 0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Paso 1: familia
  const [familyQuery, setFamilyQuery] = useState("");
  const [familyResults, setFamilyResults] = useState<FamilySearchResult[]>([]);
  const [searchedFamilies, setSearchedFamilies] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilySearchResult | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  // Paso 2: alumno
  const [existingStudentId, setExistingStudentId] = useState(preselectedStudent?.id ?? "");
  const [studentName, setStudentName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [medicalAlerts, setMedicalAlerts] = useState("");
  const [hasPaidEnrollmentFee, setHasPaidEnrollmentFee] = useState(
    preselectedStudent?.hasPaidEnrollmentFee ?? false,
  );

  // Paso 3: grupo
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [groups, setGroups] = useState<CompatibleGroup[]>([]);
  const [searchedGroups, setSearchedGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CompatibleGroup | null>(null);

  // Paso 4: cobro
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [annualFeeAmount, setAnnualFeeAmount] = useState(defaultAnnualFee);
  const [enrollmentFeeAmount, setEnrollmentFeeAmount] = useState(defaultEnrollmentFee);
  const [billingModality, setBillingModality] = useState("MONTHLY");
  const [monthlyRateAmount, setMonthlyRateAmount] = useState("");
  const [monthlyDueDay, setMonthlyDueDay] = useState("5");

  const selectedProgram = programs.find((program) => program.id === programId);
  const chargesEnrollmentFee = !existingStudentId || !hasPaidEnrollmentFee;

  const summary = buildChargeSummary({
    annualFeeAmount,
    enrollmentFeeAmount,
    chargesEnrollmentFee,
    billingModality,
    monthlyRateAmount,
  });

  const studentLabel =
    preselectedStudent?.fullName ??
    selectedFamily?.students.find((student) => student.id === existingStudentId)?.fullName ??
    studentName;

  const money = (amount: number): string =>
    amount.toLocaleString("es-MX", { style: "currency", currency });

  async function handleSearchFamilies(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSearchedFamilies(true);
    const data = await apiFetch<FamilySearchResult[]>(
      `/families/search?q=${encodeURIComponent(familyQuery)}`,
    );
    setFamilyResults(data);
  }

  /** Al elegir un alumno existente hay que saber si la inscripcion ya se cobro. */
  async function selectExistingStudent(studentId: string): Promise<void> {
    setExistingStudentId(studentId);
    setStudentName("");
    try {
      const status = await apiFetch<{ hasPaidEnrollmentFee: boolean }>(
        `/enrollments/enrollment-fee-status?studentId=${studentId}`,
      );
      setHasPaidEnrollmentFee(status.hasPaidEnrollmentFee);
    } catch {
      setHasPaidEnrollmentFee(false);
    }
  }

  async function handleSearchGroups(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSearchedGroups(true);
    const data = await apiFetch<CompatibleGroup[]>(
      `/enrollments/compatible-groups?programId=${programId}&levelId=${levelId}`,
    );
    setGroups(data);
  }

  async function handleSubmit(): Promise<void> {
    if (!selectedGroup) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/enrollments/wizard", {
        method: "POST",
        body: JSON.stringify({
          ...(existingStudentId
            ? { studentId: existingStudentId }
            : {
                ...(selectedFamily
                  ? { familyId: selectedFamily.id }
                  : {
                      newGuardian: {
                        fullName: guardianName,
                        ...(guardianPhone ? { phone: guardianPhone } : {}),
                        ...(guardianEmail ? { email: guardianEmail } : {}),
                      },
                    }),
                newStudent: {
                  fullName: studentName,
                  ...(birthDate ? { birthDate } : {}),
                  ...(medicalAlerts ? { medicalAlerts } : {}),
                },
              }),
          groupId: selectedGroup.id,
          startDate,
          annualFeeAmount,
          ...(chargesEnrollmentFee && enrollmentFeeAmount ? { enrollmentFeeAmount } : {}),
          billingModality,
          ...(billingModality === "MONTHLY" && monthlyRateAmount
            ? { monthlyRateAmount, monthlyDueDay: Number(monthlyDueDay) }
            : {}),
        }),
      });
      router.push("/alumnos");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError && err.body.errorCode === "GROUP_FULL") {
        setError("El grupo se lleno mientras capturabas. Elige otro en el paso de grupo.");
      } else if (err instanceof ApiRequestError && err.body.errorCode === "ALREADY_ENROLLED") {
        setError("El alumno ya esta inscrito en ese grupo.");
      } else {
        setError("No se pudo completar la inscripcion. Revisa los datos e intenta de nuevo.");
      }
      setSubmitting(false);
    }
  }

  const canContinue = ((): boolean => {
    if (step === 0) {
      return selectedFamily !== null || guardianName.trim().length >= 3;
    }
    if (step === 1) {
      return existingStudentId !== "" || studentName.trim().length >= 3;
    }
    if (step === 2) {
      return selectedGroup !== null;
    }
    if (step === 3) {
      return Number(annualFeeAmount) > 0;
    }
    return true;
  })();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Nueva inscripcion</h1>
        <ol className="mt-3 flex flex-wrap gap-2 text-xs">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 ${
                index === step
                  ? "bg-brand-deep text-white"
                  : index < step
                    ? "bg-brand-turquoise/20 text-text-primary"
                    : "border border-border-subtle text-text-secondary"
              }`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      <Card className="max-w-2xl">
        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-text-primary">Familia</h2>

            <form onSubmit={handleSearchFamilies} className="flex gap-2">
              <input
                value={familyQuery}
                onChange={(event) => setFamilyQuery(event.target.value)}
                placeholder="Buscar familia por nombre, telefono o correo"
                className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm"
              />
              <Button type="submit">Buscar</Button>
            </form>

            {familyResults.map((family) => (
              <button
                key={family.id}
                type="button"
                onClick={() => {
                  setSelectedFamily(family);
                  setGuardianName("");
                }}
                className={`rounded-md border p-3 text-left text-sm ${
                  selectedFamily?.id === family.id
                    ? "border-brand-turquoise bg-brand-turquoise/10"
                    : "border-border-subtle"
                }`}
              >
                <p className="font-medium text-text-primary">
                  {family.guardians.map((guardian) => guardian.fullName).join(", ") ||
                    "Familia sin tutor"}
                </p>
                <p className="text-text-secondary">
                  Alumnos:{" "}
                  {family.students.map((student) => student.fullName).join(", ") || "ninguno"}
                </p>
              </button>
            ))}

            {searchedFamilies && familyResults.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Sin resultados. Captura al tutor para crear la familia.
              </p>
            ) : null}

            {selectedFamily ? (
              <button
                type="button"
                onClick={() => setSelectedFamily(null)}
                className="self-start text-sm text-brand-deep underline"
              >
                Capturar una familia nueva
              </button>
            ) : (
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
                <p className="text-sm font-medium text-text-primary">Tutor</p>
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                  placeholder="Nombre completo del tutor"
                  className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={guardianPhone}
                    onChange={(event) => setGuardianPhone(event.target.value)}
                    placeholder="Telefono"
                    className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                  />
                  <input
                    value={guardianEmail}
                    onChange={(event) => setGuardianEmail(event.target.value)}
                    placeholder="Correo"
                    className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-text-primary">Alumno</h2>

            {selectedFamily && selectedFamily.students.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-secondary">Alumnos de esta familia</p>
                {selectedFamily.students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => void selectExistingStudent(student.id)}
                    className={`rounded-md border p-3 text-left text-sm ${
                      existingStudentId === student.id
                        ? "border-brand-turquoise bg-brand-turquoise/10"
                        : "border-border-subtle"
                    }`}
                  >
                    {student.fullName}
                  </button>
                ))}
              </div>
            ) : null}

            {existingStudentId ? (
              <button
                type="button"
                onClick={() => {
                  setExistingStudentId("");
                  setHasPaidEnrollmentFee(false);
                }}
                className="self-start text-sm text-brand-deep underline"
              >
                Capturar un alumno nuevo
              </button>
            ) : (
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
                <input
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Nombre completo del alumno"
                  className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                />
                <label className="flex flex-col gap-1 text-sm text-text-secondary">
                  Fecha de nacimiento
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                  />
                </label>
                <input
                  value={medicalAlerts}
                  onChange={(event) => setMedicalAlerts(event.target.value)}
                  placeholder="Alertas medicas (opcional)"
                  className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-text-primary">Grupo</h2>

            <form onSubmit={handleSearchGroups} className="flex flex-col gap-2 sm:flex-row">
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

            {searchedGroups && groups.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No hay grupos publicados con cupo para ese programa y nivel.
              </p>
            ) : null}

            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`rounded-md border p-3 text-left text-sm ${
                  selectedGroup?.id === group.id
                    ? "border-brand-turquoise bg-brand-turquoise/10"
                    : "border-border-subtle"
                }`}
              >
                <p className="font-medium text-text-primary">{group.name}</p>
                <p className="text-text-secondary">
                  {group.branch.name} · {group.pool.name}
                  {group.lane ? ` · Carril ${group.lane.name}` : ""}
                  {group.instructor ? ` · ${group.instructor.fullName}` : ""}
                </p>
                <p className="text-text-secondary">{scheduleLabel(group)}</p>
                <p className="text-status-success">{group.availableSpots} cupos disponibles</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-text-primary">Cobro</h2>

            <label className="flex flex-col gap-1 text-sm text-text-primary">
              Fecha de inicio
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-md border border-border-subtle px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-text-primary">
              Anualidad (obligatoria)
              <input
                value={annualFeeAmount}
                onChange={(event) => setAnnualFeeAmount(event.target.value)}
                inputMode="decimal"
                placeholder="800.00"
                className="rounded-md border border-border-subtle px-3 py-2 text-sm"
              />
              <span className="text-xs text-text-secondary">
                Se renueva sola cada año, en el aniversario de esta fecha de inicio.
              </span>
            </label>

            {chargesEnrollmentFee ? (
              <label className="flex flex-col gap-1 text-sm text-text-primary">
                Inscripcion
                <input
                  value={enrollmentFeeAmount}
                  onChange={(event) => setEnrollmentFeeAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="300.00"
                  className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                />
              </label>
            ) : (
              <p className="rounded-md bg-brand-turquoise/10 p-3 text-sm text-text-secondary">
                Este alumno ya pago inscripcion antes, asi que no se vuelve a cobrar.
              </p>
            )}

            <label className="flex flex-col gap-1 text-sm text-text-primary">
              Modalidad de cobro
              <select
                value={billingModality}
                onChange={(event) => setBillingModality(event.target.value)}
                className="rounded-md border border-border-subtle px-3 py-2 text-sm"
              >
                <option value="MONTHLY">Mensualidad</option>
                <option value="PACKAGE">Paquete</option>
                <option value="SINGLE_CLASS">Clase individual</option>
                <option value="NONE">Sin cobro recurrente</option>
              </select>
            </label>

            {billingModality === "MONTHLY" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-text-primary">
                  Monto mensual
                  <input
                    value={monthlyRateAmount}
                    onChange={(event) => setMonthlyRateAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="1500.00"
                    className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-text-primary">
                  Dia de pago
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={monthlyDueDay}
                    onChange={(event) => setMonthlyDueDay(event.target.value)}
                    className="rounded-md border border-border-subtle px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-text-primary">Confirmar</h2>

            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Alumno</dt>
                <dd className="font-medium text-text-primary">{studentLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Grupo</dt>
                <dd className="font-medium text-text-primary">{selectedGroup?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Horario</dt>
                <dd className="text-text-primary">
                  {selectedGroup ? scheduleLabel(selectedGroup) : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Inicio</dt>
                <dd className="text-text-primary">{startDate}</dd>
              </div>
            </dl>

            <div className="rounded-md border border-border-subtle p-3">
              <p className="mb-2 text-sm font-semibold text-text-primary">Se va a cobrar</p>
              <ul className="flex flex-col gap-1 text-sm">
                {summary.lines.map((line) => (
                  <li key={line.concept} className="flex justify-between">
                    <span className="text-text-secondary">{line.concept}</span>
                    <span className="text-text-primary">{money(line.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-border-subtle pt-2 text-sm font-semibold">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">{money(summary.total)}</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary">
              Los cargos quedan pendientes de pago. El cobro se registra desde Pagos.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-status-error">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(0, current - 1));
            }}
            disabled={step === 0 || submitting}
          >
            Atras
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={!canContinue}
            >
              Continuar
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Inscribiendo..." : "Inscribir"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
