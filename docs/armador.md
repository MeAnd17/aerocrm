# Armador de paquetes

Ruta: `/packages/new`. Código en `frontend/src/app/features/packages/`.

    packages/
      package-builder.component.ts   contenedor: indicador de pasos, carga de datos y navegación
      package-builder.state.ts       lo que el cliente va eligiendo (un solo lugar)
      steps/
        step-flight.component.ts      1 · vuelo elegido en el buscador
        step-context.component.ts     2 · clima, feriados y festividades del destino
        step-hotel.component.ts       3 · hotel y fechas
        step-activities.component.ts  4 · actividades
        step-extras.component.ts      5 · traslados y seguro
        step-summary.component.ts     6 · resumen, canje de puntos y confirmación

## Cómo funciona

El buscador manda al armador con `destinationId`, `flightId`, `departureDate` y `passengers` en la URL. El contenedor arranca el paquete con esos datos, trae el vuelo y el contexto del destino, y pasa al paso 2.

Cada paso lee y escribe en `PackageBuilderState`. Ningún paso guarda su propia copia de lo elegido, así que nada se pierde al cambiar de paso y dos personas pueden trabajar en pasos distintos sin pisarse.

`PackageBuilderState` tiene:

- **Lo elegido:** `step`, `passengers`, `flight`, `hotel`, `hotelCheckIn`, `hotelCheckOut`, `activities`, `extras`, `usePoints`.
- **Datos de apoyo:** `context` (del destino), `loyalty` (puntos del cliente) y `redemption` (descuento calculado por el backend).
- **Totales de vista previa:** `flightTotal`, `hotelTotal`, `activitiesTotal`, `extrasTotal`, `totalPrice`, `pointsDiscount`.
- **Acciones:** `goTo(n)`, `toggleHotel`, `toggleActivity`, `toggleExtra`, `start(...)`, `reset()`.

Todo son `signal` y `computed`: en las plantillas se leen como `state.hotel()` y se escriben con `state.hotel.set(...)`.

## Trabajar en un paso

- El paso nuevo o modificado vive en su archivo de `steps/` y usa `inject(PackageBuilderState)`.
- Lo que el cliente elige se guarda en el estado, nunca en una variable del componente.
- Para avanzar: `state.goTo(n)`.
- Las piezas visuales salen de `shared/ui` (ver `docs/interfaz.md`).

## Importante

Los totales del estado son solo para mostrar mientras se arma. El precio que vale es el que calcula el servidor al confirmar (AGENTS.md B6), y el descuento por puntos lo calcula siempre el backend con `POST /api/loyalty/redemption-preview`.

## Pendiente

- Los precios de los extras están escritos en `step-extras.component.ts`. El catálogo con precio ya está en la base (`ExtraOption`); falta el servicio que lo exponga.
- Al confirmar, el frontend todavía envía los precios (`priceSnapshot`). Tienen que calcularse en el servidor a partir del catálogo.
