# Sprint 3 · Fidelización, recomendaciones y reseñas

Semana 11 · 26 de octubre al 1 de noviembre de 2026.

> Módulos 1.4.5 Reseñas y Calificaciones de Experiencia, 1.4.6 Recomendaciones por Historial y Preferencias y 1.4.7 Fidelización (Puntos, Niveles y Canjes).
> Demostración de cierre, que es el recorrido de la sustentación: un visitante recibe recomendaciones según lo que busca, se registra, compra y gana puntos; un cliente con historial entra a un inicio hecho para él, arma un paquete recomendado en un clic, canjea sus puntos con el descuento de su nivel y califica un viaje terminado.

## Historias

### US-017: Ganar puntos al confirmar mi compra

Sprint: 3

Módulo: 1.4.7 Fidelización (Puntos, Niveles y Canjes)

Prioridad: CRÍTICA

Dependencias: TS-012, US-016

Estado actual: PARCIAL

COMO cliente QUIERO ganar puntos cada vez que confirmo una compra PARA acercarme a descuentos en mis próximos viajes.

**Qué espero que pase**

Momento y cálculo: al confirmarse el pago gana un punto por cada cien soles del total pagado, sin decimales, de modo que una compra de mil ochocientos cincuenta soles otorga dieciocho puntos. Hoy los puntos se acreditan al crear la reserva, antes de que exista pago alguno.

Aviso: ve el mensaje "¡Ganaste [n] puntos con esta compra!" en la misma pantalla de confirmación.

Historial: el movimiento queda registrado con su fecha, el código de la reserva que lo originó y la cantidad de puntos.

Reserva sin pagar: una reserva en estado Pendiente no otorga puntos de ninguna clase.

Al conectarse: el detalle del viaje y la vista imprimible, construidos en el sprint 2, empiezan a mostrar los puntos ganados sin que haya que rehacerlos.

Acceso: cada cliente ve y acumula solo sus propios puntos.

---

### US-020: Canjear mis puntos con el beneficio de mi nivel

Sprint: 3

Módulo: 1.4.7 Fidelización (Puntos, Niveles y Canjes)

Prioridad: CRÍTICA

Dependencias: TS-012, US-015, US-016

Estado actual: PARCIAL: el canje con descuento por nivel y su tope del 50 % funcionan desde el sprint 0

COMO cliente QUIERO decidir cuántos puntos canjear y recibir además el descuento de mi nivel PARA pagar menos en mi viaje y notar que subir de nivel sirve.

**Qué espero que pase**

Disponibilidad: en el resumen, si tiene quinientos puntos o más, aparece la opción de usar sus puntos con el máximo canjeable y un selector de cantidad. Con menos de quinientos la opción se muestra deshabilitada y avisa "Necesitas al menos 500 puntos para canjear (tienes [n])". Hoy la pantalla ofrece todos los puntos y el servidor usa solo los que caben bajo el tope; falta el selector de cantidad, y con menos de quinientos puntos la opción no aparece en lugar de mostrarse deshabilitada.

Conversión: quinientos puntos equivalen a cincuenta soles exactos, sin excepción y sin importar el nivel.

Descuento por nivel: solo cuando canjea, se suma un descuento adicional sobre el total del paquete según su nivel, cinco por ciento para Viajero, diez para Frecuente y quince para Elite. Explorador no recibe descuento adicional.

Composición a la vista: se muestra cómo se arma el total, por ejemplo "Canje de 500 puntos: S/.50,00. Descuento nivel Viajero (5 %): S/.75,00. Total a pagar: S/.1 375,00", para que el beneficio del nivel se vea y no haya que creerlo.

