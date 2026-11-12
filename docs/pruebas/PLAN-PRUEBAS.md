# Plan de pruebas manuales — AeroCRM Sprint 4 (TS-028)

Fecha de referencia: 2026-11-11
Entorno: Docker Compose local (`docker-compose.local.yml`), backend en `http://127.0.0.1:3100/api`, frontend en `http://127.0.0.1:8100`.
Credenciales de demostración: ver `docs/ACCESOS.md`.

---

## 1. Pantallas del cliente

### 1.1 Portal de entrada

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-001 | Acceder a `/` | Se muestra selector de portal (cliente / staff) | PASA |
| M-002 | Pulsar "Portal del Pasajero" | Redirige a `/client/login` | PASA |
| M-003 | Pulsar "Portal del Staff" | Redirige a `/staff/login` | PASA |

### 1.2 Registro

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-010 | Registrar cuenta con todos los campos | Redirige a inicio, toast de bienvenida | PASA |
| M-011 | Registrar cuenta solo con nombre, correo y contraseña | Redirige a inicio sin error | PASA |
| M-012 | Intentar registrar con correo ya existente | Toast de error, formulario no se limpia | PASA |
| M-013 | Contraseña menor a 8 caracteres | Mensaje de validación en español antes de enviar | PASA |
| M-014 | Pulsar "Ya tengo cuenta" | Redirige a `/client/login` | PASA |

### 1.3 Inicio de sesión

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-020 | Login con credenciales correctas | Redirige a `/home`, token guardado | PASA |
| M-021 | Login con contraseña incorrecta | Toast "Credenciales incorrectas", sin redirección | PASA |
| M-022 | Login con correo inexistente | Toast de error, sin redirección | PASA |
| M-023 | Acceder a `/home` sin sesión | Redirige a `/client/login` | PASA |

### 1.4 Inicio personalizado

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-030 | Iniciar como cliente nuevo (Explorador, 0 puntos) | Muestra nivel Explorador, 0 puntos, sin "próximo viaje" | PASA |
| M-031 | Iniciar como `diego.salazar@demo.pe` (Viajero, 4 viajes) | Muestra nivel Viajero, puntos disponibles, próximo viaje si existe | PASA |
| M-032 | Iniciar como `valeria.torres@demo.pe` (Elite, 16 viajes) | Muestra nivel Elite, panel de recomendaciones activo | PASA |
| M-033 | Verificar sección "Próximas festividades" | Muestra nombre, destino y precio mínimo de vuelo (o "—" si no hay vuelo) | PASA |
| M-034 | Verificar sección "Destinos guardados" para cliente con guardados | Muestra tarjetas de destinos guardados | PASA |

### 1.5 Buscador y destinos

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-040 | Buscar "Cancún" | Aparece Cancún en resultados | PASA |
| M-041 | Buscar término sin resultados | Mensaje "No se encontraron destinos" en español | PASA |
| M-042 | Pulsar en un destino | Abre detalle con clima mensual y actividades | PASA |
| M-043 | Pulsar "Armar paquete" desde el detalle | Redirige al armador con destino precargado | PASA |

### 1.6 Armador de paquetes (6 pasos)

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-050 | Paso 1 — Vuelo: seleccionar origen, destino, fechas y nro. de personas | Lista de vuelos disponibles, precio por persona visible | PASA |
| M-051 | Paso 1 — Avanzar sin seleccionar vuelo de ida | Botón "Siguiente" deshabilitado o alerta | PASA |
| M-052 | Paso 1 — Vuelo solo de ida sin vuelo de regreso | No avanza, mensaje de error en español | PASA |
| M-053 | Paso 2 — Hotel: seleccionar hotel con fechas | Se muestra precio por noche, total de noches calculado | PASA |
| M-054 | Paso 3 — Actividades: agregar al menos una | Se actualiza total del resumen lateral | PASA |
| M-055 | Paso 4 — Extras: agregar o saltear | Avanza sin error | PASA |
| M-056 | Paso 5 — Pasajeros: llenar todos los datos | Validación de DNI (8 dígitos) y fecha de nacimiento | PASA |
| M-057 | Paso 5 — DNI con 7 dígitos | Mensaje de error en español antes de avanzar | PASA |
| M-058 | Paso 5 — Fecha de nacimiento futura | Mensaje de error en español antes de avanzar | PASA |
| M-059 | Paso 6 — Resumen: cotización cargada desde el servidor | Totales coinciden con los precios de los pasos anteriores | PASA |
| M-060 | Paso 6 — Canjear con < 500 puntos | Botón deshabilitado o mensaje de error | PASA |
| M-061 | Paso 6 — Canjear 500+ puntos | Descuento reflejado en el total antes de pagar | PASA |
| M-062 | Paso 6 — Pagar | Reserva queda CONFIRMADO, toast de éxito, redirige a "Mis viajes" | PASA |
| M-063 | Verificar en "Mis viajes" que la reserva aparece CONFIRMADO | La reserva nueva aparece al tope | PASA |

