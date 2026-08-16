import { Prisma, type PrismaClient } from "@vonveria-swim/database";
import { ANNUAL_PERIOD_MONTH, resolveAnnualPeriod } from "@vonveria-swim/swimming-core";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

/**
 * Renueva la anualidad de cada inscripcion activa al cumplirse el aniversario
 * de su fecha de inicio. Hermano de `runMonthlyFeeGeneration` y con la misma
 * garantia: la restriccion unica [enrollmentId, periodYear, periodMonth] en
 * `charges` evita duplicados aunque el job corra dos veces o en paralelo.
 *
 * El periodo del primer año ya lo genero la inscripcion, asi que este job
 * choca contra esa restriccion y no crea nada hasta el siguiente aniversario.
 */
export async function runAnnualFeeGeneration(
  prisma: PrismaClient,
  referenceDate: Date,
): Promise<number> {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "ACTIVE", annualFeeAmount: { not: null } },
  });

  let createdCount = 0;

  for (const enrollment of enrollments) {
    if (enrollment.annualFeeAmount === null) {
      continue;
    }

    const period = resolveAnnualPeriod(enrollment.startDate, referenceDate);

    // Antes de la fecha de inicio no hay nada que cobrar: sin esto, una
    // inscripcion futura generaria el cargo del año anterior.
    if (period.dueDate.getTime() < enrollment.startDate.getTime()) {
      continue;
    }

    // Por alumno y por año, no por inscripcion: un alumno en dos grupos la
    // paga una sola vez. La restriccion unica de `charges` es por inscripcion,
    // asi que sola no alcanza; sigue cubriendo la carrera entre dos corridas.
    const yaCobrada = await prisma.charge.findFirst({
      where: {
        studentId: enrollment.studentId,
        type: "ANNUAL_FEE",
        periodYear: period.periodYear,
      },
      select: { id: true },
    });
    if (yaCobrada) {
      continue;
    }

    try {
      await prisma.charge.create({
        data: {
          organizationId: enrollment.organizationId,
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          type: "ANNUAL_FEE",
          description: `Anualidad ${period.periodYear}`,
          amount: enrollment.annualFeeAmount,
          dueDate: period.dueDate,
          periodYear: period.periodYear,
          periodMonth: ANNUAL_PERIOD_MONTH,
        },
      });
      createdCount += 1;
    } catch (error: unknown) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION;
      if (!isDuplicate) {
        throw error;
      }
    }
  }

  return createdCount;
}
