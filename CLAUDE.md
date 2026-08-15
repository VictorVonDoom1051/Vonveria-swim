# CLAUDE.md — VonverIA Swim

**Versión de estas instrucciones:** 1.0.0  
**Fecha:** 4 de agosto de 2026  
**Estado:** Reglas permanentes del proyecto  

---

## 1. Tu función en este proyecto

Actúa como arquitecto de software, desarrollador senior, diseñador de producto, responsable de calidad y apoyo DevOps para **VonverIA Swim**, una aplicación profesional para administrar escuelas de natación.

Tu prioridad no es producir mucho código rápidamente. Tu prioridad es construir un producto:

- Correcto.
- Fácil de usar.
- Modular.
- Seguro.
- Verificable mediante pruebas.
- Fácil de mantener por otro desarrollador.
- Configurable y replicable para diferentes escuelas.
- Preparado para integraciones con hardware y servicios externos.

No dependas de memoria conversacional. Lee los documentos del repositorio antes de actuar.

---

## 2. Fuente de verdad y orden de autoridad

Antes de modificar código, consulta en este orden:

1. `docs/product/MASTER_SPEC.md`
2. Este archivo `CLAUDE.md`
3. `docs/decisions/`
4. `docs/architecture/`
5. `docs/testing/`
6. El código y las pruebas existentes.

Si dos fuentes se contradicen:

- No inventes una solución silenciosamente.
- Señala la contradicción.
- Propón la corrección mínima.
- Espera aprobación cuando cambie reglas de negocio, arquitectura, datos o alcance.

Los cambios importantes deberán actualizar documentación, `CHANGELOG.md` y, cuando corresponda, un ADR o RFC.

---

## 3. Principio de producto

### Completo sin ser complicado

“Completo” significa resolver los procesos esenciales de principio a fin. No significa mostrar decenas de opciones en cada pantalla.

Reglas obligatorias:

- Máximo seis secciones principales para dirección y recepción.
- Máximo tres secciones principales para instructores.
- Una acción primaria evidente por pantalla.
- Opciones avanzadas bajo demanda.
- Valores predeterminados razonables.
- Formularios cortos, agrupados y con lenguaje cotidiano.
- Tablas con columnas esenciales; detalles bajo demanda.
- Panel inicial orientado a tareas y excepciones.
- No agregar gráficas, tarjetas, filtros o botones solo para llenar espacio.
- Si una función no es frecuente ni reduce un riesgo, moverla a una fase posterior.

Antes de incorporar una función pregunta:

1. ¿Resuelve una tarea frecuente o un riesgo importante?
2. ¿La necesita un rol autorizado en la versión actual?
3. ¿Tiene un valor predeterminado sensato?
4. ¿Puede permanecer oculta hasta necesitarse?
5. ¿Su valor justifica la complejidad y las pruebas adicionales?

---

## 4. Usuarios de la primera versión

### Dirección

- Configura la escuela.
- Administra usuarios y permisos.
- Consulta operación, indicadores y finanzas.
- Autoriza correcciones sensibles.
- Consulta auditoría.

### Recepción

- Registra familias y alumnos.
- Gestiona inscripciones y cambios de grupo.
- Registra cargos, pagos y adeudos.
- Consulta clases y asistencia.
- No administra permisos ni elimina historial.

### Instructor

- Consulta únicamente sus clases y alumnos asignados.
- Registra asistencia.
- Registra notas autorizadas.
- Evalúa habilidades.
- Propone avance de nivel.
- No consulta información financiera.

El portal para tutores, alumnos y reservas públicas no forma parte de la primera versión funcional.

---

## 5. Navegación de la primera versión

### Dirección y recepción

1. Inicio.
2. Alumnos.
3. Clases.
4. Asistencia.
5. Pagos.
6. Más: instructores, evaluaciones, reportes y configuración.

### Instructor

1. Hoy.
2. Asistencia.
3. Evaluaciones.

### Inicio

Mostrar solamente:

- Clases del día.
- Alumnos activos.
- Pagos vencidos que requieren atención.
- Incidencias de asistencia o biométrico.
- Ocupación general resumida.
- Acciones rápidas: nuevo alumno, registrar pago y tomar asistencia.

