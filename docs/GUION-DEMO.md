# Guion de demostración — AeroCRM (TS-023)

Duración objetivo: 8 minutos
Fecha de sustentación: semana del 9 al 13 de noviembre de 2026
Entorno: Docker Compose local (`docker-compose.local.yml`), sin internet

---

## Reparto de voz

| Tramo | Quién habla | Pantalla |
|-------|------------|---------|
| 1–2 | Integrante A | Búsqueda y recomendaciones |
| 3–4 | Integrante B | Registro y armado del paquete |
| 5–6 | Integrante A | Pago y puntos ganados |
| 7 | Integrante B | Cliente con historial — inicio personalizado y canje |
| 8 | Integrante A | Reseña |
| 9 | Integrante B | Panel del administrador |

> Cada integrante presenta la parte que construyó. Estar listo para responder preguntas sobre el código propio.

---

## Tramo 1 — Visitante busca y recibe recomendaciones (0:00–1:00)

**Pantalla:** `http://127.0.0.1:8100`

1. Abrir la plataforma. Mostrar el selector de portal.
2. Ir a **Destinos** sin iniciar sesión. Buscar "Cancún". Mostrar el resultado.
3. Pulsar en Cancún → mostrar el detalle: clima mensual y actividades.
4. Volver al inicio y mostrar la sección "Próximas festividades" en la pantalla principal (visitante).

**Frase clave:** "El sistema muestra destinos relevantes desde el primer momento, sin necesidad de registrarse."

---

## Tramo 2 — Registro con preferencias (1:00–1:45)

**Pantalla:** `/client/login` → "Crear cuenta"

1. Pulsar **Crear cuenta**. Completar: nombre, apellido, correo (usar un correo nuevo cada ensayo), contraseña.
2. Expandir las preferencias: seleccionar "Playa", "Rango 1500–3000", estilo "Relajado".
3. Pulsar **Crear cuenta**. Se muestra el inicio con nivel Explorador y 0 puntos.

**Frase clave:** "Las preferencias alimentan las recomendaciones. Registrarse lleva menos de un minuto."

---

## Tramo 3 — Armado del paquete (1:45–3:30)

**Pantalla:** Inicio → "Armar paquete" o menú "Paquetes"

1. **Paso 1 — Vuelo:** Origen Lima, destino Cancún. Seleccionar fecha de ida (en 30 días). Elegir vuelo de ida y vuelo de regreso.
2. **Paso 2 — Hotel:** Elegir un hotel de 4 o 5 estrellas. Mostrar que las fechas vienen precalculadas.
3. **Paso 3 — Actividades:** Seleccionar "Snorkel en arrecife de coral" y "Tour por la zona arqueológica". Mostrar cómo el resumen lateral se actualiza.
4. **Paso 4 — Extras:** Agregar seguro de viaje.
5. **Paso 5 — Pasajeros:** Completar datos del pasajero principal (DNI de 8 dígitos, fecha de nacimiento válida).
6. **Paso 6 — Resumen:** Mostrar el desglose completo. Señalar que el precio lo calcula el servidor.

**Frase clave:** "El precio siempre viene del servidor. El frontend solo lo muestra."

---

## Tramo 4 — Pago y puntos ganados (3:30–4:15)

**Pantalla:** Paso 6 → "Confirmar y pagar"

1. No canjear puntos (el cliente nuevo no tiene). Pulsar **Confirmar y pagar**.
2. Toast de éxito. Redirige a **Mis viajes**. Mostrar la reserva en estado **Confirmado**.
3. Pulsar en la reserva → Ver detalle. Señalar los puntos ganados al pie.

**Frase clave:** "Al pagar, los puntos se acreditan automáticamente: 1 punto por cada S/ 100."

---

## Tramo 5 — Cliente con historial: inicio personalizado (4:15–5:15)

**Pantalla:** Cerrar sesión → Iniciar como `valeria.torres@demo.pe` / `Demo1234!`

1. Mostrar el inicio: nivel **Elite**, 2 524 puntos disponibles, próximo viaje si existe.
2. Señalar el bloque de recomendaciones: "Estos destinos se eligen con base en los 16 viajes completados de Valeria."
3. Pulsar en una recomendación → "Armar en un clic" (destino precargado en el armador).

**Frase clave:** "Para un cliente Elite el inicio es completamente distinto al de un Explorador."

---

## Tramo 6 — Canje con descuento de nivel (5:15–6:15)

**Pantalla:** Armador → Paso 6

1. Completar un paquete sencillo para Valeria (vuelo + hotel, sin actividades).
2. En el Paso 6 activar el canje: ingresar 500 puntos.
3. Mostrar el desglose: descuento de puntos (S/ 50) + descuento de nivel Elite (15%) = descuento total aplicado.
4. Señalar que el descuento total no supera el 50 % del paquete.
5. Pulsar **Confirmar y pagar**.

**Frase clave:** "El motor de fidelización aplica el descuento de nivel encima del canje de puntos, con un tope de seguridad del 50 %."

---

## Tramo 7 — Calificar un viaje completado (6:15–6:45)

**Pantalla:** Mis viajes → Reserva en estado COMPLETADO

1. Ir a **Mis viajes**. Abrir una reserva con estado **Completado**.
2. Pulsar **Calificar viaje**: dar 5 estrellas y escribir un comentario corto.
3. Pulsar **Guardar reseña**. Mostrar que la reseña aparece en el detalle.

**Frase clave:** "Las reseñas solo se pueden publicar una vez por reserva completada. Los administradores las ven en el panel de clientes."

---

## Tramo 8 — Panel del administrador (6:45–8:00)

**Pantalla:** Cerrar sesión → Portal del Staff → `admin@aerocrm.com` / `Admin1234!`

1. Mostrar el panel: contadores de destinos, reservas y clientes.
2. Ir a **Reservas**: buscar la reserva del cliente nuevo. Mostrar estado **Confirmado**.
3. Avanzar estado: Confirmado → En curso. Mostrar que solo se puede avanzar al siguiente estado.
4. Ir a **Clientes** → Abrir a Valeria → Mostrar historial de reservas y la reseña que publicó.
5. Ir a **Destinos** → Pulsar **Agregar destino** → Completar el formulario → Guardar. El destino aparece en la lista.

**Frase clave:** "El administrador gestiona todo el ciclo de vida: destinos, reservas y el perfil de cada cliente, incluyendo sus reseñas."

---

## Cierre (8:00)

"AeroCRM cubre el ciclo completo del cliente de Expertia Travel: desde la búsqueda sin registro hasta la fidelización del cliente Elite, pasando por el armado personalizado del paquete, el sistema de puntos y el panel de administración. Todo esto en una arquitectura en capas donde las reglas de negocio viven exclusivamente en el servidor."

---

## Notas para el día de la sustentación

- Levantar el sistema con `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build` al menos 10 minutos antes.
- Verificar `curl http://127.0.0.1:3100/api/health` antes de empezar.
- Tener el video de respaldo listo en la misma carpeta que el guion.
- El correo del cliente nuevo debe ser distinto en cada ensayo para evitar el error de correo duplicado.
- Si algo falla en vivo: pausar, mostrar el video de respaldo, continuar explicando.
