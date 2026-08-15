# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo. El formato sigue [Keep a Changelog](https://keepachangelog.com/) y el versionado sigue [SemVer](https://semver.org/lang/es/).

## [0.4.0] - 2026-08-15

### Agregado

- **M4 — Asistencia (Simplified Scope):** Sistema de registro de ausencias simplificado (solo avisos de inasistencia, sin Hikvision).
  - Modelo `Attendance` con enum `AttendanceStatus` (PRESENT / ABSENT_JUSTIFIED).
  - `AttendanceService`: `markAbsent()` con notas opcionales, `markPresent()` (revertir), `getSessionAttendance()`.
  - `AttendanceController`: endpoints `POST` para marcar/revertir, `GET` para consultar, protegidos por capacidad `billing:manage`.
  - Componente React `SessionAttendance`: interfaz visual con iconos de colores (verde presente, rojo ausente).
  - Modal para captura de notas y confirmación de acción.
  - Auditoría automática en cada cambio de asistencia.
  - Restricción de permisos: solo Recepción/Dirección pueden marcar (Instructor ve lectura).

- **Instructor User & Demo Data:**
  - Usuario piloto instructor: `instructor@vonveria.mx` / `instructor123` (Maestra Andrea).
  - Grupo "Clase 9-10AM" con horario lunes-viernes 09:00-10:00 asignado a instructor.
  - 3 estudiantes de demo (Juan, María, Carlos García) inscritos con modalidad mensual.
  - Sesión generada para próximo lunes (si hoy es fin de semana).

- **Endpoint Improvement:** `GET /scheduling/sessions/today` ahora devuelve sesiones de hoy y próximos 7 días (antes solo hoy), permitiendo que instructores vean clases próximas.

- **Documentation:** `TESTING_BETA.md` con guía de pruebas internas, credenciales, flujos a validar y troubleshooting.

### Corregido

- Seed now handles weekends correctly: if today is Saturday/Sunday, creates session for next Monday.
- Attendance component properly respects instructor-only read permission.

### Testing Beta Status

**Ready for internal testing:** Milestones M1 (Org & Access), M2 (Families & Classes), M3 (Billing), M4 (Attendance - simplified) implementados y verificados en navegador.

## [0.3.0] - 2026-08-14

### Agregado

- **M3 — Cobranza:** Sistema completo de cobros, pagos y cierre de caja.
  - Modelos: `Charge`, `Payment`, `PaymentAllocation`, `Adjustment`, `Refund`, `PackageCredit`, `CashClosing`.
  - `ChargesService`, `PaymentsService` (asignación automática), `AdjustmentsService`, `RefundsService`, `PackagesService`, `CashClosingService`.
  - Modalidad de facturación en inscripción: Mensual, Paquete, Clase individual, Ninguno.
  - Generación automática de mensualidades via worker job (idempotente por enrollmentId + año + mes).
  - Formularios para registrar pagos, descontar, devolver, vender paquetes.
  - Vista de recibos imprimibles (`/pagos/recibos/[id]`).
  - Corte de caja (`/pagos/corte`) y cierre de transacciones.
  - Capacidades: `billing:manage` (Dirección/Recepcion), `billing:adjust` (solo Dirección).

## [0.2.0] - 2026-08-14

### Agregado

- Modelo de datos de organizacion y acceso (M1): `Organization`, `BrandingSettings`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Session`, `AuditLog`.
- Autenticacion por sesion con cookie httpOnly (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`), hash de contrasenas con `argon2`, proteccion CSRF (doble cookie) y rate limiting en login.
- RBAC basado en capacidades (`packages/permissions`): catalogo inicial `organization:manage`, `users:manage`, `audit:view`, seedeado solo en el rol Direccion.
- `packages/auth` y `packages/configuration` con contenido real (antes cascarones vacios de M0).
- Endpoints de organizacion (`GET/PATCH /organization`, `GET /organization/branding` publico, `PATCH /organization/branding`) y de usuarios (`GET/POST /users`, `POST /users/:id/reset-password`), todos con auditoria automatica.
- `GET /audit` paginado para consultar el registro de auditoria.
- Layout autenticado en `apps/web` con navegacion por rol (6 secciones Direccion/Recepcion, 3 secciones Instructor) y paginas "Proximamente" para los modulos que llegan en M2+.
- Paginas reales de configuracion: `/settings/organization` (branding dinamico), `/settings/users` (alta y reseteo de contrasena), `/settings/audit`.
- Branding dinamico de verdad: los colores de marca se inyectan como variables CSS en tiempo de render, sin reconstruir el bundle.
- ADR 0001: inyeccion explicita `@Inject()` obligatoria en NestJS (tsx/esbuild no emiten metadata de decoradores).
- Seed ampliado: organizacion piloto, branding, 3 roles y usuario Direccion inicial desde `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### Corregido

- `PrismaService` ahora se provee una sola vez via `PrismaModule` global (antes se duplicaba por modulo).
- Los imports relativos en todo el monorepo dejaron de usar sufijo `.js`: funcionaba con `tsx`/`tsc` pero rompia el build de Next.js/webpack.

## [0.1.0] - 2026-08-14

### Agregado

- Fundacion del monorepo (M0): `apps/web`, `apps/api`, `apps/worker`, `packages/database`, `packages/ui`, `packages/testing` y cascarones reservados para `auth`, `permissions`, `configuration`, `swimming-core`.
- Postgres local via Docker Compose y primera migracion de Prisma (`AppMetadata`, no ligada a negocio).
- Health checks en `apps/api` (`GET /health`, `GET /ready`).
- Sistema visual inicial (design tokens, `Button`, `Card`, `StatusBadge`) y pagina temporal en `apps/web` que lo demuestra.
- Heartbeat minimo en `apps/worker`, sin dependencias de colas.
- Lint (ESLint flat config), formato (Prettier), TypeScript estricto y pruebas minimas (Vitest) en todo el monorepo.
- CI basico en GitHub Actions: install, lint, typecheck, test, build, con Postgres de servicio.
- Documentacion de arranque para Windows y copia de `docs/product/MASTER_SPEC.md`.