---

## 6. Dirección visual

La interfaz debe ser moderna, limpia, profesional y relacionada con el entorno acuático, sin parecer infantil ni excesivamente corporativa.

- Fondos claros.
- Azul profundo como color de confianza.
- Turquesa como acento.
- Espacio visual generoso.
- Tipografía altamente legible.
- Bordes suaves y sombras discretas.
- Iconos simples acompañados de texto cuando exista ambigüedad.
- Estados consistentes para éxito, atención, deuda y error.
- Animaciones breves y funcionales.
- Diseño responsive para escritorio, tablet y móvil.
- Controles táctiles cómodos en la vista del instructor.
- Logotipo, nombre, colores y favicon configurables por escuela.

No codifiques colores o nombre de la escuela directamente dentro de componentes de negocio. Usa design tokens y configuración de organización.

---

## 7. Idioma y convenciones

- Interfaz, mensajes para usuarios y manual operativo: español.
- Documentación de producto y decisiones: español.
- Código, nombres de archivos, clases, funciones, variables, tablas y campos: inglés.
- Comentarios de código: solo cuando expliquen una decisión no evidente; preferentemente inglés técnico claro.
- Fechas visibles: formato adecuado para México.
- Moneda predeterminada: MXN, pero nunca asumir una sola moneda en el modelo.
- Zona horaria predeterminada del piloto: `America/Mexico_City`.

No uses abreviaturas ambiguas ni nombres genéricos como `data`, `item`, `thing`, `temp2` o `manager` sin contexto.

---

## 8. Arquitectura aprobada

Usa un monorepo TypeScript:

```text
apps/
  web/        # Next.js y React
  api/        # NestJS modular y API REST
  worker/     # tareas programadas y asíncronas cuando sean necesarias

packages/
  database/
  ui/
  auth/
  permissions/
  configuration/
  swimming-core/
  testing/

docs/
  product/
  architecture/
  decisions/
  deployment/
  testing/
  user-manual/
```

Tecnologías:

- Node.js en versión LTS fijada en el repositorio.
- TypeScript estricto.
- `pnpm` con versión fijada mediante `packageManager`.
- Next.js y React para frontend.
- NestJS para backend.
- PostgreSQL.
- Prisma para acceso a datos y migraciones.
- Tailwind y biblioteca interna de componentes.
- Docker para desarrollo y despliegue reproducible.
- Railway para staging y producción.
- Almacenamiento compatible con S3 para archivos.
- Redis/BullMQ solo cuando exista un caso real para colas o tareas.

Al inicializar el proyecto, utiliza versiones estables compatibles y registra las versiones exactas en archivos de bloqueo. Después no actualices dependencias principales sin una tarea explícita y pruebas completas.

No conviertas prematuramente el sistema en microservicios. Mantén un backend modular desplegable como una unidad, con un worker separado únicamente cuando sea necesario.

---

## 9. Modelo de instalaciones

- Un repositorio maestro.
- Una versión común del producto.
- Un proyecto Railway y una base PostgreSQL independiente por cliente al inicio.
- Todas las entidades empresariales incluyen `organizationId`.
- Personalización mediante configuración, no mediante forks del código.
- Funciones particulares mediante feature flags o módulos reutilizables.
- Nunca crear una rama permanente distinta por escuela.

Una solicitud especial debe resolverse en este orden:

1. Configuración existente.
2. Nuevo campo configurable.
3. Feature flag.
4. Módulo reutilizable.
5. RFC aprobado para cambiar el núcleo.

---

## 10. Límites de módulos

Separa claramente:

- Organization & Branding.
- Identity & Access.
- Families & Students.
- Facilities.
- Programs & Levels.
- Scheduling.
- Enrollments.
- Attendance.
- Billing.
- Assessments.
- Reporting.
- Notifications.
- Integrations.
- Audit.

Reglas:

- Evita dependencias circulares.
- No permitas que controladores contengan reglas de negocio.
- No permitas que componentes visuales calculen saldos, capacidad o permisos.
- Las reglas críticas viven en servicios de dominio y backend.
- Las integraciones externas dependen de interfaces internas, no al contrario.
- Cada módulo debe exponer contratos mínimos y explícitos.

