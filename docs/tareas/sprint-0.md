# Sprint 0 · Preparación

Semana 8 · 5 al 11 de octubre de 2026.

> Base técnica, datos y preparación de las herramientas de IA. Ninguna funcionalidad de usuario.
> Stack: Angular 17 + Tailwind · NestJS + Prisma · PostgreSQL en Supabase · Docker · Expertia Travel S.A.C.

El Sprint 0 se integró directo a `main`, antes de que rigieran las reglas de PR; desde el Sprint 1 todo entra por PR. Las tareas `QA-S0` salieron de recorrer el sistema completo en el navegador antes de cerrar el sprint.

## Historias

### TS-001: Contrato único de trabajo del repositorio

Sprint: 0

Módulo: Base técnica · transversal

Prioridad: CRÍTICA

Dependencias: Ninguna

Estado actual: HECHO

COMO Sistema QUIERO un único documento de convenciones versionado en el repositorio PARA que cualquier integrante, con la herramienta de IA que use, produzca código equivalente y revisable.

**Qué espero que pase**

Alcance del contrato: reúne las convenciones de backend y de frontend, las reglas de configuración y datos, la definición de terminado y la forma en que se encarga una tarea. No queda ningún dato pendiente de completar dentro del documento.

Compatibilidad entre herramientas: el mismo documento sirve para las tres herramientas que usa el equipo; una lo lee directamente y las otras dos mediante un archivo puntero que solo indica leerlo y obedecerlo. Las diferencias entre herramientas se anotan en una sección del propio contrato, nunca en archivos paralelos.

Reglas que el contrato fija: la lógica vive en el servicio y no en el controlador, toda entrada se valida con un objeto de transferencia, el dinero se maneja con tipo exacto y nunca con decimales flotantes, ningún secreto se escribe en el código, y todo cambio de esquema se acompaña de su versión y de los datos de arranque actualizados.

Vigencia: todo encargo posterior lo referencia, y un aporte que lo contradiga se devuelve citando la regla en lugar de corregirse a mano.

Acceso: no tiene pantalla. Lo modifican solo los responsables de integración.

---

### TS-002: Herramientas de verificación instaladas

Sprint: 0

Módulo: Base técnica · transversal

Prioridad: CRÍTICA

Dependencias: Ninguna

Estado actual: HECHO

COMO Sistema QUIERO que la revisión de estilo y las pruebas se ejecuten con los comandos documentados PARA que la definición de terminado se pueda cumplir en cualquier máquina.

**Qué espero que pase**

Problema que corrige: hoy los comandos de estilo y de pruebas fallan porque las herramientas no están instaladas en el proyecto, y la instalación limpia de la interfaz falla por una dependencia que nadie usa.

Resultado esperado: el comando de estilo corre y termina sin errores; el de pruebas corre y queda listo para recibir pruebas unitarias y de flujo completo; la instalación de la interfaz funciona sin banderas especiales.

Dependencias sin uso: se retiran las librerías heredadas de otro sistema, junto con las referencias que quedaron en la configuración del servidor de desarrollo.

Reglas heredadas: las reglas de estilo que el código heredado incumple en masa se bajan a advertencia y se listan en el aporte, en vez de bloquear al equipo desde el primer día.

Acceso: no tiene pantalla. Lo usa todo el equipo antes de proponer un aporte.

---

### TS-003: Historial de versiones del esquema de datos

Sprint: 0

Módulo: Base técnica · EDT 1.6 Despliegue

Prioridad: CRÍTICA

Dependencias: Ninguna

Estado actual: HECHO

COMO Sistema QUIERO que el esquema de la base tenga historial de versiones y una regla clara de quién lo aplica PARA que seis personas lo cambien sin borrarse datos entre sí.

**Qué espero que pase**

Versión inicial: existe una versión base generada del esquema actual y guardada en el repositorio, con la que cualquiera reconstruye la base desde cero y obtiene exactamente la misma estructura.

Regla de aplicación: cada integrante crea versiones nuevas contra su base local; la base compartida solo recibe versiones ya aprobadas, y las aplica un responsable de integración después de aceptar el aporte. Nadie más ejecuta cambios de estructura contra la base compartida.

Configuración: la conexión de trabajo y la conexión que se usa para aplicar versiones quedan como dos valores distintos en el archivo de configuración de ejemplo, cada uno con su comentario.

Acceso: no tiene pantalla. La base compartida la administran los responsables de integración.

---

### TS-025: Base compartida en la nube y conexión del equipo

Sprint: 0

Módulo: Base técnica · EDT 1.6 Despliegue

Prioridad: CRÍTICA

Dependencias: TS-003

Estado actual: HECHO EN PARTE: proyecto creado, respaldo, aviso de caída y usuario del equipo listos; falta crear las tablas y cargar los datos en la base compartida

COMO Sistema QUIERO una única base de datos en la nube, gratuita y compartida, a la que se conecten los seis PARA que todos trabajen sobre los mismos datos sin instalar ni administrar un motor de base.

**Qué espero que pase**

Conexión: los seis integrantes se conectan a la misma base con la cadena de conexión que está en la configuración de ejemplo; nadie instala un motor de base de datos en su máquina.

Límite de conexiones: la cadena de cada integrante limita el número de conexiones simultáneas que abre su copia del servicio, para que seis máquinas encendidas a la vez no agoten las conexiones disponibles del plan gratuito.

Respaldo: existe una copia de seguridad de la base, tomada al cierre de cada día de trabajo y guardada fuera de la nube, para poder restaurar si alguien borra datos por error.

Aviso de caída: si la base deja de responder, el equipo se entera el mismo día y hay un responsable único de restablecerla.

Acceso: no tiene pantalla. Las credenciales las manejan los responsables de integración.

---

### TS-004: Arranque local reproducible con contenedores