Límite: la suma del canje y del descuento por nivel llega como máximo al cincuenta por ciento del total del paquete. Los puntos que no caben bajo ese tope no se consumen y se le quedan al cliente, y la pantalla lo dice con "Usarás [n] de tus [m] puntos y ahorras S/. [monto]. Te quedan [k] puntos para tu próximo viaje". Si en el paquete no caben ni los quinientos puntos mínimos, el canje no se permite y avisa "En este paquete solo puedes canjear hasta [n] puntos (el descuento máximo es el 50 % del paquete) y el canje mínimo es de 500". El tope ya funciona desde el sprint 0.

Al pagar: los puntos canjeados se descuentan del saldo y el movimiento queda en el historial identificado como canje, con el código de la reserva.

Lo que ya existe: el bloque de canje del resumen y la línea de descuento del detalle del viaje funcionan desde el sprint 0; esta historia agrega el selector, la composición a la vista y el movimiento en el historial.

Acceso: solo clientes con sesión iniciada y sobre su propio saldo.

---

### US-018: Cancelar un viaje y recuperar mis puntos

Sprint: 3

Módulo: 1.4.7 Fidelización (Puntos, Niveles y Canjes)

Prioridad: ALTA

Dependencias: TS-018, US-017

Estado actual: PARCIAL

COMO cliente QUIERO cancelar un viaje que todavía no empieza y recuperar los puntos que usé en él PARA no perder lo que venía acumulando.

**Qué espero que pase**

Cuándo se puede: solo en estado Pendiente o Confirmado. En cualquier otro avisa "Este viaje ya no se puede cancelar". Hoy el sistema permite incluso cancelar un viaje en curso.

Confirmación: pregunta "¿Cancelar tu viaje a [destino]? Esta acción no se puede deshacer" antes de hacer nada.

Al cancelar: la reserva pasa a Cancelado, se descuentan los puntos que esa compra había otorgado y se devuelven los que se canjearon en ella, ambos movimientos visibles en el historial, y se confirma con "Tu viaje fue cancelado".

Saldo nunca negativo: si el cliente ya gastó los puntos que esa compra le dio, se descuenta hasta donde alcance el saldo y nunca por debajo de cero; la diferencia queda registrada en el historial como ajuste.

Acceso: solo el cliente dueño de la reserva.

---

### US-019: Ver mis puntos, mi nivel y mi progreso

Sprint: 3

Módulo: 1.4.7 Fidelización (Puntos, Niveles y Canjes)

Prioridad: ALTA

Dependencias: TS-012, TS-014

Estado actual: EXISTE con ajustes: desde el sprint 0 la pantalla separa los puntos disponibles del histórico y el nivel sale del motor de fidelización

COMO cliente QUIERO ver mis puntos disponibles, mi nivel, cuánto me falta para el siguiente y mi historial PARA entender qué gano viajando con la agencia.

**Qué espero que pase**

Encabezado: muestra en grande los puntos disponibles para canjear con su equivalente en soles, y debajo, en chico, el total histórico acumulado, que no se puede canjear. Muestra también el nivel actual con el descuento que otorga al canjear y el tope del 50 %.

Progreso: indica "Te faltan [n] viajes para ser [nivel]", y si ya está en el nivel más alto avisa "Estás en el nivel más alto". El nivel ya sale de un solo lugar, el motor de fidelización.

Tabla de niveles: muestra los cuatro niveles con sus rangos de viajes completados y su descuento, resaltando el actual.

Historial: lista cada movimiento con fecha, descripción, código de reserva y puntos en positivo o negativo. Si no hay ninguno avisa "Aún no tienes movimientos. Tus puntos aparecerán al confirmar tu primer viaje".

Acceso: solo clientes con sesión y sobre su propia cuenta.

---

### TS-020: Motor de recomendaciones explicables

Sprint: 3

Módulo: 1.4.6 Recomendaciones por Historial y Preferencias

Prioridad: CRÍTICA

Dependencias: TS-014

Estado actual: FALTA

COMO Sistema QUIERO recomendar destinos con reglas explicables PARA mostrarle a cada persona lo más relevante y poder justificar por qué se lo mostré.

**Qué espero que pase**

