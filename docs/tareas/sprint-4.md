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