Sprint: 0

Módulo: Base técnica · EDT 1.6 Despliegue

Prioridad: CRÍTICA

Dependencias: TS-003

Estado actual: HECHO

COMO integrante del equipo QUIERO levantar todo el sistema en mi máquina con un solo comando PARA empezar a trabajar el mismo día sin pedir ayuda.

**Qué espero que pase**

Resultado esperado: copiar el archivo de configuración de ejemplo, ejecutar un solo comando de contenedores y en menos de cinco minutos tener la aplicación respondiendo en el navegador, conectada a la base compartida y con los usuarios de demostración funcionando.

Problema que corrige: hoy los contenedores levantan pero el guion de instalación del repositorio pertenece a otro proyecto y espera servicios que no existen, de modo que nunca termina.

Base local opcional: el mismo comando permite levantar además una base local, para quien necesite probar cambios de estructura sin tocar la compartida y para la demostración sin conexión.

Verificación de salud: la comprobación de estado del servicio falla si la base no responde; hoy responde que todo está bien aunque no haya ni una tabla.

Configuración y secretos: ninguna clave queda escrita en los archivos del proyecto, y el archivo de ejemplo lista todas las variables reales del sistema y ninguna heredada de otros proyectos.

Acceso: no tiene pantalla. Lo usa todo el equipo y queda documentado para quien evalúe el proyecto.

---

### TS-005: Datos de arranque repetibles

Sprint: 0

Módulo: Base técnica · EDT 1.6 Despliegue

Prioridad: ALTA

Dependencias: TS-003

Estado actual: HECHO

COMO Sistema QUIERO que la carga de datos de arranque dé siempre el mismo resultado PARA que las pruebas y la demostración no dependan de cuántas veces se ejecutó.

**Qué espero que pase**

Repetibilidad: ejecutar la carga dos veces seguidas deja exactamente la misma cantidad de registros que ejecutarla una sola vez. Hoy duplica todo lo que no tiene una clave que lo identifique.

Fechas: las fechas de los vuelos se calculan a partir de una fecha de referencia configurable, que por defecto es el día de ejecución, de modo que siempre existan vuelos futuros, incluido el día de la sustentación.

Corrección de datos: se corrigen las festividades asignadas a un destino que no les corresponde, y las credenciales de demostración que informa la carga coinciden con las de la documentación del repositorio.

Limpieza: los archivos compilados de la carga de datos dejan de estar versionados.

Acceso: no tiene pantalla. La ejecuta un responsable de integración.

---

### TS-014: Catálogo de datos, extras y datos de la agencia

Sprint: 0

Módulo: Base técnica · datos del catálogo

Prioridad: ALTA

Dependencias: TS-005

Estado actual: HECHO EN PARTE: faltan los datos reales de la agencia y las reseñas de demostración, que llegan con TS-024

COMO Sistema QUIERO un catálogo con variedad suficiente y clientes de demostración con historial coherente PARA poder demostrar filtros, niveles y recomendaciones con datos que resisten preguntas.

**Qué espero que pase**

Vuelos: cada destino tiene vuelos desde Lima en varias fechas, de distintas aerolíneas, con y sin escalas y en distintas clases, repartidos a lo largo de los cuatro meses siguientes a la fecha de referencia. Con diez vuelos en total no se puede demostrar ningún filtro.

Hoteles y actividades: cada destino tiene hoteles de distintas categorías y zonas, y actividades de cada tipo, con precios que permitan distinguir rangos.

Festividades: cada festividad del documento de concepto existe y está asociada al destino que le corresponde de verdad.

Clientes de demostración: uno sin compras, uno de nivel intermedio y uno de nivel alto, cada uno con viajes completados reales, su historial de puntos, sus reseñas y saldos que cuadran exactamente con ese historial. Varios de ellos con viajes al mismo destino, para que las recomendaciones por historial tengan de dónde salir.

Catálogo de extras: traslados y seguro de viaje con su precio, que hoy no existen en ninguna parte y sin los cuales el paso de extras no puede calcular su precio en el servidor.

Datos de la agencia: nombre, identificación, dirección, teléfono, correo y logotipo de Expertia Travel S.A.C., que se usan en la confirmación de compra, en el detalle imprimible del viaje y en el pie de la plataforma.

Datos de respaldo: quedan cargados los feriados y el clima promedio por destino y por mes que se usan cuando los servicios externos no responden.

Acceso: no tiene pantalla. Los datos se cargan con la carga de arranque.

---

### TS-015: Catálogo de servicios consultable

Sprint: 0

Módulo: Base técnica · transversal

Prioridad: CRÍTICA

Dependencias: Ninguna

Estado actual: HECHO

COMO Sistema QUIERO que todos los servicios disponibles estén publicados y se puedan probar desde el navegador PARA que quien hace pantallas no invente campos ni espere a que alguien le explique la respuesta.

**Qué espero que pase**

Contenido: se publican todos los servicios con los datos que reciben, los que devuelven y los errores posibles, y se pueden ejecutar desde ahí iniciando sesión con un usuario de demostración.

Congelamiento: el contrato queda congelado antes de repartir las pantallas de cada sprint. Si un servicio tiene que cambiar, primero se actualiza el catálogo y recién después se avisa a quien depende de él.

Autoridad: es la única fuente válida sobre cómo responde el sistema. Ninguna pantalla se construye sobre una suposición ni sobre un ejemplo pegado en el chat del grupo.

Acceso: disponible para todo el equipo mientras el proyecto está en desarrollo.

---

### TS-006: Limpieza del repositorio

Sprint: 0

Módulo: Base técnica · transversal

Prioridad: ALTA

Dependencias: Ninguna

Estado actual: HECHO EN PARTE: inventario del código heredado, README real y archivos de compilación fuera; el retiro del código sin uso espera la decisión de cada pieza en el inventario

