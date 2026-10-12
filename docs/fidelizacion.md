# Fidelización: puntos, niveles y canje

Todas las reglas están en `backend/src/loyalty/loyalty.rules.ts`. Es un archivo de funciones puras: no usa la base ni Nest, así que se prueba solo y se puede importar desde cualquier servicio o desde la carga de arranque.

Si una pantalla o un servicio necesita saber cuántos puntos da una compra, qué nivel tiene un cliente o cuánto descuenta un canje, llama a este archivo o a la API. No se copian los números en otro lado (AGENTS.md B7).

## Reglas

| Regla | Valor |
|---|---|
| Puntos por compra | 1 por cada S/ 100 del total pagado, redondeando hacia abajo |
| Canje mínimo | 500 puntos |
| Valor de un punto | S/ 0.10 (500 puntos = S/ 50.00) |
| Niveles por viajes completados | Explorador 0–2 · Viajero 3–7 · Frecuente 8–14 · Elite 15+ |
| Descuento adicional al canjear | 0 / 5 / 10 / 15 % sobre el total del paquete, según el nivel |
| Tope | El descuento total nunca supera el total del paquete |

El descuento por nivel solo se aplica cuando el cliente canjea puntos. Sin canje no hay descuento.

Ejemplo: un cliente Elite canjea 500 puntos en un paquete de S/ 3000. Los puntos descuentan S/ 50 y el nivel S/ 450 (15 %). Paga S/ 2500 y gana 25 puntos por esa compra.

## Funciones

| Función | Qué devuelve |
|---|---|
| `pointsForPurchase(totalPagadoCents)` | Puntos que gana una compra |
| `pointsValueCents(puntos)` | Cuánto valen esos puntos, en céntimos |
| `levelForTrips(viajes)` | La regla del nivel que corresponde |
| `levelStatus(viajes)` | Nivel actual, siguiente nivel, viajes que faltan y avance en % |
| `computeRedemption({ packageTotalCents, pointsToRedeem, availablePoints, completedTrips })` | Descuento por puntos, por nivel, total y precio final. Lanza `RedemptionError` si el canje no es válido |
| `toCents(monto)` / `fromCents(cents)` | Conversión entre `Decimal` de Prisma (o texto) y céntimos enteros |

Todo el cálculo se hace en céntimos enteros para no arrastrar errores de coma flotante (`0.1 + 0.2`). Para guardar en la base se convierte con `fromCents`.

## Servicios que lo usan

| Endpoint | Para qué |
|---|---|
| `GET /api/loyalty/status` | Nivel, puntos, valor de los puntos disponibles, descuento actual y avance al siguiente nivel (`nextLevel.progressPercent`) |
| `GET /api/loyalty/history` | Últimos 50 movimientos de puntos |
| `POST /api/loyalty/redemption-preview` | Calcula el descuento de un canje sin registrarlo. Lo usa el resumen del armador |
| `GET /api/clients/me/home` | El bloque `membership` trae los mismos datos que `status` |
| `POST /api/bookings` | Al comprar, aplica el canje y suma los puntos ganados |

En el frontend, el inicio y la pantalla de puntos muestran la barra de avance con `progressPercent`, y el armador muestra el descuento que devuelve `redemption-preview`. Ninguna pantalla calcula niveles ni valores.

## Pruebas

`backend/src/loyalty/loyalty.rules.spec.ts` cubre los límites: 499 contra 500 puntos, los saltos de 2→3, 7→8 y 14→15 viajes, montos con céntimos y el tope del descuento.

    cd backend
    npx jest src/loyalty

Si cambia una regla del negocio, se cambia la constante en `loyalty.rules.ts` y la prueba correspondiente en el mismo PR.

## Pendiente

- Cancelar una reserva todavía no devuelve los puntos canjeados ni quita los ganados.
- Nada marca hoy una reserva como `COMPLETADO`; cuando exista ese flujo, debe llamar a `LoyaltyService.onTripCompleted`, que sube el contador de viajes y recalcula el nivel.
