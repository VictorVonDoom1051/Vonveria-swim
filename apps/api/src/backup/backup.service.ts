import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { buildCsv, formatDateForCsv, formatDateTimeForCsv } from "./csv";

export type CsvDataset = "alumnos" | "pagos" | "asistencias" | "inventario";

@Injectable()
export class BackupService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Respaldo completo de una escuela.
   *
   * Deliberadamente NO incluye passwordHash: un respaldo que circula por correo
   * o queda en un disco no debe cargar credenciales (Seccion 15). Al restaurar
   * hay que fijar contrasenas nuevas, y el bloque meta lo deja dicho.
   */
  async exportAll(organizationId: string) {
    const client = this.prisma.client;
    const byOrg = { organizationId };

    const [
      organization,
      branding,
      permissions,
      roles,
      users,
      families,
      guardians,
      students,
      emergencyContacts,
      branches,
      pools,
      lanes,
      programs,
      levels,
      groups,
      scheduleRules,
      sessions,
      enrollments,
      charges,
      payments,
      paymentAllocations,
      adjustments,
      refunds,
      packageCredits,
      cashClosings,
      attendances,
      products,
      stockMovements,
      sales,
      saleLines,
      assessments,
    ] = await Promise.all([
      client.organization.findUnique({ where: { id: organizationId } }),
      client.brandingSettings.findUnique({ where: { organizationId } }),
      // Catalogo global, no por organizacion. Sin el, los RolePermission del
      // archivo apuntarian a ids inexistentes al restaurar en otra base y la
      // escuela quedaria sin capacidades: nadie podria hacer nada al entrar.
      client.permission.findMany({ orderBy: { key: "asc" } }),
      client.role.findMany({ where: byOrg, include: { permissions: true } }),
      client.user.findMany({
        where: byOrg,
        // Seleccion explicita: incluir el modelo entero filtraria el hash solo
        // por olvido de quien lo lea despues.
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          createdAt: true,
          deletedAt: true,
          roles: true,
        },
      }),
      client.family.findMany({ where: byOrg }),
      client.guardian.findMany({ where: { family: { organizationId } } }),
      client.student.findMany({ where: byOrg }),
      client.emergencyContact.findMany({ where: { student: { organizationId } } }),
      client.branch.findMany({ where: byOrg }),
      client.pool.findMany({ where: { branch: { organizationId } } }),
      client.lane.findMany({ where: { pool: { branch: { organizationId } } } }),
      client.program.findMany({ where: byOrg }),
      client.level.findMany({ where: { program: { organizationId } } }),
      client.group.findMany({ where: byOrg }),
      client.scheduleRule.findMany({ where: { group: { organizationId } } }),
      client.classSession.findMany({ where: { group: { organizationId } } }),
      client.enrollment.findMany({ where: byOrg, include: { statusHistory: true } }),
      client.charge.findMany({ where: byOrg }),
      client.payment.findMany({ where: byOrg }),
      client.paymentAllocation.findMany({ where: { payment: { organizationId } } }),
      client.adjustment.findMany({ where: { charge: { organizationId } } }),
      client.refund.findMany({ where: { payment: { organizationId } } }),
      client.packageCredit.findMany({ where: byOrg, include: { movements: true } }),
      client.cashClosing.findMany({ where: byOrg }),
      client.attendance.findMany({ where: { student: { organizationId } } }),
      client.product.findMany({ where: byOrg }),
      client.stockMovement.findMany({ where: { product: { organizationId } } }),
      client.sale.findMany({ where: byOrg }),
      client.saleLine.findMany({ where: { sale: { organizationId } } }),
      client.assessment.findMany({ where: byOrg }),
    ]);

    return {
      meta: {
        exportedAt: new Date().toISOString(),
        organizationId,
        organizationName: organization?.name ?? null,
        // 2 agrega el catalogo de permisos, sin el cual la restauracion dejaba
        // los roles sin capacidades.
        formatVersion: 2,
        aviso:
          "Este respaldo NO incluye contrasenas. Al restaurarlo hay que fijar " +
          "contrasenas nuevas para cada usuario.",
      },
      organization,
      branding,
      permissions,
      roles,
      users,
      families,
      guardians,
      students,
      emergencyContacts,
      branches,
      pools,
      lanes,
      programs,
      levels,
      groups,
      scheduleRules,
      sessions,
      enrollments,
      charges,
      payments,
      paymentAllocations,
      adjustments,
      refunds,
      packageCredits,
      cashClosings,
      attendances,
      products,
      stockMovements,
      sales,
      saleLines,
      assessments,
    };
  }

  async buildCsvDataset(organizationId: string, dataset: CsvDataset): Promise<string> {
    switch (dataset) {
      case "alumnos":
        return this.studentsCsv(organizationId);
      case "pagos":
        return this.paymentsCsv(organizationId);
      case "asistencias":
        return this.attendancesCsv(organizationId);
      case "inventario":
        return this.inventoryCsv(organizationId);
    }
  }

  private async studentsCsv(organizationId: string): Promise<string> {
    const students = await this.prisma.client.student.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        family: { include: { guardians: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { group: { include: { level: true, program: true } } },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return buildCsv(
      ["Alumno", "Fecha de nacimiento", "Alertas medicas", "Tutor", "Telefono", "Grupo", "Nivel"],
      students.map((student) => {
        const guardian = student.family.guardians[0];
        const enrollment = student.enrollments[0];
        return [
          student.fullName,
          formatDateForCsv(student.birthDate),
          student.medicalAlerts,
          guardian?.fullName,
          guardian?.phone,
          enrollment?.group.name,
          enrollment?.group.level.name,
        ];
      }),
    );
  }

  private async paymentsCsv(organizationId: string): Promise<string> {
    const payments = await this.prisma.client.payment.findMany({
      where: { organizationId },
      include: {
        student: true,
        allocations: { include: { charge: true } },
      },
      orderBy: { receivedAt: "desc" },
    });

    return buildCsv(
      ["Fecha", "Alumno", "Monto", "Metodo", "Aplicado a"],
      payments.map((payment) => [
        formatDateTimeForCsv(payment.receivedAt),
        payment.student.fullName,
        payment.amount.toString(),
        payment.method,
        payment.allocations.map((allocation) => allocation.charge.description).join(" | "),
      ]),
    );
  }

  private async attendancesCsv(organizationId: string): Promise<string> {
    const attendances = await this.prisma.client.attendance.findMany({
      where: { student: { organizationId } },
      include: {
        student: true,
        session: { include: { group: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return buildCsv(
      ["Fecha de clase", "Grupo", "Alumno", "Estado", "Nota"],
      attendances.map((attendance) => [
        formatDateTimeForCsv(attendance.session.startsAt),
        attendance.session.group.name,
        attendance.student.fullName,
        attendance.status === "ABSENT_JUSTIFIED" ? "Falta avisada" : "Presente",
        attendance.notes,
      ]),
    );
  }

  private async inventoryCsv(organizationId: string): Promise<string> {
    const products = await this.prisma.client.product.findMany({
      where: { organizationId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const movements = await this.prisma.client.stockMovement.groupBy({
      by: ["productId"],
      where: { product: { organizationId } },
      _sum: { delta: true },
    });
    const stockByProduct = new Map(
      movements.map((movement) => [movement.productId, movement._sum.delta ?? 0]),
    );

    return buildCsv(
      ["Producto", "Tipo", "Precio", "Existencias", "Estado"],
      products.map((product) => [
        product.name,
        product.category === "EQUIPMENT" ? "Equipo" : "Consumible",
        product.unitPrice.toString(),
        stockByProduct.get(product.id) ?? 0,
        product.isActive ? "Activo" : "Dado de baja",
      ]),
    );
  }
}