COMO Sistema QUIERO que el repositorio contenga solo lo que se usa PARA que nadie arregle, extienda ni copie código muerto.

**Qué espero que pase**

Código sin uso: se eliminan las pantallas y piezas de interfaz que no están enlazadas a ninguna ruta ni las usa nadie, salvo la de cambio de contraseña, que se conserva porque se enruta en el sprint 1.

Archivos de compilación: dejan de estar versionados los archivos que genera la compilación, y los que ya estaban se quitan del repositorio.

Documentación del repositorio: la descripción del proyecto pasa a describir lo que existe de verdad, con los comandos reales y las credenciales de demostración reales, sin carpetas ni servicios que nunca se construyeron.

Avance previo: lo que exista en ramas de trabajo anteriores se revisa antes de borrar nada; se conserva lo que sirva y se descarta el resto, dejando constancia de qué se tomó.

Acceso: no tiene pantalla. El aporte lista los archivos eliminados con su razón.

---

### TS-007: Verificación automática de cada aporte

Sprint: 0

Módulo: Base técnica · transversal

Prioridad: CRÍTICA

Dependencias: TS-002

Estado actual: HECHO EN PARTE: la verificación corre en cada aporte; la rama principal no se puede proteger en el plan gratuito, así que la regla se cumple por acuerdo

COMO Sistema QUIERO que cada aporte se verifique solo antes de que lo lea una persona PARA que la revisión humana no se gaste en lo que una máquina detecta mejor.

**Qué espero que pase**

Qué se verifica: cada aporte dispara la compilación del servicio, la revisión de estilo, la compilación de la interfaz y las pruebas unitarias existentes. Un aporte que no pasa alguna queda marcado y no se revisa hasta que su autor lo corrija.

Rama principal: no se incorpora nada sin verificación en verde y sin la aprobación de un integrante distinto del autor; si toca un área reservada, la aprueba un responsable de integración. GitHub no lo bloquea en este repositorio privado del plan gratuito, así que se cumple por acuerdo.

Evidencia: se deja un aporte de prueba con un error de estilo, se comprueba que la verificación lo marca en rojo, y esa captura sirve como evidencia de control de calidad en el acta del sprint.

Acceso: no tiene pantalla. La configuración la mantienen los responsables de integración.

---

### TS-012: Motor único de fidelización

Sprint: 0

Módulo: 1.4.7 Fidelización (Puntos, Niveles y Canjes)

Prioridad: CRÍTICA

Dependencias: TS-002

Estado actual: HECHO

COMO Sistema QUIERO todas las reglas de puntos, niveles y canje en un solo lugar y con pruebas PARA que den el mismo resultado en cualquier pantalla del sistema.

**Qué espero que pase**

Reglas que concentra: cuántos puntos otorga una compra, que es uno por cada cien soles del total pagado; qué nivel corresponde según los viajes completados, Explorador de cero a dos, Viajero de tres a siete, Frecuente de ocho a catorce y Elite de quince en adelante; cuánto vale un canje, que es quinientos puntos igual a cincuenta soles exactos, y ese es el mínimo; qué descuento adicional otorga cada nivel cuando el cliente canjea, que es cero, cinco, diez y quince por ciento sobre el total del paquete; y el tope del canje, que es el cincuenta por ciento del paquete sumando puntos y nivel, de modo que los puntos que no caben se conservan.

Fuente única: la compra, la pantalla de puntos, el perfil y el panel de administración usan este motor, y no queda ninguna de estas constantes escrita en otro lado. Hoy están repartidas en tres partes distintas del sistema y el nivel se calcula de dos formas que pueden no coincidir.

Pruebas: quedan probados los límites exactos, cuatrocientos noventa y nueve contra quinientos puntos, el salto de dos a tres, de siete a ocho y de catorce a quince viajes, montos con céntimos, y que el descuento nunca supere el cincuenta por ciento del paquete.

Independencia: el motor funciona y se prueba completo desde este sprint aunque todavía ninguna pantalla lo use; lo que se conecta en el sprint 3 son las pantallas, no las reglas.

Acceso: no tiene pantalla. Lo consume el resto del sistema.

---

### TS-008: Navegación común y piezas visuales

Sprint: 0

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: TS-006

Estado actual: HECHO EN PARTE: falta pasar los colores y la tipografía de la maqueta

COMO visitante o cliente QUIERO una barra de navegación que esté siempre presente PARA moverme entre explorar, mi paquete, mis viajes y mi cuenta sin perderme.

**Qué espero que pase**

Navegación del visitante: ve explorar, contacto y las opciones de iniciar sesión y crear cuenta.

Navegación del cliente: ve inicio, explorar, mis viajes, mis puntos, perfil y cerrar sesión, con su nombre y su nivel de membresía visibles. Si tiene un paquete a medio armar, aparece además un acceso para continuarlo.

Piezas visuales reutilizables: quedan definidos los botones, tarjetas, campos de formulario, estrellas de calificación, estado de carga y estado vacío que todas las demás pantallas copian, tomando colores, tipografía y espaciados de la maqueta de referencia del proyecto.

Pantallas angostas: en un teléfono la navegación se reduce a un menú, ninguna pantalla se corta y ningún contenido obliga a desplazarse en horizontal. Toda pantalla que se construya después se revisa también en ancho de teléfono.

Acceso: la barra es visible para todos; su contenido cambia según haya o no sesión iniciada.

---

### TS-009: Armador dividido en pasos

Sprint: 0

Módulo: 1.4.2 Búsqueda y Armado de Paquetes

Prioridad: CRÍTICA

Dependencias: Ninguna

Estado actual: HECHO

COMO Sistema QUIERO el armador de paquetes dividido en un contenedor, un componente por paso y un lugar único donde vive lo que el cliente va eligiendo PARA que varias personas trabajen en pasos distintos sin pisarse y para que lo elegido se pueda guardar.

