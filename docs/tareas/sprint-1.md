# Sprint 1 · Plataforma web CRM y armado de paquetes

Semana 9 · 12 al 18 de octubre de 2026.

> Módulos 1.4.1 Plataforma Web CRM (Auth, Perfil, Modo Explorador) y 1.4.2 Búsqueda y Armado de Paquetes.
> Demostración de cierre: un visitante explora, busca vuelos y los filtra, arma su paquete completo de seis pasos con vuelo de ida y de regreso viendo el precio que calcula el servidor, se registra respondiendo las preguntas de preferencias y vuelve a su paquete intacto.

## Historias

### TS-016: Roles de usuario: un administrador y clientes

Sprint: 1

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-003

Estado actual: ROTO

COMO Sistema QUIERO un rol por usuario y un control de acceso que funcione PARA separar al administrador de la agencia de los clientes compradores.

**Qué espero que pase**

Problema que corrige: hoy el usuario no tiene rol y el control de permisos heredado consulta datos que nadie llena, de modo que si alguien lo aplicara a una pantalla la bloquearía para todos, incluido el administrador.

Roles existentes: solo dos, administrador y cliente. El registro público crea siempre clientes; el único administrador se crea con los datos de arranque y no existe forma de crear otro desde la plataforma.

Comportamiento: el rol viaja en la sesión, y una operación reservada al administrador rechaza a un cliente con "No tienes permiso para realizar esta acción".

Limpieza: se elimina la maquinaria de permisos granulares heredada de otro sistema y el contrato de trabajo se actualiza en el mismo aporte para que nadie la vuelva a usar.

Acceso: el rol de administrador habilita el panel de gestión; el de cliente, la plataforma de compra.

---

### US-001: Registrarme con mis preferencias de viaje

Sprint: 1

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: TS-007

Estado actual: EXISTE con ajustes

COMO visitante QUIERO crear mi cuenta respondiendo, si quiero, cómo suelo viajar, qué destinos prefiero y cuánto suelo gastar PARA que la agencia me muestre opciones relevantes desde el primer día.

**Qué espero que pase**

Formulario: pide nombre, apellido, correo, contraseña y su confirmación como obligatorios, y de forma opcional teléfono, nacionalidad y fecha de nacimiento.

Validaciones: la contraseña necesita al menos ocho caracteres, una mayúscula y un número, y si no cumple avisa "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número". Si la confirmación no coincide avisa "Las contraseñas no coinciden", y si el correo ya está registrado avisa "Este correo ya está registrado".

Preguntas opcionales: al final aparecen tres preguntas con botones visuales, cómo suele viajar entre solo, en pareja, en familia o en grupo; qué tipo de destino prefiere entre playa, ciudad, aventura o cultura; y cuánto suele gastar por viaje en rangos. Un botón permite omitirlas sin penalidad.

Al crear la cuenta: queda creado el cliente en nivel Explorador con cero puntos, sus respuestas o su ausencia quedan guardadas en el perfil, e ingresa con la sesión ya iniciada a su inicio, o al paquete que estaba armando si venía de ahí.

Acceso: solo para visitantes. Un cliente con sesión que abre el registro es llevado a su inicio.

---

### US-002: Iniciar sesión y volver a donde estaba

Sprint: 1

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: Ninguna

Estado actual: PARCIAL: la vuelta a la pantalla de origen y el manejo de la sesión vencida quedaron hechos en el sprint 0

COMO cliente QUIERO iniciar sesión y volver a la pantalla desde la que me la pidieron PARA no rehacer lo que estaba haciendo.

**Qué espero que pase**

Credenciales incorrectas: avisa "Correo o contraseña incorrectos" sin precisar cuál de los dos falló. Hoy el mensaje dice "Credenciales incorrectas".

Retorno: si llegó al inicio de sesión desde una pantalla protegida o desde el armador, al entrar vuelve exactamente a esa pantalla. Ya funciona desde el sprint 0, también al pasar por el registro.

Sesión vencida: si la sesión caduca mientras navega, avisa "Tu sesión expiró, vuelve a iniciar sesión" y, al volver a entrar, regresa a donde estaba. Hoy ya lleva al inicio de sesión y vuelve a donde estaba, pero no muestra el aviso.

Destino según rol: un cliente entra a su inicio personal y el administrador entra directamente al panel de gestión.

Cierre de sesión: limpia la sesión y lleva a explorar.

Acceso: la pantalla es solo para visitantes; quien ya tiene sesión es llevado a su inicio.

