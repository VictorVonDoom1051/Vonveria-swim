# VonverIA Swim — Especificación maestra del producto

**Versión:** 1.0.0  
**Fecha:** 14 de agosto de 2026  
**Estado:** Línea base aprobada para desarrollo por hitos  
**Producto:** Nombre provisional; el nombre comercial se decidirá después  
**Objetivo:** Construir con código y Claude una plataforma profesional, configurable y replicable para escuelas de natación.

---

## 1. Propósito del documento

Este documento será la fuente inicial de verdad para el producto. Reúne:

- Investigación de soluciones existentes.
- Patrones funcionales comunes del mercado.
- Oportunidades para México y Latinoamérica.
- Alcance funcional preliminar.
- Arquitectura técnica propuesta.
- Estrategia de personalización, clonación, actualizaciones y pruebas.
- Decisiones pendientes que deberán validarse con una escuela piloto.

Esta versión 1.0.0 autoriza planificar e implementar el producto únicamente por los hitos definidos en `CLAUDE.md`, comenzando por M0. No autoriza desarrollar todos los módulos a la vez ni omitir las revisiones entre hitos.

---

## 2. Investigación del mercado

### Plataformas analizadas

| Plataforma | Enfoque y funciones observadas | Aprendizaje para VonverIA Swim |
| --- | --- | --- |
| [Jackrabbit Swim](https://www.jackrabbitclass.com/swim/) | Inscripción, horarios, facturación automatizada, autoservicio de asistencia, ausencias, reposiciones, comunicación con familias y panel de indicadores. | Las reposiciones y la experiencia familiar son procesos centrales, no complementos. |
| [iClassPro](https://www.iclasspro.com/swim-software-features) | Gestión de clases, asistencia, evaluaciones de habilidades, personal, kiosco de entrada, exenciones, portal familiar, pagos y punto de venta. | Debemos separar el trabajo de recepción, instructores y familias mediante vistas especializadas. |
| [Udio](https://www.udiosystems.com/features) | Reservas, pagos recurrentes, mensajes automáticos, niveles, ausencias, reposiciones, evaluaciones y reportes para padres. | Las automatizaciones deben reaccionar a eventos reales: falta, pago rechazado, avance y cambio de clase. |
| [Swimphony](https://swimphony.com/swim-school-software/) | Reservas, membresías, listas de espera, pagos automatizados, evaluación, comunicación, portal de padres, aplicación para instructores y reportes. | El instructor necesita una experiencia móvil simple para trabajar junto a la alberca. |
| [Sportimea](https://www.sportimea.com/en-us/solutions/swim) | Horarios, pagos, portal familiar con marca, reinscripciones automáticas, registros digitales, integraciones contables y reportes en tiempo real. | La retención y reinscripción deben contemplarse desde el modelo de datos. |
| [Membrix](https://membrix.mx/software-para-escuelas-de-natacion) | Propuesta mexicana centrada en niveles, grupos, mensualidades, asistencia, tutores, recordatorios y exportación. | Existe demanda local por una solución simple en MXN; VonverIA deberá diferenciarse por profundidad operativa y personalización. |
| [Nadación.com](https://www.nadacion.com/) | Solución enfocada en México con horarios, estudiantes, pagos, exenciones y paquetes. Publica una tarifa fija por escuela. | El mercado mexicano ya tiene opciones especializadas; no bastará con digitalizar Excel. |
| [ABC Evo](https://softwareparagimnasio.com/software-para-escuelas-de-natacion/) | Grupos, niveles, asistencia, control de acceso, CRM, WhatsApp, ventas, cobros recurrentes, reportes y múltiples unidades. | Integraciones, control de acceso y operación multisucursal pueden convertirse en módulos premium. |

### Referencia de precios publicada al 3 de agosto de 2026

Los precios pueden cambiar y solo sirven para entender el posicionamiento del mercado:

- [Jackrabbit](https://www.jackrabbitclass.com/pricing/) publica planes desde **USD 49 al mes**, según número de alumnos; su opción con aplicación de marca comienza en USD 93 al mes más configuración.
- [iClassPro](https://www.iclasspro.com/iclasspro-pricing) publica planes de **USD 139, 199 y 299 al mes por ubicación**; la aplicación de marca aparece como complemento.
- [Membrix](https://membrix.mx/software-para-escuelas-de-natacion) publica un plan Pro desde **MXN 799 al mes**.
- [Nadación.com](https://www.nadacion.com/) publica una opción de software de **MXN 1,500 al mes por escuela**.

El precio de VonverIA Swim no se definirá hasta conocer costos de infraestructura, soporte, pagos, mensajería y alcance final.

---

## 3. Conclusiones de la investigación

### 3.1 El núcleo real del producto

Una escuela de natación no se administra correctamente solo con alumnos, horarios y pagos. El núcleo debe resolver:

1. Ocupación por sucursal, alberca, carril, horario, nivel e instructor.
2. Relación familiar: un tutor puede administrar varios alumnos.
3. Inscripción y permanencia del alumno en un grupo.
4. Asistencia por sesión, no únicamente por mensualidad.
5. Ausencias, justificaciones, créditos y clases de reposición.
6. Evaluación por habilidades y avance de nivel.
7. Cobros, vencimientos, pagos parciales, descuentos y adeudos.
8. Comunicación automática con tutores y alumnos.
9. Operación móvil rápida para instructores.
10. Indicadores de ocupación, retención, morosidad e ingresos.

### 3.2 Diferenciadores potenciales para México y Latinoamérica

Estos elementos deberán validarse antes de convertirse en requisitos definitivos:

- Interfaz completamente en español.
- Importes y reportes en MXN.
- Registro claro de efectivo, transferencia y pago en línea.
- Recordatorios e interacción mediante WhatsApp.
- Personalización completa con la marca de cada escuela.
- Importación inicial desde Excel.
- Reportes administrativos comprensibles sin capacitación técnica.
- Posible integración futura con facturación mexicana.
- Soporte para escuelas pequeñas que después crezcan a varias sucursales.

### 3.3 Principio de experiencia de usuario

Cada rol debe ver únicamente lo necesario para su trabajo:

- **Dirección:** indicadores, finanzas, ocupación y configuración.
- **Administración/recepción:** inscripciones, cambios, pagos, adeudos y atención a familias.
- **Instructor:** clases del día, asistencia, alertas importantes y evaluaciones.
- **Tutor/alumno:** horarios, pagos, ausencias, reposiciones, progreso y avisos.

No se construirá un panel gigante con todas las funciones mezcladas.

### 3.4 Principio de producto: completo sin ser complicado

“Completo” significará que los procesos esenciales pueden terminarse correctamente de principio a fin. No significará ofrecer decenas de variantes, configuraciones o botones visibles en cada pantalla.

La aplicación deberá sentirse sencilla desde el primer acceso:

- Máximo seis secciones principales de navegación.
- Una acción primaria evidente por pantalla.
- Funciones avanzadas ocultas hasta que sean necesarias.
- Valores predeterminados útiles para reducir configuración.
- Formularios divididos en bloques cortos y comprensibles.
- Lenguaje cotidiano; evitar términos técnicos y administrativos innecesarios.
- Búsqueda rápida antes de agregar filtros complejos.
- Tablas con columnas esenciales y detalles bajo demanda.
- Panel de inicio orientado a tareas y excepciones, no a llenar espacio con gráficas.
- Misma interacción para acciones equivalentes en todo el sistema.
- Diseño responsive con controles cómodos para tablet y móvil.

### 3.5 Dirección visual inicial

El diseño predeterminado será moderno, limpio y relacionado con el entorno acuático, sin apariencia infantil ni corporativa pesada:

- Fondos claros y amplio espacio visual.
- Azul profundo como color de confianza.
- Turquesa como acento principal.
- Colores de estado consistentes para éxito, atención, deuda y error.
- Tipografía legible y jerarquías claras.
- Tarjetas únicamente cuando agrupen información útil.
- Bordes suaves y sombras discretas.
- Iconos simples acompañados de texto cuando una acción pueda ser ambigua.
- Animaciones breves con función informativa, nunca decorativas en exceso.
- Marca, colores y logotipo reemplazables desde configuración.

### 3.6 Presupuesto de complejidad

Antes de incorporar una función al producto se evaluará:

1. ¿Resuelve una tarea frecuente o un riesgo importante?
2. ¿La necesita alguno de los roles iniciales?
3. ¿Puede tener una configuración predeterminada razonable?
4. ¿Puede colocarse en un nivel secundario si se usa ocasionalmente?
5. ¿Complica pantallas y pruebas más de lo que mejora la operación?

Si una función no supera esta evaluación, se moverá a una fase posterior o a un módulo opcional.

---

## 4. Modelo comercial y de despliegue

### Decisión inicial

Se utilizará **un repositorio maestro con instalaciones independientes**.

- Cada cliente tendrá su propio proyecto en Railway.
- Cada cliente tendrá su propia base PostgreSQL.
- Todas las instalaciones usarán el mismo núcleo versionado.
- La marca y reglas del cliente se definirán mediante configuración.
- No se crearán versiones de código personalizadas por cliente.
- Las funciones especiales se resolverán con módulos o feature flags.

Aunque inicialmente las bases estén separadas, las entidades principales incluirán `organization_id`. Esto conserva una ruta futura hacia una modalidad multiempresa sin reconstruir el sistema.

### Personalización permitida sin modificar código

- Nombre comercial, logotipo, favicon y colores.
- Dominio, datos de contacto y zona horaria.
- Nombre utilizado para alumnos, grupos, niveles y conceptos.
- Niveles, habilidades y criterios de avance.
- Albercas, carriles, capacidades y horarios.
- Formas y reglas de pago.
- Formato de recibos y certificados.
- Plantillas de correo y mensajes.
- Campos adicionales autorizados.
- Módulos activos por plan contratado.

### Regla de mantenimiento

Una solicitud particular nunca modificará directamente el núcleo de una sola instalación. Deberá resolverse de una de estas maneras:

1. Configuración existente.
2. Nuevo campo configurable.
3. Feature flag.
4. Módulo reutilizable.
5. RFC para modificar el producto completo.

---

## 4.1 Definición del primer piloto

### Decisiones confirmadas

- La primera instalación será una **escuela piloto simulada**.
- Los usuarios operativos de la primera versión serán **dirección, recepción e instructores**.
- El portal para padres, tutores y alumnos no formará parte de la primera versión funcional, pero el modelo de datos quedará preparado para incorporarlo.
- El sistema financiero deberá soportar desde el inicio:
  - Mensualidades.
  - Paquetes de clases.
  - Clases individuales.
  - Inscripción.
  - Otros cargos configurables.
- La asistencia deberá funcionar manualmente y mediante un **simulador de eventos Hikvision** antes de conectar hardware real.

### Escuela ficticia de prueba

Los siguientes datos son un escenario de pruebas y no representan límites comerciales:

| Elemento | Volumen simulado |
| --- | ---: |
| Organización | 1 |
| Sucursales | 1 |
| Albercas | 2 |
| Carriles | 8 en total |
| Familias | 220 |
| Alumnos | 300 |
| Dirección | 2 usuarios |
| Recepción | 3 usuarios |
| Instructores | 12 usuarios |
| Niveles | 8 |
| Habilidades evaluables | 40 |
| Grupos activos | 48 |
| Sesiones semanales | 120 |

Se generará también una carga ampliada de pruebas con al menos diez veces estos volúmenes para validar consultas, reportes y concurrencia.

### Modalidades financieras del piloto

1. **Mensualidad:** cargo recurrente asociado a la inscripción activa y frecuencia semanal.
2. **Paquete:** saldo de 4, 8 o 12 clases con vigencia y consumo por asistencia.
3. **Clase individual:** cargo por una sesión específica.
4. **Inscripción:** cargo único configurable por ciclo o alta.
5. **Otros cargos:** catálogo configurable para uniforme, evaluación, credencial, evento u otro concepto.

El piloto registrará inicialmente pagos en efectivo, transferencia y tarjeta como métodos administrativos. La conexión con una pasarela bancaria se realizará en una fase posterior y no se simulará como un cobro real.

### Asistencia y biométrico simulado

El módulo de asistencia utilizará una interfaz desacoplada:

```text
AttendanceProvider
├── ManualAttendanceAdapter
├── HikvisionSimulatorAdapter
└── HikvisionIsapiAdapter (integración posterior con hardware real)
```

El simulador deberá producir eventos con el mismo formato interno esperado del conector real:

- Identificador externo de persona.
- Identificador del dispositivo.
- Fecha y hora del evento.
- Tipo de autenticación.
- Identificador único del evento.
- Estado de sincronización.

El motor deberá vincular el evento con un alumno, detectar la sesión compatible, ignorar duplicados y dejar en revisión los eventos ambiguos. No se almacenarán plantillas faciales ni huellas en la base de la aplicación.

### Criterios de éxito del piloto simulado

1. Dirección puede configurar la escuela y consultar indicadores.
2. Recepción puede registrar familias, alumnos, grupos, cobros y pagos.
3. Un instructor solo puede consultar sus grupos y registrar asistencia o evaluaciones autorizadas.
4. El sistema impide exceder la capacidad de un grupo o carril.
5. Los cuatro modelos de cobro generan saldos correctos.
6. Los pagos parciales y completos se asignan sin duplicidad.
7. La asistencia manual y simulada producen el mismo resultado final.
8. Los eventos biométricos repetidos no duplican asistencia.
9. Todos los cambios financieros y de asistencia sensibles quedan auditados.
10. Una actualización de versión conserva alumnos, inscripciones, pagos y asistencias.

---

## 5. Alcance funcional preliminar

### Fase 0 — Fundamentos del producto

- Configuración de organización y sucursales.
- Branding dinámico.
- Usuarios, autenticación, recuperación de acceso y sesiones.
- Roles y permisos aplicados en backend.
- Registro de auditoría.
- Importación y exportación de datos.
- Datos de demostración.
- Manejo de archivos.
- Notificaciones internas.

### Fase 1 — Operación esencial

- Familias y tutores.
- Alumnos y contactos de emergencia.
- Información médica relevante y documentos autorizados.
- Instructores y disponibilidad.
- Sucursales, albercas y carriles.
- Niveles y habilidades.
- Tipos de programa: grupal, individual, bebés, adultos u otros configurables.
- Grupos, horarios, capacidad e instructor asignado.
- Inscripciones, cambios de grupo, bajas y congelamientos.
- Generación de sesiones de clase.
- Asistencia móvil por sesión.
- Historial completo del alumno.

### Fase 2 — Administración financiera

- Conceptos de cobro.
- Inscripción, mensualidad, paquete o pago por clase.
- Cargos, vencimientos y adeudos.
- Pagos en efectivo, transferencia y otros medios configurables.
- Pagos parciales, descuentos, becas y cortesías.
- Recibos y comprobantes.
- Cancelaciones y devoluciones controladas.
- Corte de caja.
- Reportes de ingresos, adeudos y morosidad.
- Auditoría de cualquier cambio financiero.

### Fase 3 — Operación especializada de natación

- Ausencia informada y no informada.
- Políticas configurables de reposición.
- Créditos de reposición con vigencia.
- Búsqueda de lugares compatibles por nivel, sede y capacidad.
- Lista de espera.
- Matriz de habilidades por nivel.
- Evaluaciones y notas del instructor.
- Historial de progreso.
- Promoción de nivel y sugerencia de nuevo grupo.
- Certificados digitales.

### Fase 4 — Portal familiar y automatizaciones

- Portal para tutor y alumno adulto.
- Consulta de horarios, pagos, asistencia y progreso.
- Solicitud de ausencia y reposición.
- Inscripción o reinscripción en línea.
- Pago en línea.
- Avisos por correo y WhatsApp.
- Mensajes por cancelación de clase, deuda, cupo disponible o avance.
- Consentimientos y aceptación de reglamentos.

### Fase 5 — Escalamiento y módulos premium

- Varias sucursales.
- Panel ejecutivo consolidado.
- Inventario y punto de venta.
- Comisiones o pagos a instructores.
- Control de acceso y check-in.
- Aplicación móvil nativa.
- API e integraciones externas.
- Facturación mexicana, si se valida su necesidad.
- CRM comercial y seguimiento de prospectos.
- Programa de fidelización.

---

## 6. Modelo de datos preliminar

| Área | Entidades principales |
| --- | --- |
| Organización | Organization, Branch, BrandingSettings, BusinessSettings, FeatureFlag |
| Seguridad | User, Role, Permission, UserRole, Session, AuditLog |
| Instalaciones | Pool, Lane, FacilityClosure |
| Personas | Family, Guardian, Student, EmergencyContact, MedicalAlert, Document, Consent |
| Formación | Level, Skill, LevelSkill, Assessment, AssessmentResult, Promotion |
| Programación | Program, Group, ScheduleRule, ClassSession, InstructorAssignment |
| Inscripción | Enrollment, EnrollmentStatusHistory, WaitlistEntry, FreezePeriod |
| Asistencia | Attendance, AbsenceRequest, MakeupPolicy, MakeupCredit, MakeupBooking |
| Finanzas | Charge, ChargeItem, Payment, PaymentAllocation, Discount, Refund, Receipt, CashClosing |
| Comunicación | Notification, MessageTemplate, DeliveryAttempt, Announcement |

### Reglas de datos desde el inicio

- UUID como identificadores.
- `organization_id` en información empresarial.
- Fechas de creación y actualización.
- Eliminación lógica donde se necesite conservar historial.
- Estados mediante catálogos controlados.
- Montos guardados con precisión decimal y moneda explícita.
- Auditoría obligatoria en pagos, permisos, bajas y cambios de grupo.
- Restricciones de base de datos contra duplicados e inconsistencias.

---

## 6.1 Especificación funcional de la primera versión

### Navegación para dirección y recepción

1. **Inicio:** resumen del día, pendientes y accesos rápidos.
2. **Alumnos:** familias, alumnos, inscripciones e historial.
3. **Clases:** calendario, grupos, sesiones, capacidad, carriles e instructores.
4. **Asistencia:** registro manual, eventos biométricos e incidencias.
5. **Pagos:** cargos, pagos, adeudos, paquetes, recibos y corte.
6. **Más:** instructores, evaluaciones, reportes y configuración.

Las funciones del apartado Más podrán aparecer directamente en escritorio cuando exista espacio, pero conservarán la misma agrupación para no saturar la navegación.

### Contenido del inicio

La pantalla inicial mostrará únicamente:

- Clases programadas para hoy.
- Alumnos activos.
- Pagos vencidos que requieren atención.
- Incidencias de asistencia o biométrico.
- Ocupación general resumida.
- Acciones rápidas: nuevo alumno, registrar pago y tomar asistencia.

Las estadísticas detalladas permanecerán en Reportes.

### Navegación móvil para instructores

1. **Hoy:** clases asignadas y lista de alumnos.
2. **Asistencia:** registro rápido y notas de clase.
3. **Evaluaciones:** habilidades, progreso y alertas autorizadas.

### Matriz inicial de permisos

| Acción | Dirección | Recepción | Instructor |
| --- | :---: | :---: | :---: |
| Configurar organización | Sí | No | No |
| Administrar usuarios y permisos | Sí | No | No |
| Ver indicadores financieros | Sí | Limitado | No |
| Crear familias y alumnos | Sí | Sí | No |
| Editar información general del alumno | Sí | Sí | No |
| Consultar alertas autorizadas | Sí | Sí | Solo alumnos asignados |
| Crear y modificar grupos | Sí | Sí | No |
| Inscribir o cambiar alumnos | Sí | Sí | No |
| Registrar pagos | Sí | Sí | No |
| Cancelar o devolver pagos | Sí | Con autorización | No |
| Tomar asistencia | Sí | Sí | Solo clases asignadas |
| Corregir asistencia cerrada | Sí | Con autorización | No |
| Evaluar habilidades | Sí | No | Solo alumnos asignados |
| Promover de nivel | Sí | No | Proponer únicamente |
| Consultar auditoría | Sí | No | No |

Los permisos se implementarán como capacidades individuales; los roles anteriores serán conjuntos predeterminados, no condiciones rígidas en el código.

### Flujo A — Alta e inscripción de un alumno

1. Recepción busca primero por nombre, teléfono y correo para evitar duplicados.
2. Crea o selecciona una familia.
3. Registra tutor y alumno.
4. Captura alertas y datos autorizados.
5. Selecciona programa, nivel y disponibilidad.
6. El sistema muestra grupos compatibles con cupo.
7. Recepción elige grupo y fecha de inicio.
8. El backend valida nuevamente capacidad y conflictos.
9. Se crea la inscripción.
10. Se generan cargos de inscripción y modalidad elegida.
11. Toda la operación queda en auditoría.

### Flujo B — Programación de grupos y sesiones

1. Dirección o recepción crea un grupo con programa, nivel, instructor y capacidad.
2. Asigna sucursal, alberca, carril, días y horario.
3. El sistema detecta conflictos de instructor, carril y horario.
4. Al publicar el grupo se generan sesiones futuras dentro del horizonte configurado.
5. Cierres, vacaciones o cancelaciones modifican sesiones, no destruyen el historial del grupo.

### Flujo C — Asistencia manual

1. El instructor abre una clase asignada.
2. Visualiza únicamente los alumnos inscritos para esa sesión.
3. Marca presente, ausente, justificado, reposición o prueba.
4. Puede agregar una nota breve autorizada.
5. Al cerrar la lista, las correcciones posteriores requieren permiso y motivo.

### Flujo D — Asistencia mediante Hikvision simulado

1. El simulador emite un evento compatible con el formato interno del conector.
2. Se valida el identificador único para garantizar idempotencia.
3. Se busca al alumno vinculado al identificador externo.
4. Se buscan sesiones compatibles por sucursal y ventana de tiempo.
5. Si existe una coincidencia inequívoca, se registra la asistencia.
6. Si existen cero o varias coincidencias, el evento pasa a revisión.
7. La asistencia conserva referencia al evento de origen.

### Flujo E — Mensualidades

1. Una inscripción define la tarifa, periodicidad, día de vencimiento y fecha de inicio.
2. Un proceso programado genera el cargo correspondiente una sola vez.
3. Los descuentos se registran como ajustes identificables, no alterando el cargo original sin historial.
4. Los pagos se distribuyen entre cargos mediante asignaciones explícitas.
5. El saldo se calcula desde cargos, ajustes y asignaciones; no se mantiene como un número editable independiente.

### Flujo F — Paquetes de clases

1. Recepción vende un paquete con número de clases y vigencia.
2. El pago y el derecho a clases son registros relacionados pero independientes.
3. Cada asistencia elegible consume una unidad mediante un movimiento de saldo.
4. Cancelar una asistencia autorizada puede devolver la unidad según política.
5. Nunca se editará directamente el saldo restante; se calculará desde movimientos.

### Flujo G — Clase individual y otros cargos

1. Se selecciona una sesión o concepto configurable.
2. Se crea el cargo con precio vigente y referencia al origen.
3. El pago puede ser total o parcial.
4. Si se cancela, se registra cancelación, ajuste o devolución; el registro original permanece.

### Reglas obligatorias de negocio

- Ninguna inscripción activa puede provocar sobrecupo sin una autorización auditada.
- Un instructor o carril no puede tener sesiones superpuestas.
- Pagos, cargos y asistencias no se eliminan físicamente.
- Todos los importes usan moneda y precisión decimal.
- Toda petición de pago o evento biométrico incorpora clave de idempotencia.
- Los cálculos financieros se realizan en backend y se cubren con pruebas.
- La zona horaria pertenece a la organización; las fechas se almacenan de forma consistente.
- La información sensible se limita por permisos y finalidad.
- Las importaciones generan una vista previa y reporte de errores antes de confirmar.
- Los reportes provienen de datos transaccionales; no mantienen totales editables manualmente.

### Fuera del alcance de la primera versión funcional

- Portal para padres o alumnos.
- Reservas públicas.
- Pasarela de pagos real.
- Facturación CFDI.
- Mensajes reales por WhatsApp o SMS.
- Aplicación móvil nativa.
- Punto de venta e inventario.
- Nómina o comisiones.
- Control físico de puertas o torniquetes.
- Conexión con un biométrico real.

Estos elementos seguirán contemplados en la arquitectura para agregarlos sin reconstruir el núcleo.

---

## 7. Arquitectura técnica propuesta

### Tecnologías

- **Monorepo TypeScript.**
- **Frontend:** Next.js y React.
- **Backend:** NestJS modular con API REST.
- **Base de datos:** PostgreSQL.
- **ORM y migraciones:** Prisma.
- **Diseño:** Tailwind y biblioteca interna de componentes.
- **Procesos automáticos:** worker; Redis/BullMQ únicamente cuando sea necesario.
- **Archivos:** almacenamiento compatible con S3.
- **Contenedores:** Docker.
- **Repositorio y control de cambios:** GitHub.
- **Despliegue:** Railway con Development, Staging y Production.

### Estructura del repositorio

```text
apps/
  web/
  api/
  worker/

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

### Principios técnicos obligatorios

- Backend y base de datos validan reglas críticas; no depender de validaciones visuales.
- Módulos con límites claros y sin dependencias circulares.
- Secretos fuera del repositorio.
- Migraciones versionadas, revisadas y no destructivas por defecto.
- API documentada.
- Errores con identificador y contexto suficiente para diagnóstico.
- Logs sin contraseñas, tokens ni información sensible innecesaria.
- Health checks para despliegues.
- Compatibilidad hacia atrás durante actualizaciones de base de datos.
- Nada crítico dependerá de que Claude esté conectado.

---

## 8. Calidad, pruebas y liberación

### Tipos de prueba obligatorios

- Unitarias para cálculos, políticas y reglas.
- Integración para base de datos, permisos y servicios.
- End-to-end para procesos completos.
- Aislamiento entre organizaciones.
- Concurrencia en cupos, pagos e inscripciones.
- Seguridad de roles y acceso a archivos.
- Importación desde Excel.
- Actualización de versión con datos existentes.
- Restauración real de respaldos.
- Carga con volúmenes superiores a los del cliente piloto.

### Flujos críticos que deben aprobarse antes de vender

1. Crear familia y varios alumnos.
2. Inscribir alumno sin exceder capacidad.
3. Cambiar de grupo conservando historial.
4. Generar cargos y aplicar pagos parciales correctamente.
5. Evitar pagos o inscripciones duplicadas.
6. Tomar asistencia desde móvil.
7. Otorgar y consumir una reposición según política.
8. Evaluar habilidades y promover de nivel.
9. Restringir acciones según permisos.
10. Actualizar una instalación sin perder datos.
11. Restaurar una base desde respaldo.
12. Regresar a una versión estable ante un despliegue fallido.

### Flujo de liberación

```text
Desarrollo → pruebas automáticas → staging → respaldo → cliente piloto
→ validación → versión estable → despliegue progresivo → monitoreo
```

Cada versión utilizará SemVer, CHANGELOG y notas de migración. Los clientes podrán permanecer temporalmente en una versión estable mientras se valida la siguiente.

---

## 9. Riesgos identificados y prevención

| Riesgo | Prevención |
| --- | --- |
| Diferentes versiones por cliente | Núcleo único, módulos y configuración. |
| Pérdida o corrupción de datos | Backups programados, restauraciones probadas y migraciones seguras. |
| Claude modifica demasiadas áreas | Tareas pequeñas, revisión de diff, pruebas y límites por módulo. |
| Reglas financieras incorrectas | Motor de cargos/pagos separado y pruebas exhaustivas. |
| Fuga de información entre escuelas | Base independiente inicialmente, `organization_id` y pruebas de aislamiento. |
| Demasiadas funciones antes del piloto | Fases cerradas y criterios de aceptación. |
| Dependencia de un solo programador | Código estándar, documentación, GitHub y decisiones registradas. |
| Errores difíciles de reproducir | Logs estructurados, identificadores de error y datos de prueba. |
| Diseñar desde supuestos incorrectos | Entrevista operativa y piloto con usuarios reales. |

---

## 10. Preguntas que deberá validar la escuela piloto real

Estas preguntas no bloquean M0 ni el trabajo con la escuela piloto simulada. Hasta contar con evidencia real, las decisiones que las afecten deberán resolverse con supuestos conservadores, configurables, documentados y fáciles de revertir.

1. ¿Cómo cobra actualmente: mensualidad, paquetes, clase individual o combinación?
2. ¿La mensualidad depende de días por semana, duración o tipo de clase?
3. ¿Cómo maneja inscripciones a mitad de mes y prorrateos?
4. ¿Qué condiciones permiten una reposición y cuánto tiempo es válida?
5. ¿Los grupos se limitan por carril, instructor, nivel, edad o todos?
6. ¿Cómo evalúan habilidades y quién autoriza el cambio de nivel?
7. ¿Un alumno puede tomar clases en varios grupos o sucursales?
8. ¿Qué información médica y consentimientos necesitan registrar?
9. ¿Quién registra pagos, descuentos, bajas y devoluciones?
10. ¿Qué reportes usa dirección para decidir?
11. ¿Qué mensajes se envían por WhatsApp y en qué momento?
12. ¿Necesitan facturación, control de acceso, tienda o nómina desde el inicio?
13. ¿Cuántos alumnos, familiares, instructores, grupos, sucursales y usuarios simultáneos esperan?
14. ¿Qué información tienen actualmente en Excel y cómo está organizada?

---

## 11. Validaciones pendientes por hito

La especificación queda aprobada como línea base para iniciar M0. Las validaciones restantes se realizarán en el momento en que puedan comprobarse con evidencia:

1. M0 utilizará la escuela piloto simulada, los datos de prueba y los criterios definidos en este documento.
2. Antes de cerrar cada hito se revisarán sus flujos, modelo de datos, wireframes y criterios de aceptación correspondientes.
3. Antes de M6 se deberá seleccionar una escuela piloto real, documentar su operación y ejecutar una prueba completa con usuarios reales.
4. Antes de comercializar se deberán validar costos por instalación, soporte, monitoreo, copias de seguridad y restauración.
5. Las preguntas abiertas de la sección 10 no permiten inventar reglas rígidas: deberán resolverse mediante configuración o decisiones registradas cuando afecten al hito en curso.
6. El adaptador Hikvision real y las demás integraciones externas continuarán fuera de alcance hasta aprobación expresa.

---

## 12. Decisión vigente

VonverIA Swim se desarrollará con código y Claude como asistente, bajo estas condiciones:

- Producto modular y documentado.
- Código fuente controlado por VonverIA.
- Instalaciones independientes con núcleo común.
- Personalización mediante configuración.
- Pruebas obligatorias antes de cada liberación.
- Escuela piloto antes de comercialización masiva.
- Ninguna promesa de “cero errores”; sí capacidad demostrable de detectar, recuperar y corregir.

---

## 13. Historial de cambios

### 1.0.0 — 14 de agosto de 2026

- Aprobada la especificación como línea base oficial del producto.
- Autorizado el desarrollo controlado por hitos, comenzando por M0.
- Aclarado que las preguntas del piloto real no bloquean la fundación técnica.
- Reorganizadas las validaciones pendientes para evitar supuestos irreversibles.

### 0.4.0 — 4 de agosto de 2026

- Adoptado el principio “completo sin ser complicado”.
- Reducida la navegación principal a seis secciones.
- Definida la pantalla de inicio con información esencial.
- Simplificada la navegación móvil del instructor.
- Establecida la dirección visual inicial.
- Incorporado un presupuesto de complejidad para nuevas funciones.

### 0.3.0 — 3 de agosto de 2026

- Definida la navegación para dirección, recepción e instructores.
- Agregada la matriz inicial de permisos.
- Documentados flujos de altas, programación, asistencia y cobranza.
- Establecidas reglas obligatorias de negocio.
- Delimitado el alcance de la primera versión funcional.

### 0.2.0 — 3 de agosto de 2026

- Definida una escuela piloto simulada.
- Confirmados los usuarios iniciales: dirección, recepción e instructores.
- Confirmados mensualidades, paquetes, clases individuales, inscripción y cargos configurables.
- Agregado escenario de datos para pruebas.
- Incorporada estrategia de asistencia desacoplada con simulador Hikvision.
- Establecidos criterios de éxito del piloto.

### 0.1.0 — 3 de agosto de 2026

- Investigación competitiva inicial.
- Arquitectura preliminar.
- Módulos, modelo de datos, pruebas y riesgos iniciales.