**Qué espero que pase**

Estructura: un contenedor muestra el indicador de pasos y la navegación hacia adelante y hacia atrás, y cada uno de los seis pasos vive por separado. Nada más: sin capas ni abstracciones adicionales, porque el tiempo es corto.

Estado del paquete: todo lo que el cliente elige, vuelo, fechas, pasajeros, hotel, actividades, extras y puntos a canjear, vive en un solo lugar y se puede convertir a texto para guardarlo. Volver a un paso anterior conserva lo ya elegido.

Sin cambios visibles: al terminar, el armador se ve y se comporta igual que hoy. Esta tarea no agrega funcionalidad y sirve de plantilla para todos los pasos que se construyen después.

Acceso: hereda el acceso actual del armador; no lo modifica.

---

### TS-026: Instrucciones y límites para las herramientas de IA

Sprint: 0

Módulo: Base técnica · transversal

Prioridad: CRÍTICA

Dependencias: TS-001

Estado actual: HECHO

COMO Sistema QUIERO que las herramientas de IA del equipo trabajen con instrucciones estrictas y límites explícitos PARA que seis personas con distinto nivel entreguen código parejo y revisable.

**Qué espero que pase**

Instrucciones por tarea: cada encargo entregado a una herramienta de IA incluye la historia con su criterio de aceptación, los archivos que puede tocar, los archivos que tiene prohibido tocar, el servicio y la pantalla de referencia que debe copiar, y el comando con el que se verifica el resultado.

Límites del sistema: queda escrito que las herramientas de IA no modifican el esquema de datos ni sus versiones, el cálculo de precios, el motor de fidelización, la transacción de pago ni la autenticación. Esas cinco áreas las escriben los responsables de integración.

Explicación obligatoria: cada entrega incluye tres líneas escritas por la persona, no por la herramienta, explicando qué hace lo que entregó. Sin esas tres líneas el aporte no se revisa.

Verificación visual: toda pantalla se contrasta con la maqueta de referencia antes de entregarse, y se revisa además en ancho de teléfono.

Registro: queda constancia de qué herramienta se usó en cada entrega y qué validó la persona, porque el informe final del curso exige declarar el uso de inteligencia artificial, su propósito y cómo se validó.

Acceso: no tiene pantalla. Lo mantienen los responsables de integración.

## Fichas de cierre

### TS-001: Contrato único del repositorio

git commit -m "docs: establece AGENTS.md como contrato único y CLAUDE.md como puntero (TS-001)"

Escribí las reglas del repositorio en un solo archivo, `AGENTS.md`, que leen igual Claude Code, Kiro y OpenCode. Cubre el stack, los comandos permitidos, las reglas de backend (B1–B9), frontend (F1–F9), datos (D1–D7), las áreas reservadas, el trabajo con IA (I1–I7), git (G1–G4), la definición de terminado, las reglas fijas del dominio y cómo tratar el código heredado. `CLAUDE.md` solo apunta a `AGENTS.md`, para que no existan reglas distintas por herramienta.

Archivos:
- `AGENTS.md`: el contrato completo.
- `CLAUDE.md`: puntero a `AGENTS.md`.
- `.gitignore`: deja fuera la configuración personal de cada herramienta (`.claude/settings.local.json`, `.kiro/`, `.opencode/`).

---

### TS-026: Plantillas de encargo y de PR

git commit -m "docs: agrega plantilla de encargo y plantilla de PR (TS-026)"
git commit -m "docs: agrega la ficha de cierre por tarea y la exige en la definición de terminado (TS-026)"
git commit -m "docs: integra en el repositorio las historias de los sprints 0 a 4 (TS-026)"

Dejé dos plantillas. La de encargo dice qué se le entrega a una herramienta de IA antes de pedirle una tarea: historia, criterio de aceptación, archivos que puede y no puede tocar, referencia a copiar y comando de verificación. Trae un ejemplo lleno. La de PR exige las tres líneas escritas por la persona, la herramienta y el modelo usados, y la lista de verificación. Al cerrar el sprint agregué la ficha de cierre: cada tarea terminada deja en `docs/tareas/` qué se hizo, con qué commit y en qué archivos, en el mismo PR. Quedó como parte de la definición de terminado, en la plantilla de PR y en la de encargo. Por último pasé al repositorio las historias de los sprints 0 a 4: cada archivo de `docs/tareas/` tiene las historias del sprint y debajo sus fichas, y el encargo copia la historia de ahí.

Archivos:
- `docs/encargos/PLANTILLA.md`: plantilla de encargo con ejemplo; pide redactar la ficha al terminar.
- `.github/pull_request_template.md`: plantilla que GitHub carga en cada PR, con la casilla de la ficha.
- `docs/tareas/README.md`: formato de la ficha y ejemplo.
- `docs/tareas/sprint-0.md`: historias y fichas de este sprint.
- `docs/tareas/sprint-1.md` a `sprint-4.md`: historias de los sprints siguientes, con su estado al cierre del Sprint 0.
- `AGENTS.md`: la ficha en la definición de terminado (§10).

---

### TS-002: Lint y pruebas

git commit -m "build: instala lint y pruebas, retira dependencias heredadas (TS-002)"

El repositorio no tenía lint configurado ni ninguna prueba. Agregué ESLint, Jest y Supertest al backend, con una prueba unitaria y una de flujo completo de base sobre las que se construyen las demás. `npm run lint` ahora solo revisa (`lint:fix` corrige) y el build pasa a `nest build`. Retiré las dependencias de WebSocket y de gráficos que venían del sistema anterior y que nada usa: `socket.io`, `@nestjs/websockets` y `@nestjs/platform-socket.io` en el backend; `socket.io-client`, `chart.js` y `ng2-charts` en el frontend. Quité también el proxy de `/socket.io/`.

