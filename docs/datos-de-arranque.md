# Datos de arranque

La carga vive en `backend/prisma/seed.ts` y toma los datos de `backend/prisma/seed-data/`:

| Archivo | Contenido |
|---|---|
| `catalog.ts` | Destinos, hoteles, actividades y festividades |
| `flights.ts` | Rutas desde Lima y el generador de vuelos |
| `reference.ts` | Extras con precio, datos de la agencia, clima promedio por mes y feriados |
| `users.ts` | Clientes de demostración |
| `history.ts` | Historial de compras de esos clientes |

    cd backend
    npx prisma db seed

## Se puede correr las veces que sea

Cada registro se busca por su clave natural (código IATA, destino + nombre, número de vuelo, correo) y se actualiza o se crea. Correrla dos veces deja la misma cantidad de registros.

Las reservas y el historial de puntos de los tres clientes de demostración se borran y se vuelven a crear en cada corrida. Si durante una prueba compras algo con uno de ellos, al volver a cargar esa compra desaparece. Las reservas de cualquier otro usuario no se tocan.

## Fechas

Los vuelos se calculan desde `SEED_REFERENCE_DATE` (en `backend/.env`, formato `AAAA-MM-DD`). Si está vacía, se usa el día en que se corre la carga. Así siempre hay vuelos en los cuatro meses siguientes.

Antes de la sustentación conviene fijar la fecha y volver a cargar, para que los datos no se muevan entre ensayos.

## Qué hay

| Dato | Cantidad |
|---|---|
| Destinos | 11 (Lima como origen y 10 destinos) |
| Vuelos | ~960: ida y vuelta, cada 7 días, 2 o 3 aerolíneas por ruta, con y sin escalas, económica, premium y ejecutiva. La búsqueda mira ±3 días, así que cualquier fecha de los próximos cuatro meses encuentra vuelos |
| Hoteles | 3 a 4 por destino, de 3 a 5 estrellas y en distintas zonas |
| Actividades | Al menos una de cada tipo del armador (aventura, cultural, gastronómico, familiar) por destino |
| Festividades | 11, cada una en su destino real |
| Extras | Traslado de ida, de vuelta, ida y vuelta, y seguro de viaje (este último se cobra por pasajero) |
| Clima | Promedio por destino y mes, con mínima, máxima, días de lluvia y un resumen corto |
| Feriados | Feriados nacionales de fecha fija de Perú, México, Colombia, España, Brasil y Panamá |

El clima y los feriados son el respaldo para cuando OpenWeatherMap o Calendarific no respondan. Los feriados que cambian de fecha cada año (Semana Santa, Carnaval, lunes trasladados) no están: esos los da Calendarific.

## Usuarios de demostración

Contraseña de todos: `Demo1234!`

| Correo | Nivel | Para qué sirve en la demo |
|---|---|---|
| `lucia.ramos@demo.pe` | Explorador, sin compras | Cliente recién registrado, inicio sin historial |
| `diego.salazar@demo.pe` | Viajero, 4 viajes | Viaje próximo a Madrid confirmado, destinos guardados, le faltan 4 viajes para Frecuente; no le alcanza para canjear |
| `valeria.torres@demo.pe` | Elite, 16 viajes | Viaja en familia, ya canjeó una vez, tiene más de 2500 puntos disponibles para probar el canje; una reserva cancelada |

Los puntos, el nivel y los saldos no están escritos a mano: la carga los calcula con el motor de fidelización recorriendo el historial de cada uno, así que siempre cuadran con sus reservas.

Diego y Valeria tienen viajes a los mismos destinos (Cancún, Medellín, Río, Bogotá), para que las recomendaciones por historial tengan de dónde salir.

## Agregar datos

- **Un hotel o una actividad:** se agrega una línea en `catalog.ts` con el IATA del destino. El nombre tiene que ser único dentro del destino.
- **Una ruta nueva:** se agrega en `ROUTES` de `flights.ts`. El destino tiene que existir en `catalog.ts`.
- **Un destino nuevo:** en `catalog.ts`, y además su clima en `reference.ts` si debe tener respaldo.

Si el cambio necesita un campo nuevo en la base, primero va la migración (AGENTS.md D1).

## Pendiente

- Datos reales de la agencia (RUC, dirección, teléfono, correo y logo) en `reference.ts`: están marcados `[COMPLETAR]`.
- Las reseñas de los clientes demo se cargan cuando exista el modelo de reseñas (sprint 3).
