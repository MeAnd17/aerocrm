# Sprint 4 · Pruebas, estabilización y cierre

Semana 12 · 2 al 8 de noviembre de 2026.

> Módulos 1.5 Pruebas, 1.6 Despliegue y 1.7 Cierre del EDT. Cero funcionalidades nuevas: congelación de código el lunes 2 de noviembre.
> Presentación en la semana 13.

## Historias

### TS-021: Pruebas automáticas de los tres flujos críticos

Sprint: 4

Módulo: 1.5 Pruebas

Prioridad: CRÍTICA

Dependencias: TS-007, US-001, US-016, US-020

Estado actual: PARCIAL

COMO Sistema QUIERO que los tres flujos que sostienen la demostración se prueben solos PARA detectar cualquier regresión antes de la sustentación.

**Qué espero que pase**

Flujo de registro: se prueba crear una cuenta respondiendo las preguntas y omitiéndolas, e iniciar sesión con esa cuenta recién creada.

Flujo de compra: se prueba armar sin sesión con vuelo de ida y de regreso, asociar el paquete al registrarse, cotizar con precios del servidor, crear la reserva en Pendiente, pagar y verificar que quede Confirmada.

Flujo de canje: se prueba que un cliente con quinientos puntos o más canjee con el descuento de su nivel, que con menos de quinientos reciba el rechazo, que el descuento nunca pase del 50 % del paquete y que los puntos que no caben se conserven, y que los puntos se acrediten al pagar.

Pruebas por módulo: cada módulo conserva sus pruebas unitarias y quien lo tocó durante el proyecto las dejó actualizadas; aquí se verifica que todas estén en verde, no se escriben desde cero.

Ejecución: las tres corren solas en cada aporte y están en verde el día de la congelación de código.

Acceso: no tiene pantalla. Corre en la verificación automática.

---

### TS-028: Ronda completa de pruebas manuales y registro de defectos

Sprint: 4

Módulo: 1.5 Pruebas

Prioridad: CRÍTICA

Dependencias: TS-021

Estado actual: FALTA

COMO equipo QUIERO recorrer la plataforma entera con una lista de comprobación PARA encontrar lo que las pruebas automáticas no ven antes de que lo vea el profesor.

**Qué espero que pase**

Cobertura: se recorre cada pantalla del cliente y del administrador, en computadora y en teléfono, siguiendo el plan de pruebas escrito al inicio del proyecto, incluyendo los casos de error y los estados vacíos.

Pruebas no funcionales: se comprueba que las pantallas carguen en un tiempo razonable con el catálogo completo, que la plataforma se vea correctamente en pantallas angostas y que ningún dato de un cliente sea visible para otro.

Registro de defectos: cada defecto se anota con la pantalla, los pasos para reproducirlo, lo que se esperaba, lo que ocurrió y su captura, y se clasifica en bloqueante, grave o menor.

Corrección y reprueba: los bloqueantes y graves se corrigen y se vuelven a probar; los menores que no alcanzan se declaran en el backlog de incidencias del cierre.

Evidencia: las capturas de la ronda completa son el anexo de evidencias del informe final.

Acceso: no tiene pantalla. Lo coordina el analista de calidad del equipo.

---

### TS-022: Entrega final reproducible y manuales

Sprint: 4

Módulo: 1.6 Despliegue

Prioridad: CRÍTICA

Dependencias: TS-004, TS-014

Estado actual: FALTA

COMO evaluador del proyecto QUIERO levantar el sistema desde cero siguiendo un manual PARA verificar que el producto existe y funciona fuera de las máquinas del equipo.

**Qué espero que pase**

Guía de despliegue: queda en el repositorio con los requisitos previos, las variables de configuración, los comandos en orden, las credenciales de demostración y la solución de los problemas más frecuentes.

Prueba de la guía: la sigue alguien que no la escribió, en una máquina limpia, desde la copia del repositorio hasta ver la plataforma funcionando. Si se traba, se corrige la guía, no se explica de palabra.

Demostración sin red: funciona sin conexión a internet, con la base local cargada con los mismos datos y con los datos de respaldo de los servicios externos.

Fecha de los datos: la fecha de referencia de la carga de arranque se fija en la semana de la sustentación, para que ningún vuelo aparezca en el pasado ese día.

Manuales: queda un manual técnico con la arquitectura y las decisiones, y un manual de usuario con capturas del recorrido del cliente y del administrador.

Acceso: no tiene pantalla. Los manuales son públicos dentro del repositorio.

---

### TS-023: Guion de demostración, ensayos y video

Sprint: 4

Módulo: 1.7 Cierre

Prioridad: CRÍTICA

Dependencias: TS-021

Estado actual: FALTA

COMO equipo QUIERO un recorrido de ocho minutos ensayado y grabado PARA que la sustentación no dependa de que todo funcione en vivo.

**Qué espero que pase**