Archivos:
- `backend/package.json`: scripts `lint`, `lint:fix`, `test`, `test:e2e`, `test:cov` y dependencias de prueba.
- `backend/.eslintrc.js`: reglas de estilo.
- `backend/src/app.controller.spec.ts` y `backend/test/`: primeras pruebas y configuración de e2e.
- `backend/nest-cli.json`: renombrado desde `.nestcli.json`, que Nest no leía.
- `backend/tsconfig.json`, `backend/tsconfig.build.json`: incluyen las pruebas y separan la salida.
- `frontend/package.json`, `frontend/nginx.conf`, `frontend/proxy.conf.json`: sin dependencias ni proxys del sistema anterior.

---

### TS-006: Inventario del código heredado y README real

git commit -m "docs: inventaría el código heredado con estado y recomendación (TS-006)"
git commit -m "docs: describe en el README el repo real, comandos y credenciales demo (TS-006)"

Revisé pieza por pieza el código que ya estaba y lo dejé en una tabla: qué hace, si se usa (con la evidencia), qué choca con `AGENTS.md` y una recomendación de conservar, rehacer o retirar. El hallazgo principal es que el repositorio mezcla dos sistemas: las pantallas enrutadas son de AeroCRM y las no enrutadas son de un CRM de aerolínea anterior que no compila si se enruta. La columna Decisión queda vacía para los responsables de integración. Reescribí el README con lo que el repositorio hace hoy: stack, arranque, usuarios de demostración, comandos y estructura. Saqué del repositorio los `tsbuildinfo` versionados.

Archivos:
- `docs/HEREDADO.md`: inventario completo.
- `README.md`: reescrito.
- `backend/tsconfig.tsbuildinfo`, `backend/tsconfig.build.tsbuildinfo`: eliminados y agregados al `.gitignore`.

---

### TS-003: Migración base y conexiones separadas

git commit -m "build: agrega migración base y separa DATABASE_URL de DIRECT_URL (TS-003)"

El esquema no tenía migraciones; la base se armaba con lo que hubiera en `schema.prisma`. Generé la migración inicial a partir del esquema existente, sin cambiar ninguna tabla, para que la base compartida y las locales se construyan igual. Separé la conexión de trabajo (`DATABASE_URL`, por el pooler de Supabase) de la que aplica migraciones (`DIRECT_URL`). Fijé los saltos de línea de los `.sql` en LF, porque Prisma compara las migraciones por checksum y en Windows cambiaban.

Archivos:
- `backend/prisma/migrations/20261006080000_init/migration.sql`: migración inicial.
- `backend/prisma/schema.prisma`: `directUrl`.
- `backend/.env.example`: las dos conexiones explicadas.
- `.gitattributes`: `eol=lf` para `.sql`, `.sh` y `.toml`.

Base de datos: migración `20261006080000_init`, equivalente al esquema heredado.

---

### TS-012: Motor único de fidelización

git commit -m "refactor: concentra las reglas de fidelización en un motor único con pruebas de límites (TS-012)"
git commit -m "feat: limita el canje al 50 % del paquete y separa puntos disponibles del histórico (TS-012)"

Las reglas de puntos, niveles y canje estaban repartidas entre servicios y repetidas en el frontend. Las concentré en `loyalty.rules.ts`, un archivo de funciones puras que trabaja en céntimos enteros. Reservas, clientes y la pantalla de puntos lo usan, y el frontend solo muestra lo que devuelve la API. El descuento adicional por nivel ahora se aplica sobre el total del paquete. Agregué `POST /api/loyalty/redemption-preview` para que el armador muestre el canje sin registrarlo. Después agregué el tope: el descuento total (puntos más nivel) llega como máximo al 50 % del paquete; si el cliente tiene más puntos de los que caben, se usan solo los necesarios y el resto se le queda, y si no caben ni los 500 mínimos el canje no se permite y la pantalla dice por qué. La pantalla de puntos muestra en grande los disponibles para canjear, con su valor en soles, y en chico el histórico acumulado.

Archivos:
- `backend/src/loyalty/loyalty.rules.ts`: constantes y funciones del motor, con `MAX_REDEEM_PERCENT` y `computeRedemption`.
- `backend/src/loyalty/loyalty.rules.spec.ts`: 27 pruebas de límites (499 contra 500 puntos, saltos de nivel, céntimos, el tope y el paquete donde no cabe el mínimo).
- `backend/src/loyalty/loyalty.service.ts`, `loyalty.controller.ts`, `dto/redemption-preview.dto.ts`: estado, historial y vista previa del canje.
- `backend/src/bookings/bookings.service.ts`, `backend/src/clients/clients.service.ts`: usan el motor en lugar de calcular por su cuenta.
- `frontend/src/app/features/loyalty/loyalty.component.ts`, `home/home.component.ts`, `packages/steps/step-summary.component.ts`: muestran disponibles, histórico, avance y canje que vienen de la API.
- `docs/fidelizacion.md`: reglas, ejemplos con el tope y endpoints.

---

### TS-004: Arranque reproducible con Docker

git commit -m "build: arranque reproducible con Docker, base local opcional y healthcheck real (TS-004)"

El sistema completo levanta con `docker compose up -d --build` contra la base de `backend/.env`, sin ninguna clave escrita en el compose. Con `docker-compose.local.yml` levanta además PostgreSQL 16 en `localhost:5433`, aplica las migraciones y carga los datos de arranque; sirve para probar cambios de esquema y para la demostración sin internet. `/api/health` ahora consulta la base y responde 503 si no contesta, y Docker usa ese chequeo para dar por sano al backend. Los Dockerfile instalan con `npm ci` y el del backend se separó en dos etapas. Retiré `setup.sh`, que repetía a mano lo que ahora hace el compose.

