# 0002 — Productos, inventario y venta de mostrador

**Fecha:** 15 de agosto de 2026
**Estado:** Aceptada

## Contexto

La escuela vende en recepción artículos de alberca (gorros, googles) y
consumibles (dulces, aguas). Ese dinero no existía en el sistema, así que el
corte de caja no cuadraba con el cajón físico y no había forma de saber cuántos
gorros quedaban.

La Sección 22 de `CLAUDE.md` deja "inventario" explícitamente fuera de los hitos
M0–M6 "hasta una aprobación posterior". El usuario dio esa aprobación, y este ADR
la documenta junto con las decisiones que la acompañan.

## Decisión

### Las ventas no pasan por `Charge` ni `Payment`

Se crean modelos propios: `Product`, `StockMovement`, `Sale` y `SaleLine`.

`Charge` y `Payment` exigen `studentId`. Una venta de mostrador no siempre tiene
alumno detrás: un visitante compra un agua, un papá compra googles. Forzar esas
ventas dentro del modelo de cobranza habría obligado a hacer `studentId` opcional
en los modelos financieros centrales, que es justo lo que la Sección 23 pide no
tocar sin aprobación.

Se decidió con el usuario que **toda venta se paga en el momento** y no se puede
cargar a la cuenta de un alumno. Eso elimina la necesidad de tocar cobranza.

**Consecuencia:** si más adelante se quiere "cargar a la cuenta", habrá que
agregar un `ChargeType.PRODUCT` y ligar la venta a un alumno. El modelo actual no
lo impide, solo no lo implementa.

### El corte de caja es uno solo

`CashClosingService` suma pagos de colegiaturas y ventas de mostrador en los
mismos cuatro totales por método. El corte existe para cuadrar contra el dinero
físico del cajón, y ese dinero no viene separado por origen.

El desglose por origen se devuelve aparte (`paymentTotals` y `saleTotals`) para
poder mostrarlo, pero el total es único.

**Consecuencia:** `closeCash` ya no falla cuando solo hubo ventas de productos.
Antes lanzaba `CASH_CLOSING_NO_OPEN_PAYMENTS` y un día de pura tienda no se podía
cerrar.

### Las existencias se calculan, no se guardan

No hay columna `stock` en `Product`. La existencia disponible es la suma de los
`delta` de `StockMovement`, igual que el saldo de un cargo se calcula desde sus
movimientos (Sección 11).

Corregir el inventario se hace con un ajuste que exige motivo y queda auditado,
no editando un número. Un ajuste de existencias sin rastro es justo por donde se
pierde mercancía.

### El precio del renglón se congela

`SaleLine.unitPrice` guarda el precio al momento de vender. Cambiar el precio de
un producto no altera el total de una venta pasada.

### Vender sin existencias está bloqueado

Decisión del usuario. La validación ocurre dentro de la transacción, con las
filas de producto bloqueadas (`SELECT ... FOR UPDATE`), ordenadas por id para que
dos carritos con productos en común no se traben entre sí. Es el mismo patrón que
ya resuelve el sobrecupo de un grupo en `EnrollmentsService`.

### Permisos separados

- `sales:manage` — cobrar en el mostrador. Dirección y Recepción.
- `inventory:manage` — productos, precios y existencias. Solo Dirección.

Mismo criterio que se usó con `billing:adjust`: la operación de rutina la hace
Recepción, la que permite mover valor sin contraparte queda en Dirección.

## Alternativas descartadas

- **Toda venta ligada a un alumno.** Encajaba perfecto con la cobranza existente
  sin tocar nada, pero impide vender un agua a quien no está inscrito, que es una
  parte real del negocio.
- **Un corte separado para tienda.** Más fácil de leer en el reporte, pero
  obligaría a cuadrar dos veces contra un solo cajón.

## Pendiente

"Tienda" vive bajo _Más_ en la navegación, porque la Sección 5 fija seis
secciones principales y no hay lugar libre. Si la beta muestra que la venta de
mostrador es lo bastante frecuente, conviene promoverla y actualizar esa sección.