---

### US-003: Cambiar mi contraseña

Sprint: 1

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-006, US-002

Estado actual: PARCIAL

COMO cliente QUIERO cambiar mi contraseña desde mi perfil PARA mantener mi cuenta segura.

**Qué espero que pase**

Formulario: pide la contraseña actual, la nueva y su confirmación. La pantalla ya existe en el repositorio pero no está enlazada a ninguna ruta y usa un estilo visual distinto del resto, así que se enruta y se adapta a las piezas visuales del proyecto. El servicio que cambia la contraseña no existe todavía en el servidor y es parte de esta historia; como toca la autenticación, lo escriben los responsables de integración.

Validaciones: si la actual es incorrecta avisa "La contraseña actual no es correcta"; si la nueva es igual a la actual avisa "La nueva contraseña debe ser distinta de la actual"; y la nueva exige la misma fortaleza que el registro, con el mismo mensaje.

Al guardar: la contraseña anterior deja de funcionar, la nueva empieza a funcionar de inmediato y se confirma con "Contraseña actualizada".

Acceso: solo usuarios con sesión iniciada, sobre su propia cuenta.

---

### US-009: Mantener mis datos y mis viajeros frecuentes

Sprint: 1

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: Ninguna

Estado actual: EXISTE con ajustes

COMO cliente QUIERO editar mis datos, mi documento de viaje, mis preferencias y mis viajeros frecuentes PARA no volver a escribirlos en cada compra.

**Qué espero que pase**

Datos propios: edita teléfono, nacionalidad, fecha de nacimiento, número de documento y las tres preferencias de viaje que respondió al registrarse, o que omitió y ahora quiere completar.

Viajeros frecuentes: agrega, edita y elimina viajeros con nombre, apellido, documento, fecha de nacimiento y relación. Hoy solo se pueden agregar y eliminar, no corregir.

Validaciones: si repite el documento de un viajero que ya tiene, avisa "Ya tienes un viajero con ese documento". Eliminar pide confirmación con "¿Eliminar a [nombre] de tus viajeros?".

Al guardar: confirma con "Datos actualizados" y los cambios se ven de inmediato en el perfil.

Acceso: cada cliente accede solo a su perfil y a sus viajeros.

---

### US-005: Explorar destinos sin cuenta

Sprint: 1

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-008, TS-014

Estado actual: PARCIAL

COMO visitante QUIERO recorrer los destinos con sus hoteles, actividades y festividades sin registrarme PARA decidir si viajo antes de dar mis datos.

**Qué espero que pase**

Listado: cada destino se muestra con su imagen, su tipo y el precio "desde", que corresponde al vuelo más barato disponible hacia ese destino.

Filtros: se puede filtrar por tipo de destino y buscar por nombre, país o ciudad. Si ninguno coincide, avisa "No encontramos destinos con esos criterios".

Detalle del destino: muestra sus hoteles, sus actividades y sus festividades del año, y ofrece el botón "Armar mi viaje a [destino]", que abre el armador sin pedir cuenta. Hoy el detalle muestra por error los vuelos que salen del destino en lugar de los que llegan a él.

Sin interrupciones: en ningún momento de la exploración se pide iniciar sesión. Hoy el botón de buscar del detalle del destino lleva a una pantalla que sí la pide.

Acceso: público, con o sin sesión iniciada.

---

### US-004: Buscar vuelos y filtrarlos

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: CRÍTICA

Dependencias: TS-014

Estado actual: PARCIAL: la búsqueda por fechas cercanas y la duración legible quedaron hechas en el sprint 0

COMO visitante o cliente QUIERO buscar vuelos y filtrarlos por precio, duración, escalas y aerolínea PARA encontrar rápido el que me conviene.

**Qué espero que pase**

Búsqueda: se busca por origen, destino, fecha de ida y cantidad de pasajeros. Si la fecha ya pasó avisa "Elige una fecha a partir de hoy". La ciudad de origen no aparece entre los destinos; hoy Lima aparece en esa lista.

Fechas cercanas: además del día elegido, muestra los vuelos de tres días antes y tres días después, ordenados por cercanía, y cada vuelo indica si sale ese día o cuántos días antes o después. Ya funciona desde el sprint 0.

Filtros: se combinan rango de precio por persona, duración máxima, cantidad de escalas entre directo, una escala o dos o más, y aerolínea, pudiendo marcar varias. Además se puede ordenar por precio o por duración.

