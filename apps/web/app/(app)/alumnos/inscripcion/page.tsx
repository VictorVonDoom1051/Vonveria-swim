import { CAPABILITIES } from "@vonveria-swim/permissions";
import { requireCapability, serverFetch } from "../../../../lib/session";
import { EnrollmentWizard } from "./enrollment-wizard";
import type { ProgramItem } from "../../settings/programs/types";
import type { StudentDetail } from "../types";

interface EnrollmentDefaults {
  currency: string;
  defaultAnnualFee: string | null;
  defaultEnrollmentFee: string | null;
}

export default async function InscripcionPage({
  searchParams,
}: {
  searchParams: { alumno?: string };
}) {
  await requireCapability(CAPABILITIES.STUDENTS_MANAGE);

  const studentId = searchParams.alumno;

  // El estado de la inscripcion se resuelve aqui y no en el cliente: con un
  // alumno preseleccionado el asistente salta directo al paso de grupo, y sin
  // este dato la pantalla de confirmacion prometeria un cargo que el backend
  // no va a crear.
  const [programs, defaults, student, feeStatus] = await Promise.all([
    serverFetch<ProgramItem[]>("/programs"),
    serverFetch<EnrollmentDefaults>("/enrollments/defaults"),
    studentId ? serverFetch<StudentDetail>(`/students/${studentId}`) : null,
    studentId
      ? serverFetch<{ hasPaidEnrollmentFee: boolean }>(
          `/enrollments/enrollment-fee-status?studentId=${studentId}`,
        )
      : null,
  ]);

  return (
    <EnrollmentWizard
      programs={programs ?? []}
      defaultAnnualFee={defaults?.defaultAnnualFee ?? ""}
      defaultEnrollmentFee={defaults?.defaultEnrollmentFee ?? ""}
      currency={defaults?.currency ?? "MXN"}
      preselectedStudent={
        student
          ? {
              id: student.id,
              fullName: student.fullName,
              hasPaidEnrollmentFee: feeStatus?.hasPaidEnrollmentFee ?? false,
            }
          : null
      }
    />
  );
}
