# Sprint 2 · Reservas, ventas y panel de administración

Semana 10 · 19 al 25 de octubre de 2026.

> Módulos 1.4.3 Gestión de Viajes y Reservas, 1.4.4 Ventas (flujo de pago simulado) y el panel de administración, que vive dentro de 1.4.1 Plataforma Web CRM.
> Demostración de cierre: el cliente carga a sus pasajeros, paga en el flujo simulado, ve su reserva confirmada con su código en Mis viajes e imprime el detalle; el administrador da de alta un destino con su inventario y cambia el estado de una reserva.

## Historias

### TS-017: Pasajeros de la reserva

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-003

Estado actual: FALTA

COMO Sistema QUIERO que cada reserva guarde quiénes viajan PARA poder mostrarlos en el detalle y emitirlos en el comprobante del viaje.

**Qué espero que pase**

Problema que corrige: hoy la reserva solo guarda cuántos pasajeros son, de modo que el comprobante no podría incluir los datos del viajero que el proyecto promete.

Contenido: cada reserva guarda un pasajero por asiento, con nombre, apellido, número de documento y fecha de nacimiento, y uno marcado como titular.

Copia de los datos: los datos se copian a la reserva en el momento de la compra. Si después el cliente edita a ese viajero frecuente, la reserva ya emitida no cambia.

Coherencia: la cantidad de pasajeros se deriva de la lista y no se envía por separado; si no cuadra con los asientos, se rechaza con "La cantidad de pasajeros no coincide".

Acceso: los pasajeros de una reserva los ven su dueño y el administrador.

---

### TS-018: Ciclo de vida de la reserva

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-012, TS-016

Estado actual: FALTA

COMO Sistema QUIERO que las reservas cambien de estado con reglas claras PARA que los viajes, los puntos y los niveles reflejen la realidad.

**Qué espero que pase**

Problema que corrige: hoy nada lleva una reserva a En curso ni a Completado, así que los viajes completados nunca aumentan y el nivel del cliente no sube jamás. Sin esto, el programa de fidelización no se puede demostrar.

Transiciones permitidas: de Pendiente a Confirmado cuando se paga; de Pendiente o Confirmado a Cancelado cuando el cliente cancela; de Confirmado a En curso cuando llega la fecha de salida; y de En curso a Completado cuando pasa la fecha del vuelo de regreso. Cualquier otra combinación se rechaza con "Esta reserva no puede pasar de [estado] a [estado]".

Avance automático: un proceso diario mueve las reservas a En curso y a Completado según las fechas del viaje, sin que nadie intervenga.

Efecto al completar: al pasar a Completado se suma un viaje completado al cliente y se recalcula su nivel con el motor de fidelización, una sola vez por reserva aunque el proceso vuelva a ejecutarse.

Operación manual: el administrador puede forzar una transición válida desde el panel, y queda registrado quién la hizo y cuándo.

Acceso: el cliente solo cancela lo suyo; forzar un estado es exclusivo del administrador.

---

### US-016: Pagar mi paquete con método de pago simulado

Sprint: 2

Módulo: 1.4.4 Ventas (flujo de pago simulado)

Prioridad: CRÍTICA

Dependencias: TS-011, TS-018

Estado actual: FALTA

COMO cliente QUIERO elegir un método de pago y confirmar mi compra PARA tener mi viaje reservado con su código.

**Qué espero que pase**

Alcance declarado: el pago es simulado por decisión de alcance; el sistema refleja la compra sin procesarla, y la pantalla lo dice con el rótulo "Pago de demostración — no se realiza ningún cargo".

Creación de la reserva: al confirmar, la reserva nace en estado Pendiente y se abre el pago. Hoy nace directamente Confirmada y sin pago, que es lo que esta tarea corrige.

Elección del método: se elige entre tarjeta, transferencia o billetera digital. Si elige tarjeta, el formulario valida el formato de dieciséis dígitos, una fecha de vencimiento futura y un código de tres dígitos, y no guarda ni transmite ningún dato de la tarjeta.

Pago abandonado: si el cliente se va sin pagar, la reserva queda Pendiente en sus viajes con la opción de completar el pago, y no caduca sola.

Al pagar: la reserva pasa a Confirmado, se genera su código y se muestra "¡Tu viaje está confirmado! Código [código]". Todo ocurre junto o no ocurre nada.

Puntos y canje: el canje y la acreditación de puntos ya funcionan desde el sprint 0, pero ocurren al crear la reserva. Pasarlos al momento del pago es US-017, del sprint 3; mientras tanto, una reserva Pendiente acredita puntos al crearse, y en la demostración del sprint 2 se presenta así.

Acceso: solo el cliente dueño de la reserva.

---