Contexto: es la pieza que convierte la tienda en un CRM y hoy no existe ninguna lógica de recomendación en el sistema.

Sin historial: para un visitante o un cliente nuevo, ordena los destinos según las señales de la sesión, qué tipos miró y en qué rango de precio filtró, las preferencias que declaró al registrarse y las festividades de los próximos tres meses.

Con historial: suma los destinos y los tipos de destino que ya compró, cuánto suele gastar y en qué mes suele viajar. Quien viajó varias veces a un mismo país recibe destinos de ese país y de ese tipo; los destinos ya visitados se presentan como "Vuelve a [destino]" en lugar de excluirse.

Explicación: cada recomendación viene acompañada de su razón escrita en lenguaje natural, como "Porque buscaste playa", "Porque viajaste a Brasil el año pasado" o "Porque sueles viajar en diciembre". Una recomendación sin razón no se muestra.

Consistencia: con las mismas entradas devuelve siempre el mismo resultado, y eso queda probado con los clientes de demostración.

Acceso: funciona sin sesión con las señales de la sesión, y con sesión agrega el historial del cliente.

---

### US-021: Ver un inicio hecho para mí

Sprint: 3

Módulo: 1.4.6 Recomendaciones por Historial y Preferencias

Prioridad: CRÍTICA

Dependencias: TS-014, TS-019, TS-020

Estado actual: PARCIAL

COMO cliente QUIERO que al entrar la agencia me muestre mi próximo viaje, mi progreso y ofertas según lo que suelo comprar PARA sentir que me conocen y volver a comprar aquí.

**Qué espero que pase**

Próximo viaje: muestra el viaje con la fecha de salida más cercana, con su vuelo, su hotel, el clima esperado y las festividades que coinciden con sus fechas. Hoy se muestra el último creado, que no siempre es el próximo.

Progreso: muestra sus puntos, su nivel y cuánto le falta para el siguiente.

Temporadas que se acercan: presenta las festividades de los próximos tres meses con su precio "desde". Hoy se muestran sin filtrar por fecha, de modo que aparecen las que ya pasaron.

Elegidos para ti: entre tres y seis destinos recomendados, cada uno con su razón visible y con la opción de armarlo en un clic.

Cliente sin compras: recibe recomendaciones según las preferencias que dio al registrarse, y si las omitió se le invita con "Cuéntanos más de ti" hacia su perfil.

Acceso: solo clientes con sesión iniciada.

---

### US-022: Recomendaciones según lo que busco, sin cuenta

Sprint: 3

Módulo: 1.4.6 Recomendaciones por Historial y Preferencias

Prioridad: CRÍTICA

Dependencias: TS-010, TS-020

Estado actual: FALTA

COMO visitante QUIERO que la pantalla de explorar se adapte a lo que voy buscando PARA encontrar ideas sin tener que registrarme.

**Qué espero que pase**

Primera visita: muestra los destinos más comprados y las ofertas de temporada, que son las festividades próximas con su precio "desde".

Después de buscar: muestra un bloque encabezado por la razón, como "Porque buscaste playa", con destinos del mismo tipo y en el rango de precio que estuvo mirando.

Continuidad: esas señales viajan con su paquete en armado, de modo que si se registra, su primer inicio ya está personalizado sin haber comprado nada todavía.

Acceso: público.

---

### US-031: Armar en un clic desde una recomendación

Sprint: 3

Módulo: 1.4.6 Recomendaciones por Historial y Preferencias

Prioridad: ALTA

Dependencias: TS-009, TS-011, TS-020

Estado actual: FALTA

COMO cliente o visitante QUIERO que la agencia me proponga el paquete ya armado de un destino recomendado PARA comprarlo sin tener que elegir todo desde cero.

**Qué espero que pase**

Punto de partida: cada destino recomendado, en el inicio o en explorar, ofrece armar el viaje en un clic.

