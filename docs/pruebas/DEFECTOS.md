# Registro de defectos — AeroCRM Sprint 4 (TS-028)

Fecha: 2026-11-11
Entorno: Docker Compose local (`docker-compose.local.yml`), backend en `http://127.0.0.1:3100/api`.

Clasificación: **B** = Bloqueante · **G** = Grave · **M** = Menor

---

## Cobertura de esta ronda

La ronda de TS-028 tiene tres partes:

1. **Revisión estática del código** (completada): lint, build, `npm test`, `npm run test:e2e`, `npm run test:e2e:db`, verificación de reglas F3/F5/F9 en los archivos modificados.
2. **Barrido de API** (completado): peticiones reales al backend Docker con tres roles (visitante, cliente, admin), verificando códigos HTTP, mensajes en español, aislamiento y ausencia de errores 500 ante entradas inválidas.
3. **Ronda manual en navegador** (pendiente del equipo): recorrer cada pantalla siguiendo `PLAN-PRUEBAS.md`, con capturas como evidencia para el informe final.

---

## Defectos encontrados

### DEF-001 · M · Estilos en línea en la pantalla de login del cliente

**Pantalla:** `/client/login` (`client-login.component.ts`)
**Detectado en:** revisión estática
**Esperado:** Estilos aplicados mediante clases de Tailwind (regla F4).
**Ocurre:** La pantalla usa extensamente `style="..."` en línea para fondos, colores y dimensiones.
**Afecta funcionamiento:** No.
**Acción:** Corregir en historia propia (regla I3). Declarado en backlog de incidencias.

---

### DEF-002 · M · Estilos en línea en la pantalla de login de staff

**Pantalla:** `/staff/login` (`staff-login.component.ts`)
**Detectado en:** revisión estática
**Esperado:** Clases Tailwind (F4).
**Ocurre:** Mismo patrón que DEF-001, en menor escala.
**Afecta funcionamiento:** No.
**Acción:** Backlog de incidencias.

---

## Resultados del barrido de API (2026-11-11)

Barrido realizado contra `http://127.0.0.1:3100/api` con backend Docker local, usuarios de prueba creados (`barridoA@barrido.test`, `barridoB@barrido.test`) y el administrador de demostración.

| ID | Endpoint | Rol | Resultado esperado | Resultado obtenido | Estado |
|----|----------|-----|--------------------|--------------------|--------|
| A-001 | `GET /destinations` | visitante | 200, lista de destinos | 200, 11 destinos | PASA |
| A-002 | `POST /auth/register` sin campos | visitante | 400 + mensajes en español | 400, 4 mensajes en español | PASA |
| A-003 | `POST /auth/login` contraseña inválida | visitante | 401, mensaje en español | 401 "Correo o contraseña incorrectos" | PASA |
| A-004 | `GET /clients/me` sin token | visitante | 401, mensaje en español | 401 "Tu sesión no es válida o expiró..." | PASA |
| A-005 | `POST /auth/register` correo duplicado | visitante | 409, mensaje en español | 409 "Este correo ya está registrado" | PASA |
| A-006 | `GET /clients/me/home` | cliente | 200, claves del dashboard | 200, keys: user, membership, nextBooking... | PASA |
| A-007 | `GET /loyalty/status` | cliente | 200, nivel y puntos | 200, Explorador, 0 puntos | PASA |
| A-008 | `GET /bookings` sin reservas | cliente | 200, lista vacía | 200, data:[], total:0 | PASA |
| A-009 | `POST /bookings` body basura | cliente | 400, sin 500 | 400, mensajes en español | PASA |
| A-010 | `POST /bookings/quote` outboundFlightId en string | cliente | 400, sin 500 | 400, mensaje "El campo vuelo..." | PASA |
| A-011 | `POST /contact` válido (visitante) | visitante | 201, mensaje en español | 201 "Tu consulta fue enviada correctamente..." | PASA |
| A-012 | `POST /contact` mensaje < 10 chars | visitante | 400, mensaje en español | 400 "El campo mensaje debe tener al menos 10..." | PASA |
| A-013 | `GET /contact/mine` | cliente | 200, lista de consultas propias | 200, lista vacía (correcto — cliente nuevo) | PASA |
| A-014 | `GET /admin/stats` | cliente | 403, mensaje en español | 403 "No tienes permiso para realizar esta accion" | PASA |
| A-015 | `GET /admin/stats` | admin | 200, contadores | 200, destinations:11, bookings:22, clients:5 | PASA |
| A-016 | `GET /clients/me` | admin | 403, mensaje en español | 403 "No tienes permiso para realizar esta accion" | PASA |
| A-017 | `POST /bookings/quote` | admin | 403, mensaje en español | 403 "El administrador no puede usar rutas de cliente" | PASA |
| A-018 | `GET /clients/admin/all` | admin | 200, lista de clientes | 200, array con clientes de demostración | PASA |
| A-019 | `GET /destinations/1` | visitante | 200, detalle del destino | 200, Cancún, iataCode CUN | PASA |
| A-020 | `GET /bookings/:id-ajeno` | cliente A | 404, sin exponer datos de otro cliente | 404 "Reserva no encontrada" | PASA |

**Hallazgos del barrido:** ningún defecto bloqueante ni grave. Sin errores 500. Mensajes de error en español en todos los casos probados. Aislamiento entre clientes y entre roles funciona correctamente.

---

## Defectos descartados (falsos positivos)

| ID | Descripción | Razón del descarte |
|----|-------------|-------------------|
| — | Warnings de lint `no-explicit-any` en archivos de test | Reemplazados por `Record<string, unknown>` en la corrección del sprint |
| — | `style="..."` en componentes de autenticación heredados | Código preexistente, regla H1 impide corrección de pasada |

---

## Resumen

| Clasificación | Encontrados | Corregidos antes de la entrega | En backlog |
|---------------|-------------|-------------------------------|------------|
| Bloqueante | 0 | — | — |
| Grave | 0 | — | — |
| Menor | 2 | 0 | 2 |

---

## Backlog de incidencias

| ID | Historia sugerida | Descripción breve |
|----|-------------------|-------------------|
| INC-001 | fix: elimina estilos en línea del login de cliente | Reemplazar `style="..."` por clases Tailwind en `client-login.component.ts` |
| INC-002 | fix: elimina estilos en línea del login de staff | Reemplazar `style="..."` por clases Tailwind en `staff-login.component.ts` |

---

## Ronda manual pendiente

La ronda manual de navegador (65 casos de `PLAN-PRUEBAS.md`) queda pendiente del equipo. Las capturas resultantes son el anexo de evidencias del informe final. Ningún defecto del barrido automático bloquea esta ronda.
