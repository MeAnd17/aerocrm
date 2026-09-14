# Plataforma web CRM de ventas y fidelización para agencia de viajes

Una plataforma web responsive que centraliza la planificación y compra simulada de viajes, construye el perfil del cliente a partir de su historial y lo fideliza mediante un programa de puntos y membresías.

---

## Idea general

Cuando alguien quiere viajar, el proceso típico es caótico: busca vuelos en Google Flights, compara hoteles en Booking, busca tours en TripAdvisor, y al final no sabe si está pagando de más ni tiene todo organizado en un solo lugar. Además, cada vez que viaja empieza desde cero — ninguna plataforma lo recuerda ni le ofrece algo relevante basado en lo que ya hizo.

Este proyecto resuelve exactamente eso: el cliente planea, compara y compra todo su viaje en un solo lugar, y con cada compra la agencia lo conoce mejor para ofrecerle algo más relevante la próxima vez.

---

## Tech Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 17 + Tailwind CSS (responsive) |
| Backend | NestJS (TypeScript) |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | JWT |
| IA | Ollama / Llama 3 (local) — evolutivo |
| APIs externas | Calendarific (feriados), OpenWeatherMap (clima) |
| Despliegue | Docker + Cloudflare |

---

## Quick Start

**Prerequisitos:** Docker Desktop instalado y corriendo.

```bash
git clone <repo-url>
cd aerocrm
docker compose up -d
```

Abrir **http://localhost** en el navegador.

---

## Credenciales demo

| Rol | Email | Contraseña |
|---|---|---|
| **Administrador** | admin@viajes.com | Admin1234! |
| **Cliente** | cliente@demo.com | Cliente1234! |

---

## Cómo se aplica el CRM

**Conocer al cliente** — El perfil se construye de dos formas: con las preguntas opcionales al momento del registro (máximo 3, con botón de omitir) y con cada compra que realiza. El sistema infiere destinos visitados, presupuesto habitual y tipo de viaje sin pedirle nada explícitamente.

**Vender en el momento correcto** — Para clientes nuevos sin historial, las recomendaciones se basan en lo que busca durante la sesión. Para clientes con historial, el sistema personaliza según sus compras anteriores y la época del año en que suele viajar.

**Fidelizar con cada viaje** — Cada compra suma puntos. El nivel de membresía sube según la cantidad de viajes completados. El cliente tiene una razón concreta para volver a la agencia.

---

## Módulos

### Modo explorador (sin cuenta)
Cualquier persona entra sin registrarse. Ve recomendaciones generales de destinos populares y ofertas de temporada. Puede buscar, armar un paquete completo y ver el precio total. Solo se pide cuenta al momento de pagar — lo que armó no se pierde.

### Registro
Formulario con datos básicos y 2-3 preguntas opcionales con botones visuales (¿cómo sueles viajar?, ¿qué tipo de destino prefieres?). Con botón de omitir. Esas respuestas afinan las recomendaciones desde el primer día.

### Inicio (cliente logueado)
- Resumen del próximo viaje: vuelo, hotel, actividades, clima esperado y festividades que coinciden
- Puntos acumulados con progreso hacia el siguiente nivel
- Temporadas próximas con festividades y precios desde
- Ofertas basadas en historial de compras

### Buscador y armador de paquetes
El corazón de la plataforma. Flujo de 6 pasos:

1. **Vuelos** — resultados desde base de datos propia, filtros por precio, duración y aerolínea
2. **Contexto del destino** — feriados nacionales (Calendarific API) + festividades culturales curadas (Carnaval de Barranquilla, Feria de las Flores, Día de Muertos, Carnaval de Río, Feria de Abril, etc.) + clima (OpenWeatherMap)
3. **Hotel** — hoteles desde base de datos propia, filtros por categoría, zona y precio
4. **Actividades** — tours y experiencias desde base de datos propia, filtros por tipo
5. **Extras** — traslados aeropuerto-hotel, seguro de viaje
6. **Resumen** — precio total con desglose, descuento por puntos (mínimo 500 para canjear), confirmación con documentos

