import { hashPassword } from "@vonveria-swim/auth";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_TIMEZONE,
} from "@vonveria-swim/configuration";
import { CAPABILITIES, CAPABILITY_CATALOG } from "@vonveria-swim/permissions";
import { RoleKey, WeekDay, getPrismaClient, type PrismaClient } from "./index";

const PILOT_ORGANIZATION_NAME = "Escuela Piloto VonverIA Swim";

const ROLE_DEFINITIONS: Array<{ key: RoleKey; name: string; capabilities: readonly string[] }> = [
  {
    key: RoleKey.DIRECCION,
    name: "Direccion",
    capabilities: [
      CAPABILITIES.ORGANIZATION_MANAGE,
      CAPABILITIES.USERS_MANAGE,
      CAPABILITIES.AUDIT_VIEW,
      CAPABILITIES.CATALOG_MANAGE,
      CAPABILITIES.STUDENTS_MANAGE,
      CAPABILITIES.SCHEDULING_MANAGE,
      CAPABILITIES.BILLING_MANAGE,
      CAPABILITIES.BILLING_ADJUST,
    ],
  },
  {
    key: RoleKey.RECEPCION,
    name: "Recepcion",
    capabilities: [
      CAPABILITIES.STUDENTS_MANAGE,
      CAPABILITIES.SCHEDULING_MANAGE,
      CAPABILITIES.BILLING_MANAGE,
    ],
  },
  { key: RoleKey.INSTRUCTOR, name: "Instructor", capabilities: [] },
];

async function seedAppMetadata(prisma: PrismaClient): Promise<void> {
  await prisma.appMetadata.upsert({
    where: { key: "schema_bootstrap" },
    update: {},
    create: { key: "schema_bootstrap", value: "0.1.0" },
  });
}

async function seedPilotOrganization(prisma: PrismaClient) {
  const existing = await prisma.organization.findFirst({
    where: { name: PILOT_ORGANIZATION_NAME },
  });
  if (existing) return existing;

  return prisma.organization.create({
    data: {
      name: PILOT_ORGANIZATION_NAME,
      timezone: DEFAULT_TIMEZONE,
      currency: DEFAULT_CURRENCY,
    },
  });
}

async function seedBranding(prisma: PrismaClient, organizationId: string): Promise<void> {
  await prisma.brandingSettings.upsert({
    where: { organizationId },
    update: {},
    create: {
      organizationId,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      accentColor: DEFAULT_ACCENT_COLOR,
    },
  });
}

async function seedPermissionCatalog(prisma: PrismaClient): Promise<void> {
  for (const capability of CAPABILITY_CATALOG) {
    await prisma.permission.upsert({
      where: { key: capability.key },
      update: { description: capability.description },
      create: { key: capability.key, description: capability.description },
    });
  }
}

async function seedRoles(
  prisma: PrismaClient,
  organizationId: string,
): Promise<Record<RoleKey, string>> {
  const roleIdsByKey = {} as Record<RoleKey, string>;

  for (const definition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId, key: definition.key } },
      update: { name: definition.name },
      create: { organizationId, key: definition.key, name: definition.name },
    });
    roleIdsByKey[definition.key] = role.id;

    for (const capabilityKey of definition.capabilities) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: capabilityKey },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  return roleIdsByKey;
}

async function seedAdminUser(
  prisma: PrismaClient,
  organizationId: string,
  direccionRoleId: string,
): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias para el seed (ver .env.example). " +
        "Son datos de la escuela piloto simulada, no un secreto de produccion.",
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { organizationId_email: { organizationId, email } },
    update: { passwordHash },
    create: {
      organizationId,
      email,
      passwordHash,
      fullName: "Direccion Piloto",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: direccionRoleId } },
    update: {},
    create: { userId: user.id, roleId: direccionRoleId },
  });
}

async function seedReceptionUser(
  prisma: PrismaClient,
  organizationId: string,
  recepcionRoleId: string,
): Promise<void> {
  // Usuario de la escuela piloto simulada, no un secreto real. Sus capacidades
  // salen de ROLE_DEFINITIONS: registra alumnos, inscripciones y cobros, pero no
  // administra permisos ni aplica ajustes o devoluciones.
  const passwordHash = await hashPassword(process.env.RECEPTION_PASSWORD ?? "12345678acs");

  const user = await prisma.user.upsert({
    where: { organizationId_email: { organizationId, email: "recepcion@vonveria.mx" } },
    update: { passwordHash },
    create: {
      organizationId,
      email: "recepcion@vonveria.mx",
      passwordHash,
      fullName: "Recepcion Piloto",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: recepcionRoleId } },
    update: {},
    create: { userId: user.id, roleId: recepcionRoleId },
  });
}