Archivos:
- `docker-compose.yml`: backend y frontend contra la base de `.env`.
- `docker-compose.local.yml`: base local y el servicio `db-init`, que migra y carga datos una vez y termina.
- `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore`: builds reproducibles.
- `backend/src/app.controller.ts` y su prueba: salud con consulta a la base.
- `frontend/src/environments/`: sin la URL de WebSocket del sistema anterior.

---

### TS-005: Carga de arranque idempotente

git commit -m "fix: vuelve idempotente la carga de arranque con fecha de referencia configurable (TS-005)"

La carga de arranque usaba `createMany` con `skipDuplicates`, que solo evita duplicados donde la tabla tiene una restricción única, y tenía diez vuelos con fechas fijas. Ahora busca cada registro por su clave natural (IATA, destino más nombre, número de vuelo, correo) y lo actualiza o lo crea, así que correrla dos veces deja lo mismo. Las fechas de los vuelos se calculan desde `SEED_REFERENCE_DATE` o desde el día en que se corre. Separé los datos en archivos por tema y saqué los `seed.js` compilados que estaban versionados.

Archivos:
- `backend/prisma/seed.ts`: carga con upserts por clave natural.
- `backend/prisma/seed-data/catalog.ts`, `flights.ts`, `users.ts`: datos separados por tema.
- `backend/prisma/seed.js`, `seed.js.map`, `seed.d.ts`: eliminados y agregados al `.gitignore`.

---

### TS-014: Catálogo completo y datos de respaldo

git commit -m "feat: amplía el catálogo y agrega extras, agencia, clima, feriados e historial demo (TS-014)"

Amplié el catálogo a 11 destinos (agregué Río de Janeiro y corregí el Carnaval de Río), con hoteles de 3 a 5 estrellas y actividades de cada tipo por destino. Agregué a la base los extras con precio, los datos de la agencia, el clima promedio por destino y mes, y los feriados nacionales de fecha fija, que son el respaldo cuando las APIs externas no responden. Los tres clientes de demostración tienen historial de compras, y sus puntos, nivel y saldo se calculan con el motor de fidelización recorriendo ese historial, así que siempre cuadran. Los datos reales de la agencia quedaron marcados `[COMPLETAR]`.

Archivos:
- `backend/prisma/schema.prisma`: modelos `ExtraOption`, `AgencyInfo`, `DestinationClimate` y `Holiday`.
- `backend/prisma/seed-data/reference.ts`: extras, agencia, clima y feriados.
- `backend/prisma/seed-data/history.ts`: historial de los clientes demo.
- `backend/prisma/seed-data/catalog.ts`, `flights.ts`, `seed.ts`: catálogo ampliado.
- `docs/datos-de-arranque.md`: qué carga y cómo agregar datos.

Base de datos: migración `20261006090000_catalogo_extras_agencia_respaldo`, con el enum `ExtraPricing` (`POR_RESERVA`, `POR_PASAJERO`) y las cuatro tablas nuevas.

---

### TS-025: Base compartida, respaldo, aviso de caída y accesos

git commit -m "build: agrega respaldo diario y aviso de caída de la base compartida (TS-025)"
git commit -m "docs: documenta los accesos del equipo y crea el usuario restringido de la base compartida (TS-025)"

Creé el proyecto `aerocrm` en Supabase (São Paulo, plan gratuito) como base compartida. Dejé un script de respaldo para Windows y para macOS/Linux que guarda el volcado fuera de la nube y del repositorio, con los 14 más recientes, y un flujo de GitHub que consulta la base cada mañana: avisa por correo si no responde y evita que Supabase pause el proyecto por inactividad. Después separé los usuarios de la base: el equipo entra con `aerocrm_equipo`, que lee y escribe datos pero no puede cambiar la estructura, y solo quien aplica migraciones usa `postgres`. Así, un `prisma migrate dev` o `db push` corrido por error contra la base compartida falla en lugar de borrarla. El mismo script le quita a la API automática de Supabase el acceso a nuestras tablas, porque el sistema no la usa. Para migrar y cargar datos en la base compartida dejé un script que toma las cadenas de `postgres` de `backend/.env.compartida`, así quien integra no tiene que cambiar su `backend/.env` y su entorno local sigue igual. Documenté qué accesos hay y cómo se piden, sin ningún valor secreto en el repositorio.

Archivos:
- `docs/BASE-DE-DATOS.md`: conexión, primera puesta en marcha, cambios de esquema, respaldo y caídas.
- `docs/ACCESOS.md`: accesos, quién los tiene y los dos usuarios de la base.
- `scripts/supabase-usuarios.sql`: usuario `aerocrm_equipo` y permisos.
- `scripts/db-compartida.ps1`, `scripts/db-compartida.sh`: migrar y cargar datos en la base compartida con `backend/.env.compartida`, sin tocar `backend/.env`.
- `backend/.env.compartida.example`: plantilla de ese archivo, con el host del pooler.
- `scripts/db-backup.ps1`, `scripts/db-backup.sh`: respaldo.
- `.github/workflows/db-health.yml`: aviso diario de caída.
- `backend/.env.example`, `README.md`: las cadenas usan el usuario del equipo.

Base de datos: usuario `aerocrm_equipo` con lectura y escritura sobre las tablas de `public` y sin permiso para crear objetos; los roles `anon` y `authenticated` de Supabase sin acceso a nuestras tablas.

---

### TS-015: Catálogo de servicios en Swagger

git commit -m "feat: publica el catálogo Swagger con autenticación bearer (TS-015)"

Publiqué la documentación de la API en `/api/docs`, con el botón Authorize para probar los servicios protegidos con el token de un usuario de demostración. El plugin de Swagger lee los decoradores de validación y los comentarios de los DTO, así que los campos se documentan solos. Agregué a cada controller el resumen de cada endpoint, sus errores posibles y los parámetros de consulta.

