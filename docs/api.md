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

## Al agregar o cambiar un endpoint

- Los DTO se documentan solos: el plugin de Swagger (configurado en `nest-cli.json`) lee los decoradores de `class-validator` y los comentarios `/** */` de cada propiedad.
- En el controller se agrega `@ApiOperation` con un resumen corto y una respuesta por cada error posible (`@ApiBadRequestResponse`, `@ApiNotFoundResponse`…).
- Si el endpoint pide sesión: `@ApiBearerAuth()`.
- Los parámetros de consulta sueltos (`@Query('x')`) se declaran con `@ApiQuery` para que aparezcan en la página.

Un endpoint que no aparece completo en Swagger no pasa revisión (AGENTS.md B8).
