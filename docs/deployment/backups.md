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

Hoy la restauración es **manual y la hace un desarrollador**. No hay importador en
la interfaz: importar sobre datos existentes puede duplicar o pisar información, y
se decidió no construirlo hasta tener reglas claras de qué gana en cada conflicto.

El procedimiento, a grandes rasgos:

1. Levantar una base vacía y correr `pnpm db:deploy` para crear el esquema.
2. Insertar los registros del JSON respetando el orden de dependencias:
   organización → roles y usuarios → familias y alumnos → instalaciones →
   programas y niveles → grupos y horarios → sesiones → inscripciones → cobranza
   → asistencias → inventario.
3. Fijar contraseñas nuevas para cada usuario.
4. Verificar contra el archivo: número de alumnos, saldo total y último corte.

## Pendiente, y es importante

**La restauración no se ha probado.** La Sección 17 es tajante: _"No considerar un
backup válido hasta probar una restauración."_ Mientras eso no se haga, este
respaldo es una copia de la información, no una garantía de recuperación.

Lo que falta para cerrarlo:

- Un script de importación que recorra el JSON en orden de dependencias.
- Un ensayo completo: exportar producción, restaurar en una base limpia y cotejar.

## Alternativa a nivel de infraestructura

Railway ofrece respaldos del servicio de Postgres, independientes de esto. Cubren
el disco completo y sí permiten restaurar sin código, pero dependen de que la
cuenta siga existiendo. Conviene tener ambos: el de Railway para accidentes
técnicos, y este archivo para tener la información en la mano.