### Mis viajes
- Paquetes con estados: Pendiente, Confirmado, En curso, Completado, Cancelado
- Detalle de cada viaje con vuelo, hotel y actividades
- Voucher PDF descargable con número de confirmación, datos del viajero y monto

### Destinos y ofertas
- Explorador por temporada: Semana Santa, vacaciones de mitad de año, Navidad, puentes festivos
- Filtros por presupuesto, duración y tipo de viaje (playa, ciudad, aventura, cultura)
- Destinos favoritos guardados

### Programa de fidelización

**Acumulación de puntos:**
| Servicio | Puntos |
|---|---|
| Vuelo | 1 punto por cada S/.100 gastados |
| Hotel | 1 punto por cada S/.100 gastados |
| Actividad | 1 punto por cada S/.100 gastados |
| Extras | 1 punto por cada S/.100 gastados |

**Niveles por viajes completados:**
| Nivel | Viajes completados | Descuento al canjear |
|---|---|---|
| Explorador | 0 - 2 | Sin descuento adicional |
| Viajero | 3 - 7 | 5% adicional |
| Frecuente | 8 - 14 | 10% adicional |
| Elite | 15 o más | 15% adicional |

**Canje:** mínimo 500 puntos = S/.50 de descuento aplicable en la próxima compra.

### Contacto
Formulario simple donde el cliente escribe su consulta y se envía directo al correo de la agencia. Sin gestión de tickets ni sistema complejo.

### Perfil
- Datos personales y documentos de viaje
- Preferencias editables
- Viajeros frecuentes guardados (pareja, hijos) para no reingresar datos
- Historial de compras y puntos

---

## Fuentes de datos

| Información | Fuente |
|---|---|
| Vuelos, hoteles y actividades | Base de datos propia (datos simulados) |
| Feriados nacionales | Calendarific API (gratuita) |
| Festividades culturales | Base de datos curada manualmente |
| Clima | OpenWeatherMap API (gratuita) |
| Pagos | Flujo simulado — el sistema refleja la compra sin procesarla |

---

## Alcance del proyecto

**MVP (10 semanas):**
- Registro con preferencias opcionales
- Modo explorador con recomendaciones generales
- Búsqueda y armado de paquetes con datos en BD
- Sistema de puntos simple por compra
- Niveles de membresía por viajes completados
- Mis viajes con vouchers PDF
- Feriados y clima en vivo via APIs
- Formulario de contacto

**Evolutivos (si hay tiempo):**
1. Recomendaciones de destino con tips y consideraciones del lugar (zona horaria, qué llevar, mejor época)
2. Asistente con IA (Ollama/Llama 3) para ayuda dentro de la plataforma: cómo subo de nivel, cómo canjeo puntos, qué incluye mi paquete

---

## Arquitectura

```
aerocrm/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT guards
│   │   ├── clients/          # Perfil, historial, preferencias
│   │   ├── packages/         # Armador de paquetes
│   │   ├── destinations/     # Destinos, festividades, clima
│   │   ├── loyalty/          # Puntos, niveles, canjes
│   │   ├── bookings/         # Reservas y estados
│   │   └── contact/          # Formulario de contacto
│   └── prisma/
│       └── schema.prisma
├── frontend/                 # Angular 17
│   └── src/app/
│       ├── core/             # Guards, interceptors, servicios
│       ├── shared/           # Componentes UI reutilizables
│       └── features/         # Una carpeta por módulo
├── docker-compose.yml
└── setup.sh
```

---

## Variables de entorno

```env
DATABASE_URL="postgresql://user:password@localhost:5432/viajes_crm"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
CALENDARIFIC_API_KEY="your-calendarific-key"
OPENWEATHER_API_KEY="your-openweather-key"
PORT=3000
```
