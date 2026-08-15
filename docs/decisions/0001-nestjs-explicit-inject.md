# ADR 0001 — Inyeccion explicita (`@Inject`) obligatoria en NestJS

**Estado:** Aceptada  
**Fecha:** 2026-08-14  
**Contexto:** M0 — Fundacion

## Problema

`apps/api` corre en desarrollo con `tsx` (basado en esbuild) por velocidad, en vez de `tsc`/`ts-node`/Nest CLI con `swc` configurado para metadata. esbuild **no emite** la metadata de decoradores (`design:paramtypes`) que Nest usa para resolver dependencias inyectadas por tipo en el constructor.

Consecuencia real observada en M0: `HealthController` dependia de `PrismaService` solo mediante el tipo del parametro del constructor (`private readonly prisma: PrismaService`). La aplicacion arrancaba sin ningun error, pero `this.prisma` llegaba `undefined` en tiempo de ejecucion, y `/ready` fallaba con un `TypeError` en vez de reportar el estado real de la base de datos. Es un fallo silencioso: nada en el arranque lo advierte.

## Decision

Toda inyeccion de dependencias por constructor en `apps/api` (y cualquier otro servicio NestJS que se agregue) debe usar `@Inject(Token)` explicito en el parametro, en vez de depender unicamente del tipo:

```ts
constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
```

Esto aplica sin excepcion a todos los modulos de negocio que se construyan desde M1 en adelante (Identity & Access, Families & Students, Billing, etc.), no solo a `HealthModule`.

## Alternativas consideradas

- **Nest CLI con builder `swc`**: es la via oficial recomendada por NestJS para este problema, pero implica agregar `@nestjs/cli`, `@nestjs/schematics`, `@swc/core` y reconciliar su salida CommonJS por defecto con el resto del monorepo en ESM. Se pospone: valorarla si la complejidad de inyeccion crece mucho en M1+ (module con muchos providers) o si el equipo lo pide explicitamente.
- **`ts-node`**: mas lento en watch mode, mismos problemas de interoperabilidad ESM que esbuild resuelve mejor.

## Consecuencias

- Cero dependencias nuevas; cambio de cero costo en tooling.
- Requiere disciplina: un desarrollador (o Claude) que agregue un provider nuevo y olvide `@Inject()` reintroduce el mismo fallo silencioso. Revisar esto en cada PR que agregue providers a `apps/api`.
- Si en un hito futuro se decide adoptar Nest CLI + swc, este ADR queda superado y debe marcarse como tal.