---

## 11. Reglas de datos

- UUID para identificadores.
- `organizationId` en datos empresariales.
- `createdAt`, `updatedAt` y, cuando corresponda, `deletedAt`.
- Eliminación lógica para información con historial.
- Montos mediante tipo decimal; nunca `float`.
- Moneda explícita.
- Fechas almacenadas consistentemente y convertidas a la zona horaria de la organización.
- Estados mediante enums o catálogos controlados.
- Restricciones y claves únicas para prevenir duplicados.
- Auditoría de pagos, permisos, bajas, cambios de grupo y correcciones de asistencia.
- Archivos almacenados fuera del disco efímero; la base guarda metadatos y referencias.
- Información sensible limitada por rol y finalidad.

Nunca mantengas como campo editable un saldo que pueda calcularse desde movimientos confiables.

---

## 12. Reglas financieras

La primera versión soporta:

- Mensualidades.
- Paquetes de clases.
- Clases individuales.
- Inscripción.
- Otros cargos configurables.

Principios:

- `Charge` representa una obligación.
- `Payment` representa dinero recibido.
- `PaymentAllocation` relaciona un pago con uno o varios cargos.
- `Adjustment` registra descuentos o correcciones autorizadas.
- `Refund` registra devoluciones.
- Nunca modificar o borrar silenciosamente un movimiento financiero.
- Pagos parciales deben conservar saldo y trazabilidad.
- Toda operación sensible usa transacción de base de datos.
- Creación de cargos y recepción de pagos requieren clave de idempotencia.
- Los reportes se calculan desde movimientos, no desde totales manuales.
- No integrar una pasarela de pago real en la primera versión.

Incluye pruebas para pagos parciales, pagos excedentes, duplicados, cancelaciones, descuentos, devoluciones y concurrencia.

---

## 13. Reglas de clases e inscripciones

- Un grupo pertenece a programa, nivel, sucursal, alberca y horario.
- Puede utilizar uno o varios carriles según diseño aprobado posteriormente.
- Tiene capacidad explícita.
- No permitir sobrecupo salvo autorización registrada.
- No permitir superposición de instructor, carril o recurso.
- Los cierres y vacaciones afectan sesiones; no destruyen historial.
- Cambios de grupo conservan historial de inscripción.
- Una inscripción activa define modalidad de cobro y fecha de inicio.
- Validar capacidad nuevamente dentro de la transacción final.

---

## 14. Asistencia e integración Hikvision

La asistencia deberá funcionar sin hardware mediante adaptadores:

```text
AttendanceProvider
├── ManualAttendanceAdapter
├── HikvisionSimulatorAdapter
└── HikvisionIsapiAdapter      # fase posterior
```

Formato interno mínimo del evento:

- `externalPersonId`.
- `deviceId`.
- `occurredAt`.
- `authenticationMethod`.
- `externalEventId`.
- `synchronizationStatus`.

Reglas:

- `externalEventId` debe ser único por proveedor/dispositivo.
- Un evento repetido no puede duplicar asistencia.
- Vincular evento con alumno mediante identificador externo.
- Buscar sesiones compatibles por sucursal y ventana de tiempo.
- Coincidencia única: registrar asistencia.
- Cero o varias coincidencias: enviar a revisión.
- Conservar referencia entre asistencia y evento.
- Permitir registro manual y corrección auditada.
- No almacenar huellas ni plantillas faciales en la base de la aplicación.
- El conector real deberá tolerar falta de internet y reenviar eventos pendientes.

No implementes el adaptador real de Hikvision hasta conocer modelo, firmware y documentación ISAPI correspondiente.

---

## 15. Seguridad y privacidad

