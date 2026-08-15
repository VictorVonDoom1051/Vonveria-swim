import { PrismaClient } from "@prisma/client";

export {
  PrismaClient,
  // Namespace en runtime (no solo tipos): trae Prisma.Decimal, usado en
  // apps/api para aritmetica de dinero sin float (Seccion 11 de CLAUDE.md).
  Prisma,
  RoleKey,
  UserStatus,
  ProgramType,
  WeekDay,
  EnrollmentStatus,
  BillingModality,
  ChargeType,
  ChargeStatus,
  PaymentMethod,
} from "@prisma/client";
export type * from "@prisma/client";

let prismaSingleton: PrismaClient | undefined;

/**
 * Reusa una sola instancia de PrismaClient por proceso.
 * En NestJS este cliente se envuelve ademas en un provider inyectable.
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient();
  }
  return prismaSingleton;
}
