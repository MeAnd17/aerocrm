# Interfaz: navegación y piezas base

## Barra de navegación

`frontend/src/app/core/layout/navbar/navbar.component.ts`. Está en `app.component.ts`, así que aparece en todas las pantallas.

| Sin sesión | Con sesión |
|---|---|
| Explorar, Contacto, Iniciar sesión, Crear cuenta | Inicio, Explorar, Mis viajes, Mis puntos, Perfil, nombre y nivel, Cerrar sesión |

Si hay un paquete a medio armar, aparece además **Continuar paquete** (ver `docs/armador.md`).

En pantallas de menos de 768 px los enlaces pasan a un menú que se abre con el botón ☰ y se cierra al navegar.

Para agregar un enlace se edita `VISITOR_LINKS` o `CLIENT_LINKS` en el mismo archivo.

## Contenedor de página

Toda pantalla se muestra dentro de un contenedor de ancho máximo 1152 px con margen lateral. Si una pantalla necesita ocupar todo el ancho (como el login y el registro), se marca en `app.routes.ts`:

    { path: 'login', data: { fullBleed: true }, loadComponent: ... }

## Piezas base

Están en `frontend/src/app/shared/ui/` y se importan desde `shared/ui`:

    import { ButtonComponent, CardComponent } from '../../shared/ui';

| Pieza | Uso |
|---|---|
| Botón | `<button uiButton variant="primary" (click)="guardar()">Guardar</button>` · variantes `primary`, `secondary`, `ghost`, `danger` · tamaños `sm`, `md`, `lg` · `[block]="true"` para ancho completo. También sobre `<a>` con `routerLink` |
| Tarjeta | `<ui-card title="Tu membresía"> ... </ui-card>` |
| Campo | `<ui-field label="Correo" [error]="error"><input uiInput type="email" /></ui-field>` · `uiInput` también va en `select` y `textarea` |
| Estrellas | `<ui-stars [rating]="4" />` solo lectura · `<ui-stars [rating]="nota" [editable]="true" (ratingChange)="nota = $event" />` para calificar |
| Cargando | `<ui-loading text="Buscando vuelos..." />` |
| Vacío | `<ui-empty-state icon="🧳" title="Aún no tienes viajes" message="Arma tu primer paquete."> <a uiButton routerLink="/explore">Explorar</a> </ui-empty-state>` |

Una pantalla nueva se arma con estas piezas. Si hace falta una pieza que no existe, se agrega en `shared/ui` y no dentro de la pantalla (AGENTS.md F6).

## Textos en español

Nada en pantalla se muestra en inglés.

- **Valores de la API** como `ECONOMY`, `EN_CURSO` o `AVENTURA` se muestran con el pipe `etiqueta`: `{{ vuelo.classType | etiqueta }}` → Económica. Si aparece un valor nuevo, se agrega en `shared/pipes/label.pipe.ts`.
- **Errores de la API**: `apiErrorMessage(err, 'Texto si no hay mensaje')` de `core/services/api-error.ts`. Une en una línea los mensajes de validación y muestra un texto claro si no hay conexión.
- **Fechas y números**: el idioma de la aplicación es `es-PE`, así que `{{ fecha | date:'dd MMM yyyy' }}` muestra "12 oct. 2026".

## Colores

Los colores de la plataforma están en `frontend/tailwind.config.js` como la paleta `primary` (`bg-primary-600`, `text-primary-700`…). Las pantallas nuevas usan `primary-*` y no colores sueltos como `blue-600`, así un cambio de marca se hace en un solo lugar.

Las paletas `navy` y `gold` del mismo archivo son del sistema anterior; no se usan en pantallas nuevas.

## Revisar en teléfono

Toda pantalla se revisa también a 375 px de ancho (en Chrome: F12 → ícono de dispositivo → iPhone SE). No debe aparecer desplazamiento horizontal.

## Pendiente

- Ajustar la paleta `primary` y la tipografía a la maqueta de referencia (marcado `[AJUSTAR]` en `tailwind.config.js`).
- Las pantallas que ya existían todavía no usan las piezas base. Se pasan a ellas a medida que cada historia las toque.
