# Fichas de cierre

Cada tarea terminada deja una ficha que dice qué se hizo, con qué commit y en qué archivos. Sirve para tres cosas: saber dónde está cada cosa sin leer el historial de git, revisar un PR sabiendo qué se quiso hacer, y armar el informe de cada sprint.

Hay un archivo por sprint: `sprint-0.md`, `sprint-1.md`, etc. Las fichas van una debajo de otra, en el orden en que entraron a `main`.

## Cuándo se escribe

La ficha va **en el mismo PR que la tarea** (AGENTS.md §10). Un PR sin su ficha no se revisa. Si un PR trae dos tareas, lleva dos fichas.

La puede redactar la herramienta de IA con la que hiciste la tarea, pero la revisas tú: tiene que decir lo que realmente quedó en el código, no lo que se conversó ni lo que se intentó y se descartó. Si algo quedó pendiente, se dice tal cual.

## Formato

```
### [ID]: [Título de la tarea]

git commit -m "[mensaje del commit, igual al del historial]"

[Un párrafo: qué hice, qué permite hacer ahora, las decisiones técnicas que no son obvias y lo que quedó pendiente.]

Archivos:
- `ruta/del/archivo`: qué se hizo ahí.
- `ruta/de/otro/archivo`: qué se hizo ahí.

Base de datos: [solo si la tarea tocó el esquema o los datos: migración, tablas, carga de arranque]

PR: #[número]
```

- **ID**: el de la historia (`US-012`, `TS-018`) o el de la tarea adicional. Tiene que coincidir con el que va entre paréntesis al final del commit (AGENTS.md G2).
- **git commit**: si la tarea tuvo más de un commit, van todos, uno por línea.
- **Archivos**: solo los que importan para entender el cambio. Los de configuración menor se agrupan en una línea.
- **Base de datos**: se omite si no aplica.
- Sin nombres de personas: el autor ya queda en el commit y en el PR.

## Ejemplo

```
### US-012: Paso de hotel del armador

git commit -m "feat: agrega el paso de hotel con fechas precargadas (US-012)"

Agregué el paso 3 del armador. Muestra los hoteles del destino ordenados por estrellas y, al elegir uno, precarga la entrada con la llegada del vuelo y la salida siete noches después. El precio por noche lo trae la API y el total del hotel se calcula en el estado del armador solo para mostrarlo; el que vale es el del servidor al confirmar. Elegir hotel es opcional.

Archivos:
- `frontend/src/app/features/packages/steps/step-hotel.component.ts`: pantalla del paso, con la lista y las fechas.
- `frontend/src/app/features/packages/package-builder.state.ts`: guarda el hotel y las fechas elegidas.

PR: #14
```