- Autorización real en backend; ocultar un botón no es seguridad.
- RBAC basado en capacidades.
- Contraseñas con algoritmo de hash adecuado mediante una biblioteca mantenida.
- Cookies/sesiones seguras y protección CSRF cuando aplique.
- Rate limiting en autenticación y endpoints sensibles.
- Validación de entrada en todos los límites del sistema.
- CORS restringido por entorno.
- Secretos únicamente en variables de entorno.
- Nunca registrar contraseñas, tokens, biometría ni datos sensibles completos en logs.
- Auditoría con actor, acción, fecha, organización, entidad afectada y motivo cuando corresponda.
- Principio de mínimo privilegio.
- Recuperación de acceso segura.
- Separación estricta entre datos de organizaciones.

Los datos pertenecen con frecuencia a menores. Diseña con minimización, consentimiento, control de acceso y retención configurable.

---

## 16. API y contratos

- API REST versionada.
- DTOs y validación explícita.
- Respuestas de error consistentes con código interno rastreable.
- Paginación para colecciones.
- Filtros y ordenamiento permitidos mediante listas controladas.
- No exponer modelos Prisma directamente como contrato público.
- Idempotencia en operaciones financieras, importaciones y eventos externos.
- Documentar endpoints mediante OpenAPI.
- Mantener compatibilidad hacia atrás dentro de una versión principal.

---

## 17. Migraciones y protección de datos

Prohibido ejecutar en una base con datos importantes sin aprobación explícita:

- `prisma migrate reset`.
- `prisma db push --force-reset`.
- `DROP DATABASE`.
- `DROP SCHEMA`.
- Borrados masivos.
- Migraciones destructivas no revisadas.

Reglas:

- Desarrollo, staging y producción separados.
- Migraciones versionadas en Git.
- Usar `prisma migrate deploy` en staging y producción.
- Preferir cambios compatibles: agregar, poblar, migrar consumidores y retirar después.
- Respaldar antes de migraciones importantes.
- Probar migraciones con una copia representativa.
- Documentar rollback o recuperación.
- No considerar un backup válido hasta probar una restauración.

---

## 18. Errores, logs y observabilidad

- No ocultar excepciones.
- Mensaje amigable para usuario e identificador técnico para soporte.
- Logs estructurados con nivel, módulo, solicitud y contexto seguro.
- Correlation ID por petición.
- Health y readiness endpoints.
- Métricas para errores, tiempos de respuesta, tareas y eventos pendientes.
- Alertas para fallos de despliegue, errores repetidos y sincronización detenida.
- No mostrar trazas internas al usuario final.

---

## 19. Pruebas obligatorias

Cada módulo incluirá según corresponda:

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas end-to-end para procesos críticos.
- Pruebas de permisos.
- Pruebas de aislamiento por organización.
- Pruebas de idempotencia.
- Pruebas de concurrencia en capacidad, cargos, pagos y asistencia.
- Pruebas de migración.
- Pruebas de importación.
- Pruebas responsive básicas.

Flujos críticos mínimos:

1. Crear familia y varios alumnos.
2. Inscribir sin exceder capacidad.
3. Cambiar de grupo conservando historial.
4. Generar mensualidad.
5. Vender y consumir paquete.
6. Registrar clase individual y otros cargos.
7. Aplicar pagos parciales y completos.
8. Evitar duplicados.
9. Tomar asistencia manual.
10. Procesar evento Hikvision simulado.
11. Rechazar evento biométrico duplicado.
12. Restringir operaciones por rol.
13. Actualizar sin perder datos.
14. Restaurar respaldo en un entorno controlado.

No declares terminada una tarea si no ejecutaste las pruebas pertinentes o explicaste claramente por qué no pudieron ejecutarse.

---

## 20. Flujo de trabajo para cada tarea

Antes de escribir código:

1. Lee este archivo y la especificación relacionada.
2. Inspecciona el estado del repositorio.
3. Identifica módulos afectados.
4. Presenta un plan corto.
5. Señala migraciones, riesgos o decisiones necesarias.

Durante la implementación:

- Cambios pequeños y enfocados.
- No reescribir áreas no relacionadas.
- No borrar modificaciones existentes del usuario.
- No agregar dependencias sin justificar su necesidad.
- No copiar secretos a archivos.
- No usar datos reales de alumnos en pruebas.
- Mantener compatibilidad con Windows para desarrollo y Docker/Railway para despliegue.

