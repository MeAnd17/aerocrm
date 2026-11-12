# Registro de defectos — AeroCRM Sprint 4 (TS-028)

Fecha: 2026-11-11
Entorno: Docker Compose local, branch `feat/sprint4-pruebas-cierre`.

Clasificación: **B** = Bloqueante · **G** = Grave · **M** = Menor

---

## Defectos encontrados en la ronda

### DEF-001 · M · Estilos en línea en la pantalla de login del cliente

**Pantalla:** `/client/login` (`client-login.component.ts`)
**Pasos para reproducir:** Abrir cualquier navegador y acceder a la URL.
**Esperado:** Estilos aplicados mediante clases de Tailwind (regla F4).
**Ocurre:** La pantalla usa extensamente `style="..."` en línea para fondos, colores y dimensiones.
**Captura:** Revisión estática — no afecta funcionamiento.
**Acción:** Corregir en historia propia (regla I3). Declarado en backlog de incidencias.

---

### DEF-002 · M · `style="background:#050d1a"` en shell del login de staff

**Pantalla:** `/staff/login` (`staff-login.component.ts`)
**Pasos para reproducir:** Revisión estática del archivo.
**Esperado:** Clases Tailwind (F4).
**Ocurre:** Mismo patrón que DEF-001, en menor escala.
**Acción:** Backlog de incidencias.

---

## Defectos descartados (falsos positivos)

| ID | Descripción | Razón del descarte |
|----|-------------|-------------------|
| — | Warnings de lint `no-explicit-any` en archivos de test | Los tests usan `as any` para mockear con libertad; aceptable en tests; solo warnings, no errores |
| — | `style="..."` en componentes de autenticación heredados | Código preexistente, regla H1 impide corrección de pasada |

---

## Resumen

| Clasificación | Cantidad | Corregidos antes de la entrega | En backlog |
|---------------|----------|-------------------------------|------------|
| Bloqueante    | 0        | —                             | —          |
| Grave         | 0        | —                             | —          |
| Menor         | 2        | 0                             | 2          |

Los defectos menores (DEF-001, DEF-002) son violaciones F4 en componentes de autenticación heredados. No afectan la funcionalidad ni la experiencia durante la demostración.

---

## Backlog de incidencias

| ID | Historia sugerida | Descripción breve |
|----|-------------------|-------------------|
| INC-001 | feat: elimina estilos en línea del login de cliente | Reemplazar `style="..."` por clases Tailwind en `client-login.component.ts` |
| INC-002 | feat: elimina estilos en línea del login de staff | Reemplazar `style="..."` por clases Tailwind en `staff-login.component.ts` |