### US-010: Registrar a los pasajeros del viaje

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-009, TS-017, US-009

Estado actual: FALTA

COMO cliente QUIERO elegir a mis pasajeros entre mis viajeros frecuentes o escribirlos una sola vez PARA no reingresar los mismos datos en cada compra.

**Qué espero que pase**

Momento: antes del resumen, el armador pide un pasajero por cada asiento del viaje.

Titular y acompañantes: el titular viene con los datos del cliente ya cargados, y los demás se eligen de su lista de viajeros frecuentes o se escriben a mano.

Datos obligatorios: nombre, apellido, número de documento y fecha de nacimiento por cada pasajero; si falta alguno avisa "Completa los datos de todos los pasajeros".

Al confirmar el paquete: los pasajeros quedan guardados en la reserva y los que se escribieron a mano y se marcaron para recordar se agregan a sus viajeros frecuentes.

Acceso: solo clientes con sesión; el visitante llega aquí después de registrarse, sin perder lo armado.

---

### US-011: Ver mis viajes y el detalle de cada uno

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: ALTA

Dependencias: TS-017

Estado actual: EXISTE con ajustes: desde el sprint 0 el detalle ya muestra extras, cantidades, descuento y puntos ganados

COMO cliente QUIERO ver mis viajes ordenados por fecha con su estado PARA saber qué viene y qué ya hice.

**Qué espero que pase**

Organización: se agrupan en próximos, que incluye Pendiente, Confirmado y En curso, pasados, que son los Completados, y cancelados. Hoy se ordenan por fecha de creación en vez de por fecha de viaje.

Tarjeta de cada viaje: muestra destino, fechas, código de confirmación, estado en español con su color y el monto pagado.

Detalle: muestra los vuelos de ida y de regreso, el hotel con su entrada y salida, las actividades con su cantidad, los extras, los pasajeros y el desglose del precio.

Sin viajes: avisa "Aún no tienes viajes. ¡Arma el primero!" con un acceso directo a explorar.

Puntos: el detalle ya muestra los puntos ganados y el descuento por canje desde el sprint 0, y se conservan.

Acceso: cada cliente ve solo sus viajes; si intenta abrir uno ajeno, el sistema responde "Reserva no encontrada" sin revelar que existe.

---

### US-024: Ver e imprimir el detalle de mi viaje

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: ALTA

Dependencias: TS-014, TS-017, US-016

Estado actual: FALTA

COMO cliente QUIERO imprimir o guardar el detalle de mi viaje confirmado PARA presentarlo y tener todos los datos a mano.

**Qué espero que pase**

Disponibilidad: se ofrece desde el detalle del viaje cuando está Confirmado, En curso o Completado. En Pendiente o Cancelado la opción no aparece.

Contenido de la vista: los datos de Expertia Travel con su logotipo, el código de confirmación, el estado, los pasajeros con su documento, los vuelos de ida y de regreso con su número, ruta y horarios, el hotel con sus fechas y noches, las actividades, los extras, el desglose del monto pagado y la fecha de emisión.

Impresión: al imprimir, la vista sale limpia, sin barra de navegación ni botones, en una página, y el navegador permite guardarla como archivo.

Descuento: si la compra tuvo canje, la vista muestra su línea de descuento, que ya existe desde el sprint 0.

Acceso: solo el cliente dueño de la reserva; cualquier otro recibe "Reserva no encontrada".

---

### TS-027: Acceso del administrador y estructura del panel

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: TS-008, TS-016

Estado actual: FALTA

COMO administrador de la agencia QUIERO un panel propio y separado de la plataforma de compra PARA gestionar lo que la agencia ofrece y lo que los clientes reservan.

**Qué espero que pase**

Entrada: el administrador inicia sesión con el mismo formulario que los clientes y, por su rol, entra directamente al panel en lugar de al inicio del cliente.

Estructura: el panel tiene su propia navegación con cuatro secciones, destinos e inventario, reservas, clientes y consultas, y un resumen con cuántos destinos, reservas y clientes hay.

Separación: un cliente que intente abrir cualquier dirección del panel recibe "No tienes permiso para realizar esta acción" y es devuelto a su inicio.

Un solo administrador: no existe pantalla para crear administradores; el único se carga con los datos de arranque.

Acceso: exclusivo del rol administrador.

---

### US-027: Administrar destinos y su inventario

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: TS-014, TS-027

Estado actual: FALTA

COMO administrador de la agencia QUIERO dar de alta, editar y desactivar destinos, vuelos, hoteles, actividades y extras PARA mantener lo que la plataforma ofrece sin tocar la base de datos.

**Qué espero que pase**

Destinos: se listan con su país, su tipo y cuántos vuelos, hoteles y actividades tienen. Se crean y editan con nombre, país, ciudad, tipo, imagen y descripción.