Después de implementar:

1. Ejecuta formato, lint, tipos y pruebas.
2. Revisa el diff.
3. Actualiza documentación y `CHANGELOG.md` cuando aplique.
4. Resume qué cambió.
5. Indica cómo probarlo manualmente.
6. Reporta riesgos o pendientes reales, sin ocultarlos.

---

## 21. Git y versiones

- `main`: versión estable.
- `develop`: integración de trabajo aprobado.
- Ramas cortas por función o corrección.
- Commits pequeños y descriptivos.
- SemVer para versiones del producto.
- `CHANGELOG.md` obligatorio.
- ADR para decisiones arquitectónicas.
- RFC para cambios grandes de producto o datos.
- Releases primero en staging y después progresivamente en clientes.
- Nunca hacer force push o reescribir historia sin autorización explícita.

---

## 22. Alcance autorizado por hitos

No desarrolles toda la aplicación en una sola instrucción. Trabaja por hitos y detente al completar cada uno para revisión.

### M0 — Fundación

- Monorepo y herramientas.
- Aplicaciones `web` y `api` funcionales.
- `worker` preparado sin infraestructura innecesaria.
- PostgreSQL local mediante Docker.
- Prisma y primera migración segura.
- Variables de entorno de ejemplo.
- Health checks.
- Lint, formato, tipos y pruebas mínimas.
- CI básico.
- Documentación para iniciar en Windows.
- Página inicial temporal que demuestre el sistema visual.

### M1 — Organización, acceso y diseño

- Organización y branding.
- Autenticación.
- Roles y capacidades.
- Layout responsive.
- Navegación por rol.
- Auditoría base.

### M2 — Familias, alumnos, instalaciones y clases

- Familias y tutores.
- Alumnos.
- Sucursales, albercas y carriles.
- Programas, niveles y habilidades.
- Grupos, sesiones e inscripciones.
- Capacidad y conflictos.

### M3 — Cobranza

- Cargos.
- Mensualidades.
- Paquetes.
- Clases individuales.
- Pagos y asignaciones.
- Ajustes, devoluciones y recibos.
- Corte y reportes esenciales.

### M4 — Asistencia

- Asistencia manual.
- Cierre y correcciones autorizadas.
- Interfaz `AttendanceProvider`.
- Simulador Hikvision.
- Revisión de eventos ambiguos.

### M5 — Evaluaciones y reportes

- Evaluación de habilidades.
- Propuesta y aprobación de nivel.
- Reportes esenciales de operación.
- Datos de piloto y pruebas ampliadas.

### M6 — Preparación comercial

- Plantilla de despliegue.
- Configuración por escuela.
- Staging y producción.
- Backups y restauración probada.
- Monitoreo.
- Documentación de soporte.
- Prueba piloto completa.

El adaptador Hikvision real, portal familiar, pagos en línea, WhatsApp, CFDI, aplicación móvil nativa, inventario y control físico de acceso quedan fuera de estos hitos hasta una aprobación posterior.

---

## 23. Regla de parada

Detente y solicita decisión antes de:

- Cambiar el stack aprobado.
- Modificar reglas financieras.
- Alterar el modelo de permisos.
- Agregar una integración externa real.
- Incorporar una función fuera del hito actual.
- Ejecutar una migración destructiva.
- Cambiar el modelo de despliegue por cliente.
- Exponer datos sensibles.
- Agregar costos recurrentes o servicios de pago.

Si falta una decisión menor, utiliza una suposición conservadora, documenta la suposición y continúa solo si es fácil de revertir.

---

## 24. Primera instrucción al abrir el proyecto

Cuando este archivo aparezca por primera vez en un repositorio vacío:

1. No programes todavía todos los módulos.
2. Verifica que exista `docs/product/MASTER_SPEC.md`.
3. Resume el alcance y detecta contradicciones.
4. Propón el plan exacto para M0.
5. Presenta estructura, comandos, versiones y criterios de aceptación.
6. Espera aprobación antes de generar el repositorio completo.

Cuando M0 sea aprobado, crea únicamente la fundación y demuestra que todos los comandos funcionan.
