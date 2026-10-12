# Plantilla de encargo

Copia el bloque, llénalo completo y pégalo en tu herramienta (Claude Code, Kiro u OpenCode) en modo plan. Si un campo no lo puedes llenar, la historia no está lista: pregunta a un responsable de integración antes de empezar.

```
Encargo AeroCRM · [ID] · [Título de la historia]

Lee AGENTS.md completo antes de empezar y obedécelo.

HISTORIA
COMO [rol] QUIERO [acción] PARA [beneficio]

CRITERIO DE ACEPTACIÓN
- [Qué se debe poder hacer o ver, comprobable]
- [Mensajes exactos entre comillas, si hay]

ARCHIVOS QUE PUEDES TOCAR
- [ruta exacta]
- [ruta exacta]

ARCHIVOS PROHIBIDOS
- Áreas reservadas de AGENTS.md §7: backend/prisma/, backend/src/auth/, backend/src/loyalty/, cálculo de precios, transacción de compra, AGENTS.md, CLAUDE.md, .github/
- [otros de esta historia]

REFERENCIA A COPIAR
- Servicio/endpoint: [método y ruta en Swagger, ej. GET /api/destinations/:id]
- Pantalla de la maqueta: [nombre de la pantalla en la maqueta]
- Componente existente que sirve de patrón: [ruta, solo si está "conservar" en docs/HEREDADO.md]

VERIFICACIÓN
[comando exacto, ej. cd frontend && npm run build]

REGLAS DE LA SESIÓN
- Primero preséntame el plan con la lista de archivos a crear o modificar. No ejecutes hasta que lo apruebe.
- Si la historia es ambigua o el repositorio la contradice, detente y pregunta.
- No hagas commit ni push. Al terminar reporta: archivos tocados, resultado de la verificación y lo que viste fuera de alcance, y redacta la ficha de cierre con el formato de docs/tareas/README.md.
```

## Ejemplo lleno (historia ficticia)

```
Encargo AeroCRM · US-999 · Mostrar el clima promedio en el detalle del destino

Lee AGENTS.md completo antes de empezar y obedécelo.

HISTORIA
COMO visitante QUIERO ver el clima promedio del mes de mi viaje en el detalle del destino PARA decidir qué llevar.

CRITERIO DE ACEPTACIÓN
- En /destinations/:id aparece una tarjeta "Clima en [mes]" con la temperatura promedio en °C.
- Si la API no devuelve clima, la tarjeta muestra "Clima no disponible por ahora" y la pantalla no queda en blanco.
- En 375 px de ancho la tarjeta ocupa el ancho completo y no hay desplazamiento horizontal.

ARCHIVOS QUE PUEDES TOCAR
- frontend/src/app/features/destinations/destination-detail.component.ts

ARCHIVOS PROHIBIDOS
- Áreas reservadas de AGENTS.md §7
- backend/ completo (el endpoint ya existe)

REFERENCIA A COPIAR
- Servicio: GET /api/destinations/:id (campo weather en Swagger)
- Pantalla de la maqueta: "Detalle de destino"
- Patrón: shared/ui/card para la tarjeta, shared/ui/empty-state para el vacío

VERIFICACIÓN
cd frontend && npm run build

REGLAS DE LA SESIÓN
- Primero preséntame el plan con la lista de archivos a crear o modificar. No ejecutes hasta que lo apruebe.
- Si la historia es ambigua o el repositorio la contradice, detente y pregunta.
- No hagas commit ni push. Al terminar reporta: archivos tocados, resultado de la verificación y lo que viste fuera de alcance, y redacta la ficha de cierre con el formato de docs/tareas/README.md.
```