Resultados: cada vuelo muestra aerolínea, número, horarios, duración en formato legible como "8 h 30 min", escalas, clase y el precio total para la cantidad de pasajeros elegida. La duración legible ya funciona desde el sprint 0.

Sin resultados: avisa "No encontramos vuelos cerca de esa fecha. Prueba con otra fecha o quita filtros".

Al elegir un vuelo: se abre el armador con ese vuelo ya cargado, sin pedir cuenta.

Acceso: público, con o sin sesión.

---

### US-007: Filtrar los hoteles de un destino

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: ALTA

Dependencias: TS-014

Estado actual: PARCIAL

COMO visitante o cliente QUIERO filtrar los hoteles de un destino por categoría, zona y precio PARA elegir uno que se ajuste a lo que busco.

**Qué espero que pase**

Filtros: se combinan categoría en estrellas, pudiendo marcar varias, zona del destino y rango de precio por noche, y se puede ordenar por precio o por categoría.

Resultados: cada hotel muestra imagen, nombre, estrellas, zona y precio por noche; si ya hay fechas de viaje elegidas, muestra además el total de la estadía.

Sin resultados: avisa "Ningún hotel coincide con esos filtros".

Reutilización: la misma pieza se usa en el detalle del destino y dentro del paso de hotel del armador, para que ambas se vean y se comporten igual.

Acceso: público.

---

### US-008: Filtrar las actividades de un destino

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: ALTA

Dependencias: TS-014

Estado actual: PARCIAL

COMO visitante o cliente QUIERO filtrar las actividades de un destino por tipo PARA encontrar experiencias de aventura, cultura, gastronomía o para la familia.

**Qué espero que pase**

Filtros: se filtra por tipo de actividad, pudiendo marcar varios, y por rango de precio.

Resultados: cada actividad muestra nombre, tipo, duración y precio por persona.

Sin resultados: avisa "No hay actividades de ese tipo en este destino".

Reutilización: la misma pieza se usa en el detalle del destino y en el paso de actividades del armador.

Acceso: público.

---

### TS-011: Precios calculados por el servidor

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: CRÍTICA

Dependencias: TS-012, TS-014

Estado actual: ROTO

COMO Sistema QUIERO que el precio de cada paquete lo calcule siempre el servidor con los precios del catálogo PARA que ningún cliente pueda alterar lo que paga.

**Qué espero que pase**

Problema que corrige: hoy la creación de reservas acepta el precio que manda el navegador, de modo que se puede comprar un vuelo de tres mil doscientos soles por un sol. Además los montos se suman con un tipo de dato que arrastra errores de centavos.

Qué envía el navegador: solo identificadores, fechas y cantidades. Si la petición trae precios, se rechaza.

Validaciones: el servidor comprueba que el vuelo, el hotel y las actividades existan, estén activos y correspondan al destino del vuelo, y que las fechas del hotel sean coherentes. Si el vuelo dejó de estar disponible avisa "El vuelo seleccionado ya no está disponible", y si las fechas no cierran avisa "Las fechas del hotel no son válidas".

Cotización: existe una cotización que devuelve el desglose completo, vuelo de ida y vuelo de regreso por pasajero, hotel por noche, cada actividad por cantidad, cada extra, subtotal, descuento por canje y total, y el resumen del armador muestra exactamente eso sin volver a calcular nada.

Extras: el precio del traslado se toma por paquete según sea ida, vuelta o completo, y el del seguro por pasajero, siempre desde el catálogo cargado con los datos de arranque. Hoy la pantalla trae los precios escritos y cobra el seguro una sola vez aunque viajen varios.

Precisión: todos los montos se calculan con un tipo exacto para dinero y se redondean a dos decimales solo al final.

Canje: el canje ya funciona desde el sprint 0 con el motor de fidelización, con su tope del cincuenta por ciento del paquete. La cotización incluye su línea de descuento calculada por el mismo motor, sin repetir reglas.

Acceso: la cotización es pública, porque el visitante arma sin cuenta; la compra exige sesión.

---

### TS-010: Paquete en armado guardado en el navegador

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: CRÍTICA

Dependencias: TS-009

Estado actual: PARCIAL: desde el sprint 0 el paquete ya se guarda en el navegador y queda asociado a quien lo armó

COMO Sistema QUIERO guardar en el navegador el paquete que se está armando PARA que el visitante no lo pierda al refrescar, al cambiar de pestaña o al registrarse, sin llenar la base de paquetes que nunca se concretan.

**Qué espero que pase**

Dónde se guarda: en el navegador de la persona. En la base de datos no se guarda nada hasta que confirma la compra.

