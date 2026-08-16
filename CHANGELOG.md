# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo. El formato sigue [Keep a Changelog](https://keepachangelog.com/) y el versionado sigue [SemVer](https://semver.org/lang/es/).

## [0.6.0] - 2026-08-16

### Agregado

- **Panel de inicio con mapa de albercas.** `/inicio` deja de ser un texto placeholder: muestra cada alberca con sus carriles y lo que esta pasando en ellos ahora, los pagos vencidos, las faltas avisadas de hoy y accesos rapidos. Sin migracion: `Lane` y `Group.laneId` existian desde M2 sin usarse.
- **Respaldos** (`/settings/backup`, solo Direccion): descarga de toda la escuela en un JSON y de cuatro listados en CSV (alumnos, pagos, asistencias, inventario) para abrir en Excel e imprimir. El respaldo **nunca** incluye `passwordHash`. Los CSV se emiten UTF-8 con BOM para que Excel respete los acentos. Documentado en `docs/deployment/backups.md`, incluyendo que la restauracion aun no se ha probado.
- **Instructores** (`/instructores`): vista operativa con los grupos de cada instructor, horario agrupado por hora y cupo ocupado. Sin formularios: el alta sigue en Configuracion → Usuarios.
- **Evaluaciones** (`/evaluaciones`): modelo `Assessment` con fecha, observacion y nivel sugerido. Un instructor solo ve y evalua a los alumnos inscritos en sus propios grupos; el filtro vive en el servicio, no en la interfaz.

### Cambiado

- **El rol Instructor recibe su primera capacidad**, `assessments:manage`, coherente con la Seccion 4 de `CLAUDE.md`, que le asigna evaluar y proponer avance de nivel. `GET /programs` la acepta tambien, porque para sugerir un nivel hay que poder leer el catalogo.
- El seed refleja la escuela real: Alberca Grande con dos carriles y Alberca Chica para clases personalizadas. La alberca anterior se **renombra** conservando su id, para no dejar huerfanos los grupos que ya apuntaban a ella en produccion.

## [0.5.0] - 2026-08-15

### Agregado

- **M7 — Productos, inventario y venta de mostrador.** Modulo fuera de M0–M6, aprobado explicitamente (ver `docs/decisions/0002-productos-inventario-y-venta-de-mostrador.md`).
  - Modelos `Product`, `StockMovement`, `Sale` y `SaleLine`, con enums `ProductCategory` y `StockMovementReason`. Migracion aditiva: ningun modelo existente cambia.
  - Las existencias se calculan sumando movimientos; no hay campo `stock` editable.
  - `SaleLine.unitPrice` congela el precio al momento de vender.
  - `SalesService.createSale` valida existencias con las filas de producto bloqueadas (`SELECT ... FOR UPDATE`), ordenadas por id para evitar interbloqueos entre carritos.
  - Capacidades nuevas: `sales:manage` (Direccion y Recepcion) e `inventory:manage` (solo Direccion).
  - `/tienda`: cobro de mostrador con carrito, metodo de pago y bloqueo de productos agotados.
  - `/tienda/inventario`: alta de productos, entradas y ajustes con motivo obligatorio.
  - Seed con cuatro productos demo y sus existencias iniciales.

### Cambiado

- **El corte de caja incluye las ventas de mostrador.** `getOpenSummary`, `closeCash` y `getClosingDetail` suman pagos y ventas en un solo total por metodo, con desglose por origen. Un dia de solo ventas de productos ya se puede cerrar; antes fallaba con `CASH_CLOSING_NO_OPEN_PAYMENTS`.

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
