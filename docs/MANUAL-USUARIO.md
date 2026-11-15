# Manual de usuario — AeroCRM

Plataforma CRM de viajes para Expertia Travel S.A.C.
Versión: Sprint 4 · 2026-11-11

> Las capturas de pantalla van en `docs/capturas/`. Ver la lista de capturas pendientes en `docs/capturas/LISTA.md`.

---

## Acceso a la plataforma

Abrir el navegador y ir a `http://127.0.0.1:8100`.

La pantalla inicial muestra dos portales:
- **Portal del Pasajero** — para clientes que compran paquetes de viaje.
- **Portal del Staff** — para el equipo de Expertia Travel (administradores).

> [CAPTURA: cap-01-portal-selector.png — pantalla de selección de portal]

---

## Portal del Pasajero

### Registrarse

1. Pulsar **Portal del Pasajero** → **Crear cuenta**.
2. Completar nombre, apellido, correo y contraseña (mínimo 8 caracteres).
3. Opcionalmente indicar preferencias de viaje: estilo, tipo de destino y rango de gasto.
4. Pulsar **Crear cuenta**.

Al registrarse se asigna el nivel **Explorador** con 0 puntos.

> [CAPTURA: cap-02-registro.png — formulario de registro completo]

### Iniciar sesión

1. Pulsar **Portal del Pasajero** → **Iniciar sesión**.
2. Ingresar correo y contraseña.
3. Pulsar **Ingresar**.

### Pantalla de inicio

> [CAPTURA: cap-03-inicio-explorador.png — inicio de cliente Explorador sin historial]
> [CAPTURA: cap-04-inicio-elite.png — inicio de cliente Elite con recomendaciones y próximo viaje]

Muestra:
- **Nivel de membresía** y puntos disponibles.
- **Próximo viaje** (si hay una reserva confirmada o en curso).
- **Recomendaciones personalizadas** basadas en el historial y las búsquedas.
- **Destinos guardados** (si el cliente guardó alguno).
- **Próximas festividades** con precio mínimo de vuelo desde Lima.

### Buscar destinos

1. Ir a **Destinos** en el menú lateral.
2. Escribir el nombre de la ciudad o el país en el buscador.
3. Pulsar en un destino para ver el detalle: descripción, clima mensual y actividades.
4. Desde el detalle se puede pulsar **Armar paquete** para ir directamente al armador con ese destino.

### Armar y comprar un paquete

> [CAPTURA: cap-05-armador-vuelo.png — paso 1 del armador con vuelos seleccionados]
> [CAPTURA: cap-06-armador-resumen.png — paso 6 con desglose de precios y botón de pago]

El armador tiene 6 pasos:

**Paso 1 — Vuelo**
- Seleccionar origen (por defecto Lima), destino, fechas de ida y regreso, y número de personas.
- Elegir un vuelo de ida y un vuelo de regreso de la lista.

**Paso 2 — Hotel**
- Seleccionar un hotel del destino.
- Las fechas se precalculan con la llegada del vuelo de ida y la salida del vuelo de regreso.

**Paso 3 — Actividades**
- Seleccionar las actividades que se deseen incluir.
- Se puede saltar este paso.

**Paso 4 — Extras**
- Seleccionar servicios adicionales (seguro de viaje, traslado, etc.).
- Se puede saltar este paso.

**Paso 5 — Pasajeros**
- Ingresar los datos de cada pasajero: nombres, tipo de documento, número de documento y fecha de nacimiento.

**Paso 6 — Resumen y pago**
- El sistema muestra el desglose completo del precio calculado por el servidor.
- Si se tienen 500 puntos o más, se puede activar el canje y elegir cuántos puntos usar.
- El descuento máximo por canje es el 50 % del total del paquete.
- Pulsar **Confirmar y pagar** para crear la reserva.

Tras el pago la reserva queda en estado **Confirmado** y se acreditan los puntos ganados.

### Mis viajes

> [CAPTURA: cap-07-mis-viajes.png — lista de reservas con estados en español]
> [CAPTURA: cap-08-detalle-reserva.png — detalle de reserva con pasajeros y puntos ganados]

Muestra la lista de reservas ordenadas por fecha. Para cada reserva se puede:

- **Ver el detalle**: pasajeros, vuelos, hotel, actividades, estado y puntos ganados.
- **Cancelar**: solo si la reserva está en **Confirmado**. Se revierten los puntos canjeados y ganados.
- **Calificar**: solo si el estado es **Completado** y aún no se calificó. Se asigna una puntuación de 1 a 5 estrellas y un comentario opcional.
- **Imprimir**: genera una vista de impresión con todos los detalles.

### Fidelización

Muestra:
- Nivel actual y progreso hacia el siguiente nivel (medido en viajes completados).
- Puntos disponibles y su valor en soles.
- Descuento adicional que aplica al canjear según el nivel.
- Historial completo de movimientos de puntos (ganancias y canjes).

| Nivel | Viajes completados | Descuento al canjear |
|-------|--------------------|---------------------|
| Explorador | 0–2 | 0% |
| Viajero | 3–7 | 5% |
| Frecuente | 8–14 | 10% |
| Elite | 15+ | 15% |

### Perfil

Permite actualizar teléfono, nacionalidad, tipo y número de documento, fecha de nacimiento, y preferencias de viaje. También se puede cambiar la contraseña.

### Contacto

Enviar consultas al equipo de Expertia Travel. No requiere iniciar sesión. Las consultas enviadas con sesión activa aparecen en **Mis consultas**.

---

## Portal del Staff (Administrador)

> [CAPTURA: cap-09-panel-admin.png — panel de administrador con contadores]
> [CAPTURA: cap-10-admin-reservas.png — gestión de reservas con filtros y botones de estado]

### Acceso

1. Pulsar **Portal del Staff** e iniciar sesión con las credenciales de administrador.
2. Se accede al panel en `/admin`.

### Panel principal

Muestra contadores en tiempo real: total de destinos, reservas y clientes registrados.

### Gestión de reservas

- Ver todas las reservas con filtros por estado.
- Avanzar el estado de una reserva manualmente (PENDIENTE → CONFIRMADO → EN_CURSO → COMPLETADO).
- No se puede saltar un estado intermedio.

### Gestión de clientes

- Ver la lista de clientes con su nivel de membresía.
- Ver el detalle de cada cliente: perfil, historial de reservas y reseñas publicadas.

### Gestión de destinos

- Ver el catálogo completo de destinos con vuelos y hoteles asociados.
- Agregar nuevos destinos.
- Activar o desactivar destinos del catálogo.

### Inventario

- Ver vuelos y hoteles disponibles con filtros por destino.

### Consultas

- Ver las consultas de los clientes.
- Marcar consultas como atendidas.

---

## Preguntas frecuentes

**¿Qué pasa si cancelo una reserva?**
Se devuelven todos los puntos canjeados y se restan los puntos ganados por esa compra.

**¿Puedo cancelar una reserva en curso?**
No. Solo se pueden cancelar reservas en estado Confirmado.

**¿Los puntos expiran?**
No, los puntos no tienen fecha de vencimiento.

**¿Qué pasa si mis puntos no alcanzan para el descuento máximo?**
Se aplica el descuento correspondiente a los puntos disponibles. Los puntos que excedan el tope del 50 % se conservan para un próximo canje.

**¿La plataforma funciona sin internet?**
Sí. El sistema tiene datos de respaldo para clima y feriados. No hay recursos externos.
