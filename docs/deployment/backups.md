# Respaldos

## Qué hay hoy

Dirección puede descargar, desde **Más → Respaldos**:

- **Respaldo completo** (`respaldo-vonveria-AAAA-MM-DD.json`): toda la escuela en
  un archivo — organización, usuarios, familias, alumnos, instalaciones,
  programas, grupos, horarios, sesiones, inscripciones, cargos, pagos, ajustes,
  devoluciones, paquetes, cortes de caja, asistencias, productos, movimientos de
  inventario y ventas.
- **Listados en CSV**: alumnos, pagos, asistencias e inventario. Abren directo en
  Excel y sirven para consultar o imprimir.

## Qué NO incluye el respaldo

**Contraseñas.** Se excluye `passwordHash` a propósito: un archivo que viaja por
correo o queda en un disco no debe cargar credenciales (Sección 15 de
`CLAUDE.md`). Al restaurar, cada usuario necesita una contraseña nueva.

Tampoco incluye la bitácora de auditoría, que crece sin límite y no es necesaria
para reconstruir la operación.

## Cada cuándo

Semanal mientras la escuela sea pequeña, y **siempre antes de una migración**
importante. La Sección 17 lo pide explícitamente: respaldar antes de migraciones.

Guardarlo fuera de Railway. Un respaldo que vive en el mismo lugar que la base no
protege del escenario que más importa: perder ese lugar.

## Cómo se restaura

La restauración la ejecuta **el fabricante**, no el cliente. Es una operación de
emergencia y por eso vive como comando y no como botón: un control capaz de
sobrescribir la escuela entera no debe estar en la misma pantalla que se usa a
diario.

```bash
# 1. Base vacía con el esquema al día
DATABASE_URL="postgresql://..." pnpm --filter @vonveria-swim/database exec prisma migrate deploy

# 2. Restaurar
DATABASE_URL="postgresql://..." ADMIN_EMAIL="direccion@escuela.mx" ADMIN_PASSWORD="una-contrasena-nueva"   pnpm db:import respaldo-vonveria-2026-08-16.json
```

Antes de escribir nada imprime a qué base va y qué trae el archivo. Al terminar
lista cuántos registros insertó de cada tipo.

**Todo ocurre en una sola transacción.** Si algo falla, no queda una escuela a
medio restaurar.

### Si la escuela ya existe

El comando **se detiene**. Para reemplazarla hay que ser explícito:

```bash
pnpm db:import archivo.json --replace --yes
```

Eso borra la escuela existente antes de restaurar. Las dos banderas son
deliberadas: la Sección 17 exige aprobación explícita para una operación
destructiva, y una sola es fácil de teclear por inercia.

### Contraseñas después de restaurar

El archivo no las trae. Al importar:

- El usuario cuyo correo coincide con `ADMIN_EMAIL` recibe `ADMIN_PASSWORD`.
- **Los demás quedan sin poder entrar**, con un hash que no corresponde a ninguna
  contraseña. Dirección se las restablece desde Configuración → Usuarios.

## Está probada

`apps/api/src/backup/restore-roundtrip.spec.ts` crea una escuela con datos de cada
módulo, la exporta, **la borra por completo**, la importa y coteja: alumnos con
acentos, el carril del grupo, cargo y su asignación, totales del corte,
existencias, asistencia, evaluación, capacidades de los roles, que la contraseña
anterior ya no sirva, que importar dos veces se detenga y que `--replace` no
duplique.

Corre en cada `pnpm test`, así que la restauración se verifica continuamente en
vez de ser un ritual que se hace una vez y se olvida.

Además se ensayó a mano con datos reales: se bajó el respaldo de producción, se
restauró en una base limpia y se cotejaron los 3 alumnos, la Clase 9-10AM en
Carril 1, el corte de $1,790 en efectivo y $260 en tarjeta, las existencias de la
tienda y las 11 capacidades de Dirección.

### Tres fallas que encontró esa prueba

Vale la pena dejarlas escritas, porque ninguna se veía al exportar:

1. **Faltaba el catálogo de permisos.** `Permission` es global, no por escuela.
   Sin él, los roles restaurados quedaban **sin capacidades** y nadie podía hacer
   nada al entrar.
2. **Faltaban las evaluaciones**, que se agregaron en la misma entrega que el
   respaldo y nunca entraron a la exportación.
3. **Revertir una falta dejaba la nota pegada**, así que había registros que decían
   "Presente" con el motivo de una ausencia deshecha, y así salían impresos.

Por eso `formatVersion` es 2. Un respaldo versión 1 ya no se puede importar: el
comando se detiene en lugar de restaurar algo incompleto.

## Alternativa a nivel de infraestructura

Railway ofrece respaldos del servicio de Postgres, independientes de esto. Cubren
el disco completo y sí permiten restaurar sin código, pero dependen de que la
cuenta siga existiendo. Conviene tener ambos: el de Railway para accidentes
técnicos, y este archivo para tener la información en la mano.