Contenido: guarda selecciones, fechas y cantidades, nunca precios, porque los precios se recalculan siempre en el servidor. Hoy guarda el vuelo y el hotel completos, con sus precios. Guarda además las señales de búsqueda de la sesión, qué tipos de destino miró y en qué rango de precio filtró, que alimentan las recomendaciones al visitante.

Al registrarse o iniciar sesión: lo guardado en el navegador se envía con la cuenta recién iniciada, de modo que el paquete y las señales de búsqueda quedan asociados al cliente. Hoy el paquete ya pasa a ser del cliente al iniciar sesión; falta enviar las señales de búsqueda.

Dueño del paquete: al cerrar sesión el paquete se descarta, y otra persona que inicie sesión en el mismo navegador no ve el paquete ajeno. Ya funciona desde el sprint 0.

Caducidad: lo guardado se descarta a los siete días sin actividad.

Límite aceptado: si la persona cambia de equipo o limpia su navegador, pierde lo armado. Es el precio de no ensuciar la base, y está decidido así.

Acceso: no tiene pantalla propia; es la memoria del armador.

---

### TS-013: Datos externos con respaldo

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: ALTA

Dependencias: TS-003, TS-014

Estado actual: PARCIAL: desde el sprint 0 el clima promedio y los feriados de la base se usan cuando el servicio no responde

COMO cliente QUIERO ver siempre los feriados y el clima del destino aunque el servicio externo esté caído PARA planear mi viaje sin sorpresas.

**Qué espero que pase**

Problema que corrige: hoy cada visita consulta los servicios externos en vivo; si fallan, ya se muestra el dato de respaldo de la base, pero no se guarda ninguna respuesta. La regla del proyecto es que ninguna pantalla puede quedar en blanco por una respuesta externa.

Servicios usados: solo servicios gratuitos, y se prefiere el que no exija registrar una clave, para no repartir secretos entre seis personas ni depender de una cuota.

Guardado de respuestas: cada respuesta externa se guarda con su fecha de vencimiento; los feriados de un país y año se conservan un mes y el pronóstico unas horas. Mientras haya dato vigente no se vuelve a consultar el servicio.

Cuando falla: si el servicio no responde se muestra el dato guardado aunque esté vencido, y si no hay ninguno se muestra el dato de respaldo cargado con los datos de arranque. En ambos casos la pantalla indica "Dato referencial". Hoy el respaldo se rotula "promedio del mes".

Sin credenciales: con las credenciales vacías el sistema funciona completo con datos de respaldo, que es el modo en que se hace la demostración sin depender de la red.

Acceso: público, porque el contexto del destino se ve sin cuenta.

---

### TS-019: Clima esperado y festividades correctas

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: ALTA

Dependencias: TS-013, TS-014

Estado actual: PARCIAL: el clima promedio por destino y mes ya existe, pero solo se usa cuando el servicio no responde

COMO cliente QUIERO ver el clima esperado en las fechas de mi viaje aunque falten meses PARA saber qué llevar.

**Qué espero que pase**

Problema que corrige: hoy se muestra el pronóstico de los próximos días contados desde hoy, no desde las fechas del viaje, así que un viaje en diciembre muestra el clima de esta semana.

Fechas del viaje: van de la salida del vuelo de ida a la del vuelo de regreso.

Viaje cercano: si el viaje empieza dentro de la ventana que cubre el pronóstico, se muestra el pronóstico real de esas fechas.

Viaje lejano: si no, se muestra el clima promedio del destino en ese mes, con su temperatura mínima, su máxima y la condición típica, rotulado "Clima promedio de [mes]".

Festividades que cruzan de año: una festividad que empieza en diciembre y termina en enero, y un viaje que cruza de un año al siguiente, coinciden correctamente. Hoy nunca coinciden porque la comparación asume que ambas fechas caen en el mismo año.

Acceso: público.

---

### US-012: Elegir vuelo y ver qué pasa en el destino

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes, pasos 1 y 2

Prioridad: CRÍTICA

Dependencias: TS-009, TS-019

Estado actual: PARCIAL

COMO cliente QUIERO elegir mi vuelo de ida y de regreso y ver qué ocurre en el destino durante mis fechas PARA decidir si ese momento me conviene.

**Qué espero que pase**

Paso del vuelo: muestra el vuelo de ida elegido con la opción de cambiarlo, que devuelve al buscador conservando todo lo demás del paquete.