Qué precarga: el armador se abre con el vuelo más barato disponible hacia ese destino en el próximo mes y su vuelo de regreso una semana después, el hotel mejor calificado dentro del presupuesto habitual del cliente y hasta dos actividades del tipo que prefiere, con las fechas propuestas y el precio total ya calculado por el servidor.

Todo editable: el cliente puede cambiar cualquier paso antes de pagar; lo precargado es una propuesta, no una obligación.

Si falta inventario: si el destino no tiene vuelos disponibles en el rango, avisa "Por ahora no tenemos vuelos disponibles a [destino]" y ofrece explorar otras fechas.

Acceso: público; confirmar y pagar exige sesión.

---

### TS-024: Reseñas y calificaciones: modelo y servicios

Sprint: 3

Módulo: 1.4.5 Reseñas y Calificaciones de Experiencia

Prioridad: ALTA

Dependencias: TS-018

Estado actual: FALTA

COMO Sistema QUIERO guardar la calificación de un viaje terminado PARA alimentar el perfil del cliente y la ficha de cada destino.

**Qué espero que pase**

Regla: una reseña pertenece a un viaje Completado y a su cliente, y un viaje no puede tener más de una.

Contenido: guarda una calificación de una a cinco estrellas, un comentario opcional de hasta quinientos caracteres y la fecha de la última modificación.

Edición y borrado: el cliente puede corregir o eliminar su reseña cuando quiera, y el promedio del destino se recalcula solo en ambos casos.

Ficha del destino: cada destino expone su promedio y la cantidad de reseñas, siempre calculados a partir de las reseñas vigentes y nunca escritos a mano.

Rechazos: calificar un viaje que no está Completado, o que pertenece a otro cliente, se rechaza.

Datos de demostración: los datos de arranque incluyen reseñas de los clientes de demostración, para que las pantallas no se vean vacías el día de la sustentación.

Acceso: escribir, editar o borrar es exclusivo del cliente dueño del viaje; leer es público.

---

### US-025: Calificar, editar y borrar mi reseña

Sprint: 3

Módulo: 1.4.5 Reseñas y Calificaciones de Experiencia

Prioridad: ALTA

Dependencias: TS-024

Estado actual: FALTA

COMO cliente QUIERO calificar un viaje que ya terminó y poder corregir o borrar lo que escribí PARA contar cómo me fue sin quedar atado a un comentario escrito en caliente.

**Qué espero que pase**

Dónde aparece: en el detalle de un viaje Completado se ofrece calificarlo; en los demás estados la opción no aparece.

Formulario: una calificación de una a cinco estrellas y un comentario opcional.

Al enviar: se agradece con "Gracias por tu calificación" y el viaje pasa a mostrar la calificación que le puso.

Edición: si ya calificó, ve su reseña con las opciones de editarla o eliminarla. Al eliminar pregunta "¿Eliminar tu calificación de este viaje?" y, una vez eliminada, puede volver a calificar.

Acceso: solo el cliente dueño del viaje.

---

### US-026: Ver las calificaciones de un destino

Sprint: 3

Módulo: 1.4.5 Reseñas y Calificaciones de Experiencia

Prioridad: MEDIA

Dependencias: TS-024

Estado actual: FALTA

COMO visitante o cliente QUIERO ver qué calificaron otros viajeros PARA decidir con más información.

**Qué espero que pase**

Resumen: el detalle del destino muestra el promedio en estrellas y la cantidad de personas que lo calificaron.

Listado: muestra las últimas reseñas con el nombre del viajero, su calificación, su comentario y la fecha, con la opción de ver más.

Sin reseñas: avisa "Todavía no hay calificaciones de este destino" sin dejar un espacio vacío.

Efecto en la recomendación: el promedio del destino se usa para elegir el hotel y ordenar las recomendaciones, de modo que lo que califican los clientes influye en lo que la agencia propone.

Acceso: público.

## Fichas de cierre

Cada tarea terminada agrega aquí su ficha, en el mismo PR, con el formato de [README.md](README.md).
