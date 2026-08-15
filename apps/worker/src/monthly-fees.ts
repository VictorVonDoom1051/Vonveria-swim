import { Prisma, type PrismaClient } from "@vonveria-swim/database";
import { resolveMonthlyChargePeriod } from "@vonveria-swim/swimming-core";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

/**
 * Genera el cargo del mes para cada inscripcion MONTHLY activa que aun no lo tenga.
 * Idempotente: la restriccion unica [enrollmentId, periodYear, periodMonth] en
 * `charges` evita duplicados aunque el job corra dos veces o en paralelo.
 */
export async function runMonthlyFeeGeneration(prisma: PrismaClient, referenceDate: Date): Promise<number> {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "ACTIVE", billingModality: "MONTHLY", monthlyRateAmount: { not: null }, monthlyDueDay: { not: null } },
  });

  let createdCount = 0;

  for (const enrollment of enrollments) {
    if (enrollment.monthlyRateAmount === null || enrollment.monthlyDueDay === null) {
      continue;
    }
    const period = resolveMonthlyChargePeriod(referenceDate, enrollment.monthlyDueDay);

    try {
      await prisma.charge.create({
        data: {
          organizationId: enrollment.organizationId,
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          type: "MONTHLY_FEE",
          description: `Mensualidad ${period.periodMonth}/${period.periodYear}`,
          amount: enrollment.monthlyRateAmount,
          dueDate: period.dueDate,
          periodYear: period.periodYear,
          periodMonth: period.periodMonth,
        },
      });
      createdCount += 1;
    } catch (error: unknown) {
      const isDuplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION;
      if (!isDuplicate) {
        throw error;
      }
    }
  }

  return createdCount;
}
