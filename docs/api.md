# Catálogo de servicios (Swagger)

Con el backend levantado:

| Modo | Dirección |
|---|---|
| Desarrollo (`npm run start:dev`) | http://localhost:3000/api/docs |
| Docker | http://localhost:3100/api/docs |

El JSON del catálogo está en `/api/docs-json`, por si se quiere importar en Postman.

Swagger es la única referencia sobre cómo responde el sistema. Antes de armar una pantalla se revisa ahí qué campos llegan; no se trabaja con ejemplos pegados en el chat (AGENTS.md F7).

## Probar un servicio protegido

1. Abre `POST /api/auth/login` → *Try it out* y envía un usuario de demostración:

        { "email": "valeria.torres@demo.pe", "password": "Demo1234!" }

2. Copia el valor de `access_token` de la respuesta.
3. Botón **Authorize** (arriba a la derecha), pega el token y confirma.
4. Desde ahí todos los servicios con candado responden con ese usuario. La sesión se mantiene si recargas la página.

## Grupos

| Grupo | Ruta base | Sesión |
|---|---|---|
| Autenticación | `/api/auth` | Solo `me` |
| Clientes | `/api/clients/me` | Sí |
| Destinos y catálogo | `/api/destinations` | No |
| Reservas | `/api/bookings` | Sí |
| Fidelización | `/api/loyalty` | Sí |
| Contacto | `/api/contact` | No |
| Salud | `/api/health` | No |

`/api/health` devuelve 503 si la base no responde. Es lo que usa Docker para saber si el backend está sano.

## Errores

Todas las respuestas de error llegan en español con la forma `{ "statusCode": 400, "message": ... }`:

- **Validación (400):** `message` es una lista, por ejemplo `["Ingresa un correo electrónico válido", "El campo pasajeros debe ser un número entero"]`. La traducción la hace `src/common/validation.ts`; si un DTO trae un campo nuevo, se agrega su nombre en español en `FIELD_LABELS`.
- **Sin sesión (401), sin permiso (403), ruta inexistente (404) y error inesperado (500):** mensajes fijos en español, desde `src/common/http-messages.filter.ts`. Los errores inesperados se registran completos en el log del servidor y al cliente no le llega el detalle.

## Al agregar o cambiar un endpoint

- Los DTO se documentan solos: el plugin de Swagger (configurado en `nest-cli.json`) lee los decoradores de `class-validator` y los comentarios `/** */` de cada propiedad.
- En el controller se agrega `@ApiOperation` con un resumen corto y una respuesta por cada error posible (`@ApiBadRequestResponse`, `@ApiNotFoundResponse`…).
- Si el endpoint pide sesión: `@ApiBearerAuth()`.
- Los parámetros de consulta sueltos (`@Query('x')`) se declaran con `@ApiQuery` para que aparezcan en la página.

Un endpoint que no aparece completo en Swagger no pasa revisión (AGENTS.md B8).