### 1.7 Mis viajes

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-070 | Ver lista de reservas | Muestra estado en español con colores | PASA |
| M-071 | Pulsar en una reserva COMPLETADO | Muestra detalle con reseña (si existe) o formulario para calificar | PASA |
| M-072 | Calificar viaje con 5 estrellas | Toast de éxito, estrellas quedan llenas | PASA |
| M-073 | Intentar calificar el mismo viaje dos veces | Formulario desaparece; ya muestra la reseña guardada | PASA |
| M-074 | Cancelar reserva en CONFIRMADO | Estado cambia a CANCELADO, toast de éxito | PASA |
| M-075 | Intentar cancelar reserva en EN_CURSO | Botón ausente o mensaje de error | PASA |
| M-076 | Pulsar "Imprimir" en reserva CONFIRMADO | Abre vista de impresión con todos los datos | PASA |

### 1.8 Perfil

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-080 | Ver perfil de cliente nuevo | Campos vacíos, nivel Explorador | PASA |
| M-081 | Editar teléfono y guardar | Toast de éxito, dato persiste al recargar | PASA |
| M-082 | Cambiar contraseña con contraseña actual incorrecta | Toast de error en español | PASA |
| M-083 | Cambiar contraseña correctamente | Toast de éxito | PASA |

### 1.9 Fidelización

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-090 | Ver panel de fidelización de cliente Explorador | Barra de progreso en 0, próximo nivel: Viajero | PASA |
| M-091 | Ver panel de cliente Elite | Sin "próximo nivel" (ya es el máximo) | PASA |
| M-092 | Verificar historial de puntos | Movimientos con descripción en español | PASA |

### 1.10 Contacto

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-100 | Enviar consulta sin sesión | Formulario funciona, toast de éxito | PASA |
| M-101 | Enviar mensaje con < 10 caracteres | Mensaje de error en español | PASA |
| M-102 | Ver "Mis consultas" con sesión activa | Lista de consultas del usuario | PASA |

---

## 2. Pantallas del administrador

| ID | Paso | Resultado esperado | Estado |
|----|------|--------------------|--------|
| M-200 | Login como `admin@aerocrm.com` / `Admin1234!` | Redirige a `/admin`, panel de estadísticas | PASA |
| M-201 | Panel: destinos, reservas y clientes | Contadores visibles con números correctos | PASA |
| M-202 | Gestión de reservas: buscar por código | Encuentra la reserva, muestra estado | PASA |
| M-203 | Avanzar estado de reserva PENDIENTE → CONFIRMADO | Estado cambia, sin error | PASA |
| M-204 | Intentar PENDIENTE → COMPLETADO (salto inválido) | Toast de error en español | PASA |
| M-205 | Gestión de clientes: ver detalle | Muestra historial de reservas y reseñas del cliente | PASA |
| M-206 | Destinos: agregar nuevo destino | Formulario se envía, destino aparece en la lista | PASA |
| M-207 | Destinos: activar/desactivar destino | Estado cambia reflejado en la lista | PASA |
| M-208 | Consultas: marcar como atendida | Estado cambia a "Atendida" | PASA |
| M-209 | Inventario: ver vuelos y hoteles | Lista con filtros por destino | PASA |

---

## 3. Pruebas no funcionales

| ID | Aspecto | Criterio | Estado |
|----|---------|----------|--------|
| NF-001 | Tiempo de carga del catálogo | Pantalla de búsqueda visible en < 3 s con catálogo completo (964 vuelos) | PASA |
| NF-002 | Responsivo en 375 px | Ninguna pantalla obliga a scroll horizontal en iPhone SE | PASA |
| NF-003 | Aislamiento entre clientes | Cliente B no ve datos de cliente A (verificado en e2e TS-021) | PASA |
| NF-004 | Sin red externa | Sistema funciona sin internet: datos de respaldo en base para clima y feriados | PASA |
| NF-005 | Rol ADMIN bloqueado en rutas de cliente | 403 en `/bookings`, `/clients/me`, etc. (verificado en e2e TS-021) | PASA |

---

## 4. Cobertura de estados vacíos

| ID | Pantalla | Estado vacío | Resultado esperado | Estado |
|----|----------|-------------|---------------------|--------|
| EV-001 | Mis viajes | Sin reservas | Mensaje "Aún no tenés reservas" en español | PASA |
| EV-002 | Destinos guardados en inicio | Sin guardados | Sección no visible o mensaje vacío | PASA |
| EV-003 | Historial de puntos | Sin movimientos | Mensaje indicando que no hay movimientos | PASA |
| EV-004 | Recomendaciones | Visitante sin señales y sin festividades | Sección no visible (array vacío, verificado en spec) | PASA |
| EV-005 | Consultas del cliente | Sin consultas | Mensaje vacío en español | PASA |

---

## 5. Registro de defectos

Ver `DEFECTOS.md` en este mismo directorio.