async function seedInstructorWithTodayClasses(
  prisma: PrismaClient,
  organizationId: string,
  instructorRoleId: string,
): Promise<void> {
  // Usuario de la escuela piloto simulada, no un secreto real. Se deja
  // configurable por si un despliegue quiere una distinta.
  const passwordHash = await hashPassword(process.env.INSTRUCTOR_PASSWORD ?? "12345678acs");

  const instructor = await prisma.user.upsert({
    where: { organizationId_email: { organizationId, email: "instructor@vonveria.mx" } },
    update: { passwordHash },
    create: {
      organizationId,
      email: "instructor@vonveria.mx",
      passwordHash,
      fullName: "Maestra Andrea",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: instructor.id, roleId: instructorRoleId } },
    update: {},
    create: { userId: instructor.id, roleId: instructorRoleId },
  });

  // Catalogo minimo para poder colgar el grupo. Se crea aqui en vez de solo
  // buscarlo: en un despliegue nuevo la base esta vacia y antes el seed se
  // rendia en silencio, dejando a la instructora sin grupo ni alumnos.
  const program = await prisma.program.upsert({
    where: { organizationId_name: { organizationId, name: "Natacion Infantil" } },
    update: {},
    create: { organizationId, name: "Natacion Infantil" },
  });

  const level = await prisma.level.upsert({
    where: { programId_name: { programId: program.id, name: "Nivel 1" } },
    update: {},
    create: { programId: program.id, name: "Nivel 1", sortOrder: 1 },
  });

  const branch = await prisma.branch.upsert({
    where: { organizationId_name: { organizationId, name: "Sucursal Principal" } },
    update: {},
    create: { organizationId, name: "Sucursal Principal" },
  });

  const pool = await prisma.pool.upsert({
    where: { branchId_name: { branchId: branch.id, name: "Alberca Principal" } },
    update: {},
    create: { branchId: branch.id, name: "Alberca Principal" },
  });

  // Crear grupo para la maestra
  const group = await prisma.group.upsert({
    where: { id: "group-maestra-andrea" },
    update: { instructorId: instructor.id },
    create: {
      id: "group-maestra-andrea",
      organizationId,
      name: "Clase 9-10AM",
      programId: program.id,
      levelId: level.id,
      branchId: branch.id,
      poolId: pool.id,
      capacity: 10,
      isPublished: true,
      instructorId: instructor.id,
    },
  });

  // Crear schedule rule (lunes a viernes 9-10 AM)
  const weekDays = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
  ];
  for (const weekDay of weekDays) {
    await prisma.scheduleRule.upsert({
      where: {
        id: `rule-${group.id}-${weekDay}`,
      },
      update: {},
      create: {
        id: `rule-${group.id}-${weekDay}`,
        groupId: group.id,
        weekDay,
        startTime: "09:00",
        durationMinutes: 60,
      },
    });
  }

  // Crear familia con alumnos para inscribir en la clase
  const family = await prisma.family.upsert({
    where: { id: "family-demo" },
    update: {},
    create: {
      id: "family-demo",
      organizationId,
    },
  });

  // Crear algunos estudiantes
  const studentNames = ["Juan", "María", "Carlos"];
  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.student.upsert({
      where: { id: `student-demo-${i}` },
      update: {},
      create: {
        id: `student-demo-${i}`,
        organizationId,
        familyId: family.id,
        fullName: `${studentNames[i]} García`,
        birthDate: new Date("2015-01-01"),
      },
    });
    students.push(student);
  }

  // Inscribir estudiantes en el grupo
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: { id: `enrollment-${student.id}-${group.id}` },
      update: {},
      create: {
        id: `enrollment-${student.id}-${group.id}`,
        organizationId,
        studentId: student.id,
        groupId: group.id,
        startDate: new Date(),
        status: "ACTIVE",
        billingModality: "MONTHLY",
        monthlyRateAmount: "1500.00",
        monthlyDueDay: 15,
      },
    });
  }

  // Crear sesión para hoy o el próximo día laborable
  const today = new Date();
  let dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const sessionDate = new Date(today);

  // Si no es un día laborable (lunes-viernes), ir al próximo lunes
  if (dayOfWeek === 0) {
    // Domingo: ir al lunes siguiente (+ 1 día)
    sessionDate.setDate(sessionDate.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Sábado: ir al lunes siguiente (+ 2 días)
    sessionDate.setDate(sessionDate.getDate() + 2);
  }

  const startsAt = new Date(sessionDate);
  startsAt.setHours(9, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setHours(10, 0, 0, 0);

  await prisma.classSession.upsert({
    where: { groupId_startsAt: { groupId: group.id, startsAt } },
    update: {},
    create: { groupId: group.id, startsAt, endsAt },
  });
}

async function main(): Promise<void> {
  const prisma = getPrismaClient();

  await seedAppMetadata(prisma);

  const organization = await seedPilotOrganization(prisma);
  await seedBranding(prisma, organization.id);
  await seedPermissionCatalog(prisma);
  const roleIdsByKey = await seedRoles(prisma, organization.id);
  await seedAdminUser(prisma, organization.id, roleIdsByKey[RoleKey.DIRECCION]);
  await seedReceptionUser(prisma, organization.id, roleIdsByKey[RoleKey.RECEPCION]);
  await seedInstructorWithTodayClasses(prisma, organization.id, roleIdsByKey[RoleKey.INSTRUCTOR]);

  console.log("Seed de packages/database completado.");
  console.log(`Organizacion piloto: ${organization.name} (${organization.id})`);
  console.log("\n📚 Usuarios creados:");
  console.log("  - Admin (Dirección): sistemas@vonveria.mx / 12345678acs");
  console.log("  - Recepción: recepcion@vonveria.mx / 12345678acs");
  console.log("  - Instructor: instructor@vonveria.mx / 12345678acs");
}

main()
  .catch((error: unknown) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
