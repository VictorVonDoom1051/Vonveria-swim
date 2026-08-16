# 0003 — Anualidad obligatoria al inscribir

- **Fecha:** 16 de agosto de 2026
- **Estado:** Aceptada
- **Ámbito:** Reglas financieras (`CLAUDE.md` §12) y de inscripciones (§13)

## Contexto

La escuela cobra una anualidad a cada alumno, obligatoria al inscribir y renovable
cada año. Antes de esto solo existía un cargo de "Inscripción" **opcional**, que se
tecleaba a mano en cada alta, y nada que se renovara solo.

Cambiar reglas financieras requiere aprobación explícita (§23). La dirección la pidió
y aprobó el plan.

## Decisión

**Se suman dos cobros distintos**, no se sustituyen:

- **Inscripción:** una sola vez en la vida del alumno.
- **Anualidad:** cada año, en el aniversario de la fecha de inicio — no en enero.
  Una familia que entra en agosto renueva en agosto.

Ambas se aplican en el backend. Que la interfaz oculte un campo no es la regla:
`createEnrollmentCharges` revisa el historial de cargos del alumno antes de generar
nada, así que una petición que traiga el monto de inscripción de un alumno que ya la
pagó **no** produce un segundo cargo.

## Por qué `periodMonth = 0`

La mensualidad es idempotente gracias a `@@unique([enrollmentId, periodYear,
periodMonth])` en `Charge`. Guardar la anualidad con `periodMonth` nulo parecía lo
natural, pero **en Postgres dos `NULL` no se consideran iguales**: esa restricción no
impediría insertar dos anualidades del mismo año, y el trabajo del worker duplicaría
cobros en cuanto corriera dos veces.

El mes cero no existe en un calendario, así que no puede chocar con ninguna
mensualidad real y la restricción sí protege.

## Por qué es por alumno y no por inscripción

La restricción única anterior es **por inscripción**. Eso no alcanza: hoy una
inscripción no se puede cerrar, así que un cambio de nivel deja al alumno inscrito en
dos grupos a la vez, y cada inscripción generaría su propia anualidad del mismo año.

Se verifica explícitamente contra los cargos del alumno, tanto al inscribir como en el
trabajo del worker. La restricción única sigue cubriendo la carrera entre dos corridas
simultáneas.

Esto se detectó probando el asistente en el navegador, no en las pruebas: el primer
alumno inscrito en dos grupos apareció con dos "Anualidad 2026".

## Montos por omisión

`Organization` guarda `defaultAnnualFee` y `defaultEnrollmentFee`, que el asistente
prellena. Existen porque "obligatoria" tiene que ser confiable: si recepción teclea la
anualidad de memoria en cada alta, un dedazo se convierte en un cargo equivocado.

Se exponen por `GET /enrollments/defaults` (capacidad `students:manage`) y no por
`GET /organization` (capacidad `organization:manage`), porque recepción es justamente
quien inscribe y no administra la organización.

## Consecuencias

- Migración `20260816162245_add_annual_fee`, puramente aditiva.
- Las inscripciones anteriores a este cambio quedan con `annualFeeAmount` nulo y el
  worker **las ignora**, en vez de inventarles un monto. Dirección decide si las
  actualiza.
- `createEnrollment` también exige anualidad, para no dejar un camino que la evada.

## Lo que este cambio no resuelve

Sigue sin poderse dar de baja, congelar ni transferir una inscripción. Un alumno que
se va queda `ACTIVE` y el worker le seguirá generando mensualidades —y ahora también
anualidades— indefinidamente. Es el riesgo abierto más grande para las pruebas en
equipo.