Inventario del destino: desde el destino se administran sus vuelos con aerolínea, número, fechas, horarios, escalas, clase, precio y asientos; sus hoteles con categoría, zona y precio por noche; y sus actividades con tipo, duración y precio por persona.

Extras: se administran los traslados y el seguro con su precio, que son los que el servidor usa al cotizar.

Desactivar en lugar de borrar: nada que ya aparezca en una reserva se elimina; se desactiva, deja de ofrecerse en las búsquedas y las reservas existentes no se alteran. Si intenta eliminar algo en uso, avisa "No se puede eliminar porque ya forma parte de una reserva".

Validaciones: precios mayores que cero, fecha de llegada posterior a la de salida, y campos obligatorios marcados antes de guardar.

Al guardar: confirma con "Cambios guardados" y lo nuevo aparece de inmediato en la búsqueda del cliente.

Acceso: exclusivo del rol administrador.

---

### US-028: Ver clientes y su estado de fidelización

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-027

Estado actual: FALTA

COMO administrador de la agencia QUIERO ver a mis clientes con su historial y su nivel PARA saber a quién le estoy vendiendo y qué tan fiel es.

**Qué espero que pase**

Listado: muestra nombre, correo, nivel de membresía, puntos disponibles, viajes completados y fecha de registro, con búsqueda por nombre o correo y filtro por nivel.

Ficha del cliente: muestra sus preferencias declaradas, sus reservas con estado y monto, su historial de puntos y sus reseñas.

Solo lectura: el administrador no edita los datos personales del cliente; únicamente consulta. Lo único que puede hacer sobre su cuenta es restablecer su contraseña, que genera una temporal y la muestra una sola vez.

Sin clientes: avisa "Todavía no hay clientes registrados".

Acceso: exclusivo del rol administrador.

---

### US-029: Gestionar reservas y cambiar su estado

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-018, TS-027

Estado actual: FALTA

COMO administrador de la agencia QUIERO ver todas las reservas y corregir su estado PARA resolver los casos que el avance automático no cubre.

**Qué espero que pase**

Listado: muestra todas las reservas con su código, cliente, destino, fechas, estado y monto, con filtro por estado y por rango de fechas, y búsqueda por código o por cliente.

Detalle: muestra el paquete completo con sus pasajeros y su desglose de precio, igual que lo ve el cliente.

Cambio de estado: puede llevar una reserva a cualquier estado que la regla permita, indicando el motivo, que queda registrado junto con la fecha y el usuario. Un cambio no permitido se rechaza con el mismo mensaje que ve el cliente.

Efecto en fidelización: si lleva una reserva a Completado, el viaje y el nivel del cliente se actualizan por el mismo camino que el avance automático, sin cálculos aparte.

Acceso: exclusivo del rol administrador.

---

### US-023: Enviar una consulta a la agencia

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-008

Estado actual: PARCIAL

COMO visitante o cliente QUIERO escribir mi consulta a la agencia PARA resolver mis dudas sin llamar.

**Qué espero que pase**

Formulario: pide nombre, correo, asunto y mensaje de hasta dos mil caracteres. Si la persona tiene sesión iniciada, su nombre y su correo vienen cargados.

Validación: si el correo no tiene formato válido avisa "Ingresa un correo válido".

Al enviar: la consulta queda guardada y aparece en la bandeja del panel de administración, que es donde la agencia la lee y la responde. No se envía ningún correo: la plataforma no depende de un servidor de correo.

Confirmación: muestra "Tu consulta fue enviada. Te responderemos pronto" y, si tiene sesión, puede ver sus consultas anteriores.

Preguntas frecuentes: la misma pantalla muestra las preguntas frecuentes de la agencia, para resolver lo común sin escribir.

Acceso: público.

---

### US-030: Bandeja de consultas en el panel

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-027, US-023

Estado actual: FALTA

COMO administrador de la agencia QUIERO leer y marcar las consultas que llegan PARA no perder ninguna y saber cuáles ya atendí.

**Qué espero que pase**

Listado: muestra las consultas de la más reciente a la más antigua, con remitente, asunto, fecha y su estado, pendiente o atendida, y filtro por estado.

Lectura: al abrir una consulta se ve el mensaje completo y, si quien escribió es un cliente registrado, un acceso a su ficha.

Atención: el administrador marca la consulta como atendida y puede dejar una nota interna de lo que se hizo, que el cliente no ve.

Aviso: el panel muestra cuántas consultas pendientes hay, para que no queden olvidadas.

Acceso: exclusivo del rol administrador.

## Fichas de cierre

Cada tarea terminada agrega aquí su ficha, en el mismo PR, con el formato de [README.md](README.md).