Vuelo de regreso: en el mismo paso se elige el vuelo de regreso entre los que salen del destino hacia la ciudad de origen después de la llegada del vuelo de ida, con la misma búsqueda por fechas cercanas y la misma cantidad de pasajeros. Se propone el regreso siete días después de la ida y se puede cambiar. Si no hay vuelos de regreso en esas fechas avisa "No encontramos vuelos de regreso cerca de esa fecha. Prueba con otra fecha". Las fechas de los dos vuelos definen la estadía y el resto del paquete.

Obligatorio: el paquete no avanza al paso siguiente sin vuelo de ida y vuelo de regreso.

Paso del contexto: muestra tres bloques, las festividades que coinciden con las fechas del viaje, los feriados nacionales de esas fechas y el clima esperado.

Nunca vacío: si no hay coincidencias avisa "No hay feriados ni festividades en tus fechas", y si el dato no proviene de una consulta en vivo se marca como referencial.

Datos: la carga de arranque ya trae los vuelos de regreso de cada ruta.

Acceso: público, porque el visitante arma sin cuenta.

---

### US-013: Elegir hotel y fechas de estadía

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes, paso 3

Prioridad: CRÍTICA

Dependencias: TS-009, TS-011, US-007

Estado actual: PARCIAL

COMO cliente QUIERO elegir un hotel para las noches de mi viaje PARA tener el alojamiento resuelto dentro del mismo paquete.

**Qué espero que pase**

Listado: muestra los hoteles del destino con los mismos filtros de la búsqueda de hoteles.

Fechas: la entrada se propone con la llegada del vuelo de ida y la salida con el vuelo de regreso, y se pueden ajustar dentro de ese rango. Si se sale del rango avisa "Las fechas del hotel deben estar dentro de tu viaje". Hoy la entrada ya se propone con la llegada del vuelo, sin desfase, y la salida siete noches después.

Totales: muestra la cantidad de noches y el total de la estadía calculados por el servidor, nunca en la pantalla.

Paso opcional: se puede continuar sin hotel mediante la opción "Ya tengo alojamiento".

Acceso: público.

---

### US-014: Agregar actividades y extras

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes, pasos 4 y 5

Prioridad: CRÍTICA

Dependencias: TS-009, TS-011, US-008

Estado actual: PARCIAL

COMO cliente QUIERO sumar tours y extras como traslados y seguro PARA tener todo mi viaje en una sola compra.

**Qué espero que pase**

Actividades: muestra las actividades del destino con sus filtros y permite elegir la cantidad de personas para cada una, desde una hasta la cantidad de pasajeros del viaje, con todos los pasajeros como valor inicial. Hoy se cobra siempre a todos los pasajeros, sin poder elegir.

Extras: ofrece traslado de ida, de vuelta o completo, cobrado por paquete, y seguro de viaje, cobrado por pasajero, cada uno con el precio que define el servidor. Hoy los extras llevan su precio desde la pantalla, solo se ofrece el traslado completo y el seguro se cobra una sola vez.

Pasos opcionales: tanto las actividades como los extras se pueden omitir, y el paquete sigue siendo válido; solo el vuelo es obligatorio.

Acceso: público.

---

### US-015: Ver el resumen con el desglose

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes, paso 6

Prioridad: CRÍTICA

Dependencias: TS-011

Estado actual: PARCIAL

COMO cliente QUIERO ver el precio total desglosado antes de pagar PARA saber exactamente qué estoy comprando.

**Qué espero que pase**

Desglose: muestra el vuelo de ida y el de regreso por cantidad de pasajeros, el hotel por noches, cada actividad con su cantidad, cada extra, el subtotal, el descuento por canje si lo hubiera y el total.

Origen de los montos: todos vienen de la cotización del servidor; la pantalla no calcula nada. Si algún precio cambió desde que empezó a armar, avisa "El precio de tu paquete se actualizó" y muestra el nuevo total antes de continuar.

Contenido adicional: lista los pasajeros del viaje y ofrece la acción de confirmar y pagar.

Canje: el bloque de canje ya existe desde el sprint 0 y se conserva. Muestra cuántos puntos se usan, cuánto se ahorra y cuántos quedan, y el botón de pagar muestra el total final que calcula el servidor. El selector de cantidad de puntos se agrega en el sprint 3 sobre el mismo bloque.

Acceso: ver el resumen es público; confirmar exige sesión iniciada.

---

### US-006: Armar mi paquete sin cuenta y retomarlo

Sprint: 1

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: CRÍTICA