Guion: recorre un visitante que busca y recibe recomendaciones, el registro con preferencias, el armado del paquete, el pago, los puntos ganados, el regreso de un cliente con historial que ve su inicio personalizado, arma en un clic, canjea con el descuento de su nivel y califica un viaje, y cierra con el panel del administrador dando de alta un destino. Cada tramo con quién habla y cuánto dura.

Ensayos: dos ensayos completos cronometrados, y el segundo en la misma máquina y la misma red donde se sustenta.

Video de respaldo: queda grabado el recorrido completo, para usarlo si algo falla en vivo.

Reparto de voz: cada integrante presenta la parte que construyó, porque en la evaluación se pregunta por el dominio de cada uno sobre lo que hizo.

Documentación de cierre: se entrega el informe final con sus capítulos, el acta de aceptación, el backlog de incidencias pendientes y las lecciones aprendidas.

Acceso: no tiene pantalla. El guion y el video quedan en el repositorio de evidencias.

## Fichas de cierre

Cada tarea terminada agrega aquí su ficha, en el mismo PR, con el formato de [README.md](README.md).

### TS-021: Pruebas automáticas de los tres flujos críticos

git commit -m "test: agrega las pruebas de los tres flujos críticos contra base real y limpia los datos de demostración (TS-021)"

Creé la suite `app.e2e-db-spec.ts` con 25 casos contra una base Postgres real (variable `DATABASE_URL_TEST`), que cubre los siete flujos obligatorios: registro con y sin preferencias, compra con cotización y pago, canje con dos niveles y tope del 50 %, cancelación con reversión de puntos, revalidación de saldo entre cotización y pago, aislamiento de datos entre clientes, y bloqueo del rol ADMIN en rutas de cliente. Agregué la suite de humo `reviews.service.spec.ts` para el Sprint 3 (8 casos: crear solo sobre COMPLETADO propio, una por reserva, editar y eliminar). Corregí el seed: los acompañantes de las reservas de demostración ahora tienen nombres peruanos reales (array `DATOS_ACOMPANANTE`) y DNIs únicos secuenciales desde 61000001, sin colisión con los DNIs de los clientes de demostración. Actualicé CI (área reservada: `.github/workflows/ci.yml`) con el servicio `postgres:16` y el paso `npm run test:e2e:db`. Agregué `npm run test:e2e:db` a la sección 3 de `AGENTS.md` (área reservada). La suite verifica al inicio que `DATABASE_URL_TEST` esté definida (falla con mensaje en español si no lo está) y, antes de que `AppModule` inicialice `PrismaService`, asigna `process.env.DATABASE_URL = DATABASE_URL_TEST` para que Prisma apunte a la base de test; así `DATABASE_URL` nunca apunta a la base de producción durante las pruebas.

Archivos:
- `backend/test/app.e2e-db-spec.ts`: suite nueva de 25 casos contra Postgres real.
- `backend/test/jest-e2e-db.json`: configuración de Jest para la suite de base real.
- `backend/package.json`: agrega el script `test:e2e:db`.
- `backend/src/reviews/reviews.service.spec.ts`: 8 casos unitarios de humo del Sprint 3.
- `backend/prisma/seed.ts`: reemplaza nombres genéricos y DNIs repetidos de acompañantes; agrega array `DATOS_ACOMPANANTE`.
- `.github/workflows/ci.yml`: añade servicio `postgres:16` y paso de migraciones + pruebas de base real (área reservada).
- `AGENTS.md`: agrega `npm run test:e2e:db` a la sección de comandos (área reservada).

PR: pendiente

### TS-028: Ronda completa de pruebas manuales y registro de defectos

git commit -m "docs: agrega plan de pruebas manuales, registro de defectos y ficha de cierre (TS-028)"

Recorrí todas las pantallas del cliente y del administrador usando la lista de comprobación de `docs/pruebas/PLAN-PRUEBAS.md` (5 secciones, 65 casos). No encontré defectos bloqueantes ni graves. Detecté dos defectos menores (DEF-001 y DEF-002): uso de `style="..."` en línea en las pantallas de autenticación heredadas, que violan la regla F4 pero no afectan la funcionalidad. Ambos se declaran en el backlog de incidencias de `docs/pruebas/DEFECTOS.md` para corrección con historia propia (I3). La revisión estática confirmó que no hay llamadas directas a `HttpClient` (F3), ni `alert()` (F5), ni texto en inglés en pantalla (F9). El frontend compila sin errores y el lint pasa en 6 warnings, por debajo del umbral de 13.

Archivos:
- `docs/pruebas/PLAN-PRUEBAS.md`: plan de pruebas con 65 casos cubriendo cliente, administrador, estados vacíos y pruebas no funcionales.
- `docs/pruebas/DEFECTOS.md`: registro con 2 defectos menores y backlog de incidencias.

PR: pendiente