Archivos:
- `backend/src/main.ts`: configuración de Swagger.
- `backend/nest-cli.json`: plugin de Swagger.
- `backend/src/*/*.controller.ts` (auth, bookings, clients, contact, destinations, loyalty y el de salud): decoradores de documentación.
- `docs/api.md`: cómo probar un servicio y cómo documentar uno nuevo.

---

### TS-007: Verificación automática en cada PR

git commit -m "ci: verifica lint, build y pruebas en cada PR (TS-007)"

Cada PR corre en GitHub lint, build, pruebas unitarias y de flujo completo del backend, y el build del frontend. Las pruebas no necesitan base de datos. El lint acepta hasta 13 advertencias, que son las del código heredado: una más hace fallar la verificación, para que no se acumulen nuevas.

Archivos:
- `.github/workflows/ci.yml`: los dos trabajos, backend y frontend.
- `backend/.eslintrc.js`: ajuste de reglas para las advertencias heredadas.

---

### TS-009: Armador en pasos con estado único

git commit -m "refactor: divide el armador en contenedor, pasos y estado único (TS-009)"

El armador era un solo componente grande. Lo separé en un contenedor que maneja el indicador de pasos y la carga de datos, un componente por paso (vuelo, destino, hotel, actividades, extras y resumen) y un servicio de estado con signals donde vive todo lo elegido. Así cada historia del armador toca un solo paso. El estado se puede convertir a texto y restaurar, como base para guardar el paquete en curso.

Archivos:
- `frontend/src/app/features/packages/package-builder.component.ts`: contenedor.
- `frontend/src/app/features/packages/package-builder.state.ts`: estado del paquete.
- `frontend/src/app/features/packages/steps/`: los seis pasos.
- `docs/armador.md`: estructura y cómo agregar un paso.

---

### TS-008: Navegación común y piezas base de la interfaz

git commit -m "feat: agrega navegación común y piezas visuales base (TS-008)"

Agregué una barra de navegación única para todo el sistema, con enlaces distintos para visitante y para cliente con sesión, y el acceso «Continuar paquete» cuando hay uno en curso: el paquete se guarda en el navegador y se retoma al volver. Las pantallas de login y registro ocupan todo el ancho y el resto va dentro de un contenedor centrado. Dejé seis piezas base para construir pantallas sin repetir estilos: botón, tarjeta, campo de formulario, estrellas, estado de carga y estado vacío. La paleta y la tipografía quedaron marcadas `[AJUSTAR]` hasta pasarlas desde la maqueta.

Archivos:
- `frontend/src/app/core/layout/navbar/navbar.component.ts`: barra de navegación.
- `frontend/src/app/shared/ui/`: las seis piezas base y su `index.ts`.
- `frontend/src/app/app.component.ts`, `app.routes.ts`: barra común y pantallas de ancho completo.
- `frontend/src/app/features/packages/package-builder.state.ts`: guarda y retoma el paquete en curso.
- `frontend/tailwind.config.js`, `src/styles.scss`, `src/index.html`: tokens de color y tipografía.
- `docs/interfaz.md`: cómo usar la barra y las piezas.

---

### QA-S0: Textos y errores en español

git commit -m "fix: muestra en español mensajes de validación, errores y valores de la interfaz (QA-S0)"

Había textos en inglés en pantalla y la API respondía los errores en inglés. Ahora los mensajes de validación de los DTO salen en español con el nombre del campo traducido, y los errores 401, 403, 404 y 500 tienen un mensaje fijo en español; el detalle de un error inesperado queda solo en el log del servidor. Las pruebas de flujo completo arman la aplicación igual que el servidor, para que prueben los mismos mensajes. En el frontend, los valores de enum se muestran con el pipe `etiqueta`, los errores de la API con `apiErrorMessage` y las fechas en es-PE. Agregué la regla F9 al contrato.

Archivos:
- `backend/src/common/validation.ts` y su prueba: traducción de los mensajes de validación (`FIELD_LABELS`).
- `backend/src/common/http-messages.filter.ts`: mensajes fijos por código de error.
- `backend/src/app.setup.ts`: configuración compartida por el servidor y las pruebas.
- `frontend/src/app/shared/pipes/label.pipe.ts`: pipe `etiqueta`.
- `frontend/src/app/core/services/api-error.ts`: mensaje de error para mostrar.
- `frontend/src/app/app.config.ts`: idioma es-PE.
- Pantallas de login, registro, contacto, inicio, destino, búsqueda, mis viajes, detalle, puntos y armador: textos en español.

---

### QA-S0: Clima y feriados de respaldo

git commit -m "feat: usa clima y feriados de respaldo cuando las APIs externas no responden (QA-S0)"

Si OpenWeatherMap o Calendarific no responden o no hay clave configurada, el contexto del destino usa el clima promedio del mes y los feriados guardados en la base, y lo marca como promedio. Ninguna pantalla queda en blanco. Corregí también la búsqueda sin origen, que tomaba por error el primer destino de la tabla como origen.

Archivos:
- `backend/src/destinations/destinations.service.ts`: respaldo de clima y feriados, y el filtro de origen.

---

### QA-S0: Volver a la página de origen al iniciar sesión

git commit -m "fix: vuelve a la página de origen al iniciar sesión y descarta sesiones vencidas (QA-S0)"

Al entrar a una pantalla que pide sesión, el login ahora devuelve al usuario a esa pantalla y no al inicio. Solo acepta rutas internas como destino. Si la API responde 401 por una sesión vencida, se cierra la sesión y se lleva al login con la misma vuelta; un token vencido guardado en el navegador se descarta al cargar la aplicación.

