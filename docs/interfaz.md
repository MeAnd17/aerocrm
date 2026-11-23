# Interfaz: navegación y piezas base

## Barra de navegación

`frontend/src/app/core/layout/navbar/navbar.component.ts`. Está en `app.component.ts`, así que aparece en todas las pantallas.

Muestra el isotipo y el nombre **AeroCRM · Expertia Travel**. El enlace de la pantalla actual se marca en naranja con una línea debajo; el cliente con sesión ve sus iniciales, su nombre y su nivel.

| Sin sesión | Con sesión |
|---|---|
| Explorar, Contacto, Iniciar sesión, Crear cuenta | Inicio, Explorar, Mis viajes, Mis puntos, Perfil, nombre y nivel, Cerrar sesión |

Si hay un paquete a medio armar, aparece además **Continuar paquete** (ver `docs/armador.md`).

En pantallas de menos de 1024 px los enlaces pasan a un menú que se abre con el botón ☰ y se cierra al navegar.

Para agregar un enlace se edita `VISITOR_LINKS` o `CLIENT_LINKS` en el mismo archivo.

## Pie de página

`frontend/src/app/core/layout/footer/footer.component.ts`. Aparece debajo de toda pantalla que no sea de ancho completo, salvo en el panel de administración y al imprimir. Tiene la marca, los enlaces para explorar y los de la cuenta (o iniciar sesión y crear cuenta si no hay sesión).

## Contenedor de página

Toda pantalla se muestra dentro de un contenedor de ancho máximo 1280 px (`max-w-7xl`), como en la maqueta, con margen lateral de 16 px en el teléfono y 40 px en escritorio. Si una pantalla necesita ocupar todo el ancho (como el login y el registro), se marca en `app.routes.ts`:

    { path: 'login', data: { fullBleed: true }, loadComponent: ... }

## Piezas base

Están en `frontend/src/app/shared/ui/` y se importan desde `shared/ui`:

    import { ButtonComponent, CardComponent } from '../../shared/ui';

| Pieza | Uso |
|---|---|
| Botón | `<button uiButton variant="primary" (click)="guardar()">Guardar</button>` · variantes `primary` (naranja, la acción principal de la pantalla), `secondary` (borde gris), `ghost`, `danger` · tamaños `sm`, `md`, `lg` · `[block]="true"` para ancho completo. También sobre `<a>` con `routerLink`. Son en píldora (`rounded-full`) |
| Encabezado de pantalla | `<ui-page-header eyebrow="Mi cuenta" title="Mis viajes" subtitle="..."> <a uiButton routerLink="/explore">Armar viaje</a> </ui-page-header>`: antetítulo naranja, título grande y acciones a la derecha |
| Etiqueta | `<ui-badge tone="success">Confirmado</ui-badge>` · tonos `neutral`, `brand`, `accent`, `success`, `warning`, `danger` · `[caps]="true"` para mayúsculas pequeñas ("PASO 1") |
| Isotipo | `<app-brand-mark />` · `[onDark]="true"` sobre fondo azul marino |
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

## Colores, tipografía y sombras

Vienen de la maqueta de referencia (Google Stitch, proyecto «Agencia de Viajes Personalizada», sistema «Andean Horizon») y están en `frontend/tailwind.config.js`:

| Token | Color base | Para qué |
|---|---|---|
| `primary-*` | azul marino `#0A2540` (`primary-700`) | títulos, textos fuertes, enlaces, superficies de marca |
| `accent-*` | naranja `#FF5A1F` (`accent-500`) | solo la acción principal, el paso activo y lo seleccionado. Los botones usan `accent-600` para que el texto blanco cumpla el contraste AA de WCAG 2.1 (Plan de Calidad) |
| `success-*` | verde `#059669` (`success-600`) | ahorros, descuentos, estados confirmados y puntos ganados |
| `slate-*` | gris pizarra (de Tailwind) | textos secundarios, bordes y fondos |

- Tipografía: **Plus Jakarta Sans** en toda la plataforma (`index.html` y `font-sans`). Precios y cifras con `tabular-nums`.
- Sombras: `shadow-card` (tarjeta en reposo), `shadow-raised` (tarjeta elegida o al pasar el mouse) y `shadow-float` (paneles fijos como el resumen del armador).
- Bordes: tarjetas `rounded-2xl`, campos `rounded-xl`, botones y etiquetas `rounded-full`.

Las pantallas usan estos tokens y no colores sueltos como `blue-600`, así un cambio de marca se hace en un solo lugar. Las paletas `navy` y `gold` del mismo archivo son del sistema anterior; no se usan en pantallas nuevas.

## Revisar en teléfono

Toda pantalla se revisa también a 375 px de ancho (en Chrome: F12 → ícono de dispositivo → iPhone SE). No debe aparecer desplazamiento horizontal.

## Armador

El armador tiene la barra de pasos fija debajo de la barra de navegación y, en los pasos 1 a 6, el panel **Tu paquete** a la derecha (en el teléfono, plegado debajo del paso). El panel solo muestra lo elegido; el total oficial lo calcula el servidor en el paso Resumen (AGENTS.md B6).

## Pendiente

- Las pantallas del panel de administración no están en la maqueta y conservan sus colores.
- Las pantallas de cliente ya usan los tokens de la maqueta; varias todavía arman sus tarjetas y botones con clases sueltas en vez de las piezas base. Se pasan a ellas a medida que cada historia las toque.
