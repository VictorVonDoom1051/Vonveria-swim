# VonverIA Swim

Plataforma profesional, configurable y replicable para administrar escuelas de natacion.

Este repositorio se desarrolla por hitos, definidos y controlados por [`CLAUDE.md`](./CLAUDE.md) y por la especificacion de producto en [`docs/product/MASTER_SPEC.md`](./docs/product/MASTER_SPEC.md). No se implementan modulos fuera del hito autorizado sin revision.

## Estado actual

**M1 — Organizacion, acceso y diseno.** Login por sesion (cookie httpOnly), RBAC por capacidades, layout autenticado con navegacion por rol, branding dinamico por organizacion, gestion de usuarios y auditoria. Ningun modulo de negocio (familias, clases, cobros, asistencia, evaluaciones) esta implementado todavia; eso corresponde a M2 en adelante, con destinos "Proximamente" ya presentes en la navegacion.

Usuario de la escuela piloto (ver `.env`): `ADMIN_EMAIL` / `ADMIN_PASSWORD`, creado por `pnpm db:seed`.

## Arranque rapido (Windows)

Ver la guia completa en [`docs/deployment/getting-started-windows.md`](./docs/deployment/getting-started-windows.md).

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Estructura del repositorio

```text
apps/
  web/        # Next.js + React
  api/        # NestJS modular, API REST
  worker/     # procesos programados/asincronos
packages/
  database/   # Prisma schema, migraciones, seed
  ui/         # design tokens y componentes base
  auth/, permissions/, configuration/  # hash de contrasenas, capacidades RBAC, branding
  swimming-core/  # reservado, se llena desde M2
  testing/    # configuracion compartida de pruebas
docs/
  product/, architecture/, decisions/, deployment/, testing/, user-manual/
```

## Comandos principales

| Comando                             | Descripcion                                 |
| ----------------------------------- | ------------------------------------------- |
| `pnpm dev`                          | Levanta `web`, `api` y `worker` en paralelo |
| `pnpm lint` / `pnpm lint:fix`       | ESLint en todo el monorepo                  |
| `pnpm format` / `pnpm format:check` | Prettier                                    |
| `pnpm typecheck`                    | TypeScript estricto, sin emitir             |
| `pnpm test`                         | Vitest en cada app/paquete                  |
| `pnpm build`                        | Build/typecheck de cada app/paquete         |

## Documentacion

- Fuente de verdad de producto: [`docs/product/MASTER_SPEC.md`](./docs/product/MASTER_SPEC.md)
- Reglas permanentes del proyecto: [`CLAUDE.md`](./CLAUDE.md)
- Decisiones (ADR/RFC): [`docs/decisions/`](./docs/decisions/)
- Arquitectura: [`docs/architecture/`](./docs/architecture/)
