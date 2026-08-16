import { randomBytes } from "node:crypto";
import { hashPassword } from "@vonveria-swim/auth";
import type { PrismaClient } from "./index";

/**
 * Restauracion de un respaldo.
 *
 * Es una operacion de emergencia que ejecuta el fabricante, no el cliente: por eso
 * vive como script y no como boton (ver docs/deployment/backups.md).
 *
 * Todo ocurre dentro de una sola transaccion. Si algo falla a la mitad no queda
 * una escuela a medio restaurar, que seria peor que no haber restaurado.
 */

export const SUPPORTED_FORMAT_VERSIONS = [2];

export interface ImportOptions {
  /** Borra la organizacion destino antes de insertar. Operacion destructiva. */
  replace?: boolean;
}

export interface ImportSummary {
  organizationId: string;
  organizationName: string;
  replaced: boolean;
  counts: Record<string, number>;
  adminEmail: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Backup = Record<string, any>;

function rows(backup: Backup, key: string): any[] {
  const value = backup[key];
  return Array.isArray(value) ? value : [];
}

/**
 * Borra una organizacion en orden inverso de dependencias. Prisma no ofrece un
 * borrado en cascada completo desde la organizacion porque varias llaves son
 * RESTRICT a proposito, para que nada desaparezca por accidente.
 */
export async function deleteOrganizationData(tx: PrismaClient, organizationId: string) {
  const byOrg = { organizationId };

  await tx.assessment.deleteMany({ where: byOrg });
  await tx.stockMovement.deleteMany({ where: { product: { organizationId } } });
  await tx.saleLine.deleteMany({ where: { sale: { organizationId } } });
  await tx.sale.deleteMany({ where: byOrg });
  await tx.product.deleteMany({ where: byOrg });
  await tx.attendance.deleteMany({ where: { student: { organizationId } } });
  await tx.packageCreditMovement.deleteMany({
    where: { packageCredit: { organizationId } },
  });
  await tx.packageCredit.deleteMany({ where: byOrg });
  await tx.adjustment.deleteMany({ where: { charge: { organizationId } } });
  await tx.refund.deleteMany({ where: { payment: { organizationId } } });
  await tx.paymentAllocation.deleteMany({ where: { payment: { organizationId } } });
  await tx.payment.deleteMany({ where: byOrg });
  await tx.cashClosing.deleteMany({ where: byOrg });
  await tx.charge.deleteMany({ where: byOrg });
  await tx.enrollmentStatusHistory.deleteMany({
    where: { enrollment: { organizationId } },
  });
  await tx.enrollment.deleteMany({ where: byOrg });
  await tx.classSession.deleteMany({ where: { group: { organizationId } } });
  await tx.scheduleRule.deleteMany({ where: { group: { organizationId } } });
  await tx.group.deleteMany({ where: byOrg });
  await tx.emergencyContact.deleteMany({ where: { student: { organizationId } } });
  await tx.student.deleteMany({ where: byOrg });
  await tx.guardian.deleteMany({ where: { family: { organizationId } } });
  await tx.family.deleteMany({ where: byOrg });
  await tx.level.deleteMany({ where: { program: { organizationId } } });
  await tx.program.deleteMany({ where: byOrg });
  await tx.lane.deleteMany({ where: { pool: { branch: { organizationId } } } });
  await tx.pool.deleteMany({ where: { branch: { organizationId } } });
  await tx.branch.deleteMany({ where: byOrg });
  await tx.auditLog.deleteMany({ where: byOrg });
  await tx.session.deleteMany({ where: { user: { organizationId } } });
  await tx.userRole.deleteMany({ where: { user: { organizationId } } });
  await tx.rolePermission.deleteMany({ where: { role: { organizationId } } });
  await tx.user.deleteMany({ where: byOrg });
  await tx.role.deleteMany({ where: byOrg });
  await tx.brandingSettings.deleteMany({ where: byOrg });
  await tx.organization.deleteMany({ where: { id: organizationId } });
}

export async function importBackup(
  prisma: PrismaClient,
  backup: Backup,
  options: ImportOptions = {},
): Promise<ImportSummary> {
  const version = backup?.meta?.formatVersion;
  if (!SUPPORTED_FORMAT_VERSIONS.includes(version)) {
    throw new Error(
      `Version de formato no soportada: ${String(version)}. ` +
        `Este importador entiende: ${SUPPORTED_FORMAT_VERSIONS.join(", ")}.`,
    );
  }

  const organization = backup.organization;
  if (!organization?.id) {
    throw new Error("El archivo no contiene una organizacion valida.");
  }

  const existing = await prisma.organization.findFirst({
    where: { OR: [{ id: organization.id }, { name: organization.name }] },
  });
  if (existing && !options.replace) {
    throw new Error(
      `La escuela "${organization.name}" ya existe en la base destino. ` +
        "Para reemplazarla, vuelve a correr el comando con --replace --yes. " +
        "Eso BORRA la escuela existente antes de restaurar.",
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? null;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && !adminPassword) {
    throw new Error("ADMIN_EMAIL esta definida pero ADMIN_PASSWORD no. Define ambas o ninguna.");
  }

  // Los hashes se calculan fuera de la transaccion: argon2 es lento a proposito
  // y no conviene tener la transaccion abierta mientras tanto.
  const usersInBackup = rows(backup, "users");
  const passwordHashes = new Map<string, string>();
  for (const user of usersInBackup) {
    const isAdmin = adminEmail !== null && user.email === adminEmail;
    // Quien no sea el administrador queda con un hash que no corresponde a
    // ninguna contrasena conocida: no puede entrar hasta que se la restablezcan.
    passwordHashes.set(
      user.id,
      await hashPassword(isAdmin ? adminPassword! : randomBytes(32).toString("hex")),
    );
  }

  const counts: Record<string, number> = {};
  const insert = async (name: string, list: any[], fn: (item: any) => Promise<unknown>) => {
    for (const item of list) {
      await fn(item);
    }
    counts[name] = list.length;
  };

  await prisma.$transaction(
    async (tx) => {
      if (existing) {
        await deleteOrganizationData(tx as unknown as PrismaClient, existing.id);
      }

      await tx.organization.create({
        data: {
          id: organization.id,
          name: organization.name,
          timezone: organization.timezone,
          currency: organization.currency,
          createdAt: new Date(organization.createdAt),
        },
      });
      counts.organization = 1;

      if (backup.branding) {
        await tx.brandingSettings.create({
          data: {
            id: backup.branding.id,
            organizationId: organization.id,
            logoUrl: backup.branding.logoUrl,
            faviconUrl: backup.branding.faviconUrl,
            primaryColor: backup.branding.primaryColor,
            accentColor: backup.branding.accentColor,
          },
        });
        counts.branding = 1;
      }

      // El catalogo de permisos es global: se siembra por key y se traduce cada
      // permissionId del archivo al id que esa key tiene en la base destino.
      const permissionIdByOldId = new Map<string, string>();
      for (const permission of rows(backup, "permissions")) {
        const target = await tx.permission.upsert({
          where: { key: permission.key },
          update: { description: permission.description },
          create: { key: permission.key, description: permission.description },
        });
        permissionIdByOldId.set(permission.id, target.id);
      }
      counts.permissions = rows(backup, "permissions").length;

      await insert("roles", rows(backup, "roles"), async (role) => {
        await tx.role.create({
          data: {
            id: role.id,
            organizationId: organization.id,
            key: role.key,
            name: role.name,
          },
        });
        for (const rolePermission of role.permissions ?? []) {
          const permissionId = permissionIdByOldId.get(rolePermission.permissionId);
          if (!permissionId) {
            throw new Error(
              `El archivo referencia un permiso (${rolePermission.permissionId}) que no viene ` +
                "en su catalogo. El respaldo esta incompleto.",
            );
          }
          await tx.rolePermission.create({ data: { roleId: role.id, permissionId } });
        }
      });

      await insert("users", usersInBackup, (user) =>
        tx.user.create({
          data: {
            id: user.id,
            organizationId: organization.id,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            createdAt: new Date(user.createdAt),
            deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
            passwordHash: passwordHashes.get(user.id)!,
            roles: {
              create: (user.roles ?? []).map((userRole: any) => ({ roleId: userRole.roleId })),
            },
          },
        }),
      );

      await insert("branches", rows(backup, "branches"), (branch) =>
        tx.branch.create({
          data: { id: branch.id, organizationId: organization.id, name: branch.name },
        }),
      );
      await insert("pools", rows(backup, "pools"), (pool) =>
        tx.pool.create({ data: { id: pool.id, branchId: pool.branchId, name: pool.name } }),
      );
      await insert("lanes", rows(backup, "lanes"), (lane) =>
        tx.lane.create({ data: { id: lane.id, poolId: lane.poolId, name: lane.name } }),
      );
      await insert("programs", rows(backup, "programs"), (program) =>
        tx.program.create({
          data: {
            id: program.id,
            organizationId: organization.id,
            name: program.name,
            type: program.type,
          },
        }),
      );
      await insert("levels", rows(backup, "levels"), (level) =>
        tx.level.create({
          data: {
            id: level.id,
            programId: level.programId,
            name: level.name,
            sortOrder: level.sortOrder,
          },
        }),
      );

      await insert("families", rows(backup, "families"), (family) =>
        tx.family.create({ data: { id: family.id, organizationId: organization.id } }),
      );
      await insert("guardians", rows(backup, "guardians"), (guardian) =>
        tx.guardian.create({
          data: {
            id: guardian.id,
            familyId: guardian.familyId,
            fullName: guardian.fullName,
            phone: guardian.phone,
            email: guardian.email,
          },
        }),
      );
      await insert("students", rows(backup, "students"), (student) =>
        tx.student.create({
          data: {
            id: student.id,
            organizationId: organization.id,
            familyId: student.familyId,
            fullName: student.fullName,
            birthDate: student.birthDate ? new Date(student.birthDate) : null,
            medicalAlerts: student.medicalAlerts,
            createdAt: new Date(student.createdAt),
            deletedAt: student.deletedAt ? new Date(student.deletedAt) : null,
          },
        }),
      );
      await insert("emergencyContacts", rows(backup, "emergencyContacts"), (contact) =>
        tx.emergencyContact.create({
          data: {
            id: contact.id,
            studentId: contact.studentId,
            fullName: contact.fullName,
            phone: contact.phone,
            relationship: contact.relationship,
          },
        }),
      );

      await insert("groups", rows(backup, "groups"), (group) =>
        tx.group.create({
          data: {
            id: group.id,
            organizationId: organization.id,
            name: group.name,
            programId: group.programId,
            levelId: group.levelId,
            branchId: group.branchId,
            poolId: group.poolId,
            laneId: group.laneId,
            instructorId: group.instructorId,
            capacity: group.capacity,
            isPublished: group.isPublished,
          },
        }),
      );
      await insert("scheduleRules", rows(backup, "scheduleRules"), (rule) =>
        tx.scheduleRule.create({
          data: {
            id: rule.id,
            groupId: rule.groupId,
            weekDay: rule.weekDay,
            startTime: rule.startTime,
            durationMinutes: rule.durationMinutes,
          },
        }),
      );
      await insert("sessions", rows(backup, "sessions"), (session) =>
        tx.classSession.create({
          data: {
            id: session.id,
            groupId: session.groupId,
            startsAt: new Date(session.startsAt),
            endsAt: new Date(session.endsAt),
          },
        }),
      );

      await insert("enrollments", rows(backup, "enrollments"), async (enrollment) => {
        await tx.enrollment.create({
          data: {
            id: enrollment.id,
            organizationId: organization.id,
            studentId: enrollment.studentId,
            groupId: enrollment.groupId,
            status: enrollment.status,
            startDate: new Date(enrollment.startDate),
            billingModality: enrollment.billingModality,
            monthlyRateAmount: enrollment.monthlyRateAmount,
            monthlyDueDay: enrollment.monthlyDueDay,
          },
        });
        for (const history of enrollment.statusHistory ?? []) {
          await tx.enrollmentStatusHistory.create({
            data: {
              id: history.id,
              enrollmentId: enrollment.id,
              fromStatus: history.fromStatus,
              toStatus: history.toStatus,
              reason: history.reason,
              actorUserId: history.actorUserId,
              createdAt: new Date(history.createdAt),
            },
          });
        }
      });

      await insert("charges", rows(backup, "charges"), (charge) =>
        tx.charge.create({
          data: {
            id: charge.id,
            organizationId: organization.id,
            studentId: charge.studentId,
            enrollmentId: charge.enrollmentId,
            type: charge.type,
            description: charge.description,
            amount: charge.amount,
            currency: charge.currency,
            dueDate: charge.dueDate ? new Date(charge.dueDate) : null,
            status: charge.status,
            periodYear: charge.periodYear,
            periodMonth: charge.periodMonth,
            createdAt: new Date(charge.createdAt),
          },
        }),
      );

      // Antes que Payment: el pago referencia el corte que lo contiene.
      await insert("cashClosings", rows(backup, "cashClosings"), (closing) =>
        tx.cashClosing.create({
          data: {
            id: closing.id,
            organizationId: organization.id,
            openedAt: new Date(closing.openedAt),
            closedAt: new Date(closing.closedAt),
            totalCash: closing.totalCash,
            totalTransfer: closing.totalTransfer,
            totalCard: closing.totalCard,
            totalOther: closing.totalOther,
            actorUserId: closing.actorUserId,
          },
        }),
      );
      await insert("payments", rows(backup, "payments"), (payment) =>
        tx.payment.create({
          data: {
            id: payment.id,
            organizationId: organization.id,
            studentId: payment.studentId,
            amount: payment.amount,
            method: payment.method,
            receivedAt: new Date(payment.receivedAt),
            cashClosingId: payment.cashClosingId,
            actorUserId: payment.actorUserId,
          },
        }),
      );
      await insert("paymentAllocations", rows(backup, "paymentAllocations"), (allocation) =>
        tx.paymentAllocation.create({
          data: {
            id: allocation.id,
            paymentId: allocation.paymentId,
            chargeId: allocation.chargeId,
            amount: allocation.amount,
          },
        }),
      );
      await insert("adjustments", rows(backup, "adjustments"), (adjustment) =>
        tx.adjustment.create({
          data: {
            id: adjustment.id,
            chargeId: adjustment.chargeId,
            amount: adjustment.amount,
            reason: adjustment.reason,
            actorUserId: adjustment.actorUserId,
            createdAt: new Date(adjustment.createdAt),
          },
        }),
      );
      await insert("refunds", rows(backup, "refunds"), (refund) =>
        tx.refund.create({
          data: {
            id: refund.id,
            paymentId: refund.paymentId,
            amount: refund.amount,
            reason: refund.reason,
            actorUserId: refund.actorUserId,
            createdAt: new Date(refund.createdAt),
          },
        }),
      );

      await insert("packageCredits", rows(backup, "packageCredits"), async (credit) => {
        await tx.packageCredit.create({
          data: {
            id: credit.id,
            organizationId: organization.id,
            studentId: credit.studentId,
            chargeId: credit.chargeId,
            enrollmentId: credit.enrollmentId,
            totalUnits: credit.totalUnits,
            validFrom: new Date(credit.validFrom),
            validUntil: new Date(credit.validUntil),
          },
        });
        for (const movement of credit.movements ?? []) {
          await tx.packageCreditMovement.create({
            data: {
              id: movement.id,
              packageCreditId: credit.id,
              delta: movement.delta,
              reason: movement.reason,
              sessionId: movement.sessionId,
              actorUserId: movement.actorUserId,
              createdAt: new Date(movement.createdAt),
            },
          });
        }
      });

      await insert("attendances", rows(backup, "attendances"), (attendance) =>
        tx.attendance.create({
          data: {
            id: attendance.id,
            sessionId: attendance.sessionId,
            studentId: attendance.studentId,
            status: attendance.status,
            notes: attendance.notes,
            actorUserId: attendance.actorUserId,
            createdAt: new Date(attendance.createdAt),
          },
        }),
      );

      await insert("products", rows(backup, "products"), (product) =>
        tx.product.create({
          data: {
            id: product.id,
            organizationId: organization.id,
            name: product.name,
            category: product.category,
            unitPrice: product.unitPrice,
            currency: product.currency,
            isActive: product.isActive,
            createdAt: new Date(product.createdAt),
          },
        }),
      );
      // Antes que StockMovement: el movimiento de venta referencia la venta.
      await insert("sales", rows(backup, "sales"), (sale) =>
        tx.sale.create({
          data: {
            id: sale.id,
            organizationId: organization.id,
            total: sale.total,
            currency: sale.currency,
            method: sale.method,
            soldAt: new Date(sale.soldAt),
            cashClosingId: sale.cashClosingId,
            actorUserId: sale.actorUserId,
          },
        }),
      );
      await insert("saleLines", rows(backup, "saleLines"), (line) =>
        tx.saleLine.create({
          data: {
            id: line.id,
            saleId: line.saleId,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          },
        }),
      );
      await insert("stockMovements", rows(backup, "stockMovements"), (movement) =>
        tx.stockMovement.create({
          data: {
            id: movement.id,
            productId: movement.productId,
            delta: movement.delta,
            reason: movement.reason,
            saleId: movement.saleId,
            notes: movement.notes,
            actorUserId: movement.actorUserId,
            createdAt: new Date(movement.createdAt),
          },
        }),
      );

      await insert("assessments", rows(backup, "assessments"), (assessment) =>
        tx.assessment.create({
          data: {
            id: assessment.id,
            organizationId: organization.id,
            studentId: assessment.studentId,
            evaluatorUserId: assessment.evaluatorUserId,
            assessedAt: new Date(assessment.assessedAt),
            observation: assessment.observation,
            suggestedLevelId: assessment.suggestedLevelId,
            createdAt: new Date(assessment.createdAt),
          },
        }),
      );
    },
    // Una escuela con historial tarda mas que el limite por omision de Prisma.
    { timeout: 120_000, maxWait: 30_000 },
  );

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    replaced: Boolean(existing),
    counts,
    adminEmail,
  };
}