Archivos:
- `frontend/src/app/core/guards/auth.guard.ts`: `returnUrl` y validación de la ruta.
- `frontend/src/app/core/interceptors/auth.interceptor.ts`: manejo del 401.
- `frontend/src/app/core/services/auth.service.ts`: descarte del token vencido.
- `frontend/src/app/features/auth/login/`, `register/`: navegan a la página de origen.

---

### QA-S0: Búsqueda de vuelos con fechas cercanas

git commit -m "fix: busca vuelos ±3 días de la fecha elegida y muestra la duración (QA-S0)"
git commit -m "fix: aplica los ±3 días en la búsqueda aunque no se envíe flexDays (QA-S0)"

La búsqueda solo encontraba vuelos del día exacto, así que casi siempre salía vacía. Ahora busca entre 3 días antes y 3 después (configurable hasta 7 con `flexDays`), ordena por cercanía a la fecha pedida y cada vuelo indica cuántos días antes o después sale. La duración se muestra en horas y minutos. Los vuelos de la carga de arranque salen cada 7 días, así que cualquier fecha de los próximos cuatro meses encuentra vuelos. El valor por defecto de `flexDays` no se aplicaba cuando la pantalla no lo enviaba; ahora se fija en el controller y hay pruebas del rango.

Archivos:
- `backend/src/destinations/destinations.service.ts`, `destinations.controller.ts`: rango de fechas, orden y `daysFromRequested`.
- `backend/src/destinations/destinations.service.spec.ts`: pruebas del rango.
- `backend/prisma/seed-data/flights.ts`: vuelos cada 7 días.
- `frontend/src/app/features/search/search.component.ts`: aviso de días de diferencia y fecha mínima.
- `frontend/src/app/shared/pipes/duration.pipe.ts`: pipe `duracion`.

---

### QA-S0: Armador para visitantes y paquete con dueño

git commit -m "fix: el visitante arma su paquete y el paquete en curso pertenece a quien lo armó (QA-S0)"
git commit -m "fix: guía al visitante sin vuelo elegido y cobra en el armador el total que calcula el canje (QA-S0)"

Un visitante puede armar el paquete completo sin cuenta. Al confirmar se le pide iniciar sesión y vuelve al resumen con el paquete intacto, que pasa a ser suyo. El paquete en curso ahora guarda a quién pertenece: al cerrar sesión se descarta y otro usuario no ve el paquete ajeno. Si se entra al armador sin haber elegido vuelo, aparece una guía hacia el buscador en lugar de la pantalla vacía. En el resumen, el botón de pagar muestra el total final que calcula el backend, y el canje se vuelve a pedir cada vez que se entra al resumen.

Archivos:
- `frontend/src/app/app.routes.ts`: `packages/new` sin exigir sesión.
- `frontend/src/app/features/packages/package-builder.state.ts`: dueño del paquete (versión 2 del borrador guardado).
- `frontend/src/app/features/packages/package-builder.component.ts`: guía cuando no hay vuelo.
- `frontend/src/app/features/packages/steps/step-summary.component.ts`: inicio de sesión para confirmar y total a pagar.
- `docs/armador.md`: visitantes, dueño del paquete y pendientes.

---

### QA-S0: Fechas de hotel, actividades por pasajero y extras en el detalle

git commit -m "fix: precarga fechas de hotel sin desfase, cobra actividades por pasajero y muestra extras en el detalle (QA-S0)"

Las fechas del hotel salían un día corridas y vacías. Ahora se precargan con la llegada del vuelo y siete noches después, sin desfase por zona horaria. Las actividades se cobran por pasajero y la pantalla lo indica. El detalle del viaje muestra los extras comprados, la cantidad de cada actividad, el descuento y las fechas como "Entrada" y "Salida". El precio guardado de cada actividad en la reserva es ahora el total de la línea, igual que el de vuelos y hotel.

Archivos:
- `frontend/src/app/features/packages/package-builder.state.ts`: fechas precargadas y total de actividades.
- `frontend/src/app/features/packages/steps/step-activities.component.ts`, `step-summary.component.ts`: precio por persona y cantidad.
- `frontend/src/app/features/my-trips/trip-detail.component.ts`: extras, cantidades, descuento y fechas.
- `backend/src/bookings/bookings.service.ts`: total de la línea de actividad.

---

### QA-S0: Menú compacto en pantallas medianas

git commit -m "fix: usa el menú compacto por debajo de 1024 px (QA-S0)"

En pantallas entre 768 y 1024 px el menú completo no entraba en la barra. Ahora se usa el menú compacto por debajo de 1024 px.

Archivos:
- `frontend/src/app/core/layout/navbar/navbar.component.ts`: cambio de punto de corte.
- `docs/interfaz.md`: punto de corte actualizado.

---

### QA-S0: .gitignore completo

git commit -m "chore: completa el .gitignore (QA-S0)"

El `.gitignore` solo cubría `backend/.env` y traía restos de otro proyecto. Ahora deja fuera cualquier `.env` en cualquier carpeta (salvo `.env.example`), reportes de cobertura, volcados de base, llaves y certificados, y el `docker-compose.override.yml` de cada uno.

Archivos:
- `.gitignore`.

## Pendiente al cerrar el sprint

- Vuelo de regreso en el paquete: solo hay vuelo de ida.
- Servicio de extras desde la base: hoy los precios están escritos en la pantalla y el seguro se cobra una sola vez aunque es por pasajero.
- Precios del paquete calculados en el servidor (AGENTS.md B6): el frontend todavía envía los precios al confirmar.
- Cancelar una reserva no devuelve los puntos canjeados ni quita los ganados.
- Desde el detalle de un destino, el botón de buscar lleva a una pantalla que pide sesión.
- Columna Decisión de `docs/HEREDADO.md` y datos reales de la agencia.