Dependencias: TS-010, US-002

Estado actual: PARCIAL: armar sin cuenta, iniciar sesión desde el resumen y volver con el paquete intacto quedaron hechos en el sprint 0

COMO visitante QUIERO armar mi viaje completo sin crear una cuenta PARA ver el precio total antes de decidir.

**Qué espero que pase**

Lo que ya funciona: el armador no exige sesión, lo elegido se conserva al refrescar y, al iniciar sesión desde el resumen, vuelve al resumen con el paquete intacto y asociado a la cuenta. Si se entra al armador sin vuelo elegido, se ofrece ir a buscar uno.

Inicio sin cuenta: el armador se abre desde un vuelo o desde un destino sin pedir nada. Desde un destino todavía no se puede.

Persistencia: cada cambio se guarda solo en su navegador; al refrescar o volver otro día, hasta siete días después, el paquete sigue ahí tal como lo dejó. Falta el vencimiento de los siete días.

Momento de la cuenta: en el resumen ve el total, y al presionar confirmar sin sesión se le avisa "Crea tu cuenta o inicia sesión para confirmar tu viaje", con ambos caminos a la vista. Hoy solo se ofrece iniciar sesión.

Al registrarse o iniciar sesión desde ahí: vuelve al resumen con todo lo armado intacto y el paquete ya asociado a su cuenta.

Acceso: armar es público; confirmar y pagar exige sesión.

## Fichas de cierre

Cada tarea terminada agrega aquí su ficha, en el mismo PR, con el formato de [README.md](README.md).

### US-009: Mantener mis datos y mis viajeros frecuentes

git commit -m "feat: completa edicion de perfil y viajeros frecuentes (US-009)"

Implementé la edición completa de perfil y viajeros frecuentes. El cliente puede editar teléfono, nacionalidad, fecha de nacimiento, número de documento y las tres preferencias de viaje (cómo viaja, qué destino prefiere y rango de presupuesto), con todos los campos precargados desde la API. Los viajeros frecuentes se pueden agregar, editar en línea y eliminar; antes de eliminar aparece la confirmación exacta requerida. La validación de documento duplicado vive en el servicio del backend y devuelve el mensaje exacto. El registro también recibió las validaciones de contraseña en el paso 1 (antes de avanzar), el botón «Volver» y la corrección del botón «Omitir», que ahora limpia las preferencias y evita dobles clics. El campo `budget` se persiste en el registro y en el perfil con los mismos valores y etiquetas en ambas pantallas.

Archivos:
- `frontend/src/app/features/profile/profile.component.ts`: pantalla completa con shared/ui, ToastService, edición inline de viajeros, confirmación de eliminación y carga de valores actuales.
- `frontend/src/app/features/auth/register/register.component.ts`: validación de contraseña en paso 1, botón «Volver», tercera pregunta de presupuesto y botón «Omitir» corregido.
- `backend/src/clients/clients.service.ts`: método `updateTraveler` con validación de pertenencia y de documento duplicado; `createTraveler` con validación de duplicado.
- `backend/src/clients/clients.controller.ts`: endpoint `PATCH /me/travelers/:id` con Swagger.
- `backend/src/clients/dto/update-traveler.dto.ts`: DTO nuevo para editar viajero.
- `backend/src/clients/dto/update-client.dto.ts`: agrega `budget` y `@ApiPropertyOptional`.
- `backend/src/clients/dto/create-traveler.dto.ts`: agrega `@ApiProperty`.
- `backend/src/clients/clients.service.spec.ts`: 10 pruebas (updateProfile, createTraveler con duplicado, updateTraveler 4 casos, deleteTraveler con aislamiento).
- `backend/src/auth/auth.service.ts`: pasa `budget` al crear el cliente; corrige `getMe` para leer `budget` de `user.client`.
- `backend/src/auth/auth.service.spec.ts`: 4 pruebas de registro y getMe con campo `budget`.
- `backend/src/common/validation.ts`: agrega `budget` a `FIELD_LABELS`.
- `backend/src/auth/dto/register.dto.ts`: campo `budget` opcional.

Base de datos: migración `20261018183235_client_budget_preference` — agrega columna `budget` (String, nullable) a la tabla `Client`. Los datos de demostración en `seed-data/users.ts` y `seed.ts` ya incluyen `budget`.

Pendiente: la confirmación de eliminación de viajero usa `confirm()` nativo. Si el equipo prefiere un modal propio de la UI, requiere un componente nuevo en `shared/ui/` (historia separada).

PR: #3
