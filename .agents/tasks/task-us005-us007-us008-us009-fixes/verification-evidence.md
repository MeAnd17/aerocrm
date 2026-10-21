# Evidencia de verificación — Iteración 2 (post-CHANGES_REQUESTED)

Fecha: 2025-10-21  
Rama: `feat/us005-us007-us008-us009-fixes`  
Commit: `3bbe1c8`

---

## Hallazgos corregidos

### 1. Festividades del destino no cruzan año (`destinations.service.ts`)
`matchingFestivities` ahora itera el rango de años del viaje (igual que `fallbackHolidays`).
Para festividades que cruzan de año (`endMonth < startMonth`), el año del final se incrementa en uno.
Se usan fechas UTC (`Date.UTC`) para consistencia con el resto del servicio.

### 2. Error de documento duplicado silencioso (`profile.component.ts`)
`addTraveler` fue convertido de `.subscribe(fn)` a `.subscribe({ next, error })`.
El handler de error llama a `this.toast.error(apiErrorMessage(err, 'No se pudo guardar el viajero'))`,
mostrando el mensaje `Ya tienes un viajero con ese documento` que devuelve el backend en el 400.
Se añadió el import de `apiErrorMessage` desde `../../core/services/api-error`.

### 3. ToastService omitido en error de carga de destinos (`destinations-list.component.ts`)
Se inyectó `ToastService` en el constructor y se añadió el import de `apiErrorMessage`.
El bloque `error:` de `ngOnInit` ahora muestra
`this.toast.error(apiErrorMessage(err, 'No pudimos cargar los destinos'))` además de apagar `loading`.

---

## Resultados de verificación

### Backend lint
```
> eslint "{src,test}/**/*.ts"
✖ 12 problems (0 errors, 12 warnings)
Exit Code: 0
```
(Todas las advertencias son `no-explicit-any` preexistentes, sin errores nuevos.)

### Backend tests
```
> jest
Test Suites: 4 passed, 4 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        1.903 s
Exit Code: 0
```

### Backend build
```
> nest build
Exit Code: 0
```

### Frontend build
```
> ng build --configuration production
Application bundle generation complete. [3.334 seconds]
Output location: frontend/dist/aerocrm
Exit Code: 0
```

---

## Archivos modificados
- `backend/src/destinations/destinations.service.ts`
- `frontend/src/app/features/destinations/destinations-list.component.ts`
- `frontend/src/app/features/profile/profile.component.ts`
