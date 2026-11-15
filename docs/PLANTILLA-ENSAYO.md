# Plantilla de ensayo — AeroCRM (TS-023)

Realizar dos ensayos completos cronometrados antes de la sustentación.
El segundo ensayo en la misma máquina y la misma red donde se va a sustentar.

---

## Checklist previo al ensayo

- [ ] `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build` ejecutado y sin errores
- [ ] `docker inspect aerocrm-db-init --format '{{.State.ExitCode}}'` devuelve `0`
- [ ] `curl http://127.0.0.1:3100/api/health` devuelve `"status":"ok"`
- [ ] Frontend accesible en `http://127.0.0.1:8100`
- [ ] `SEED_REFERENCE_DATE` fijada en `backend/.env` a la semana de la sustentación
- [ ] Correo del cliente nuevo preparado (distinto al del ensayo anterior)
- [ ] Video de respaldo grabado y accesible

---

## Registro del ensayo

| Campo | Ensayo 1 | Ensayo 2 |
|-------|----------|----------|
| Fecha y hora | | |
| Máquina utilizada | | |
| Red utilizada | | |
| Duración total | | |
| ¿Pasó del tiempo? (> 8 min) | | |

---

## Problemas encontrados

### Ensayo 1

| Tramo | Problema | Solución aplicada |
|-------|----------|-------------------|
| | | |

### Ensayo 2

| Tramo | Problema | Solución aplicada |
|-------|----------|-------------------|
| | | |

---

## Tiempo por tramo (referencia)

| Tramo | Objetivo | Ensayo 1 | Ensayo 2 |
|-------|----------|----------|----------|
| 1 — Búsqueda y recomendaciones | 0:00–1:00 | | |
| 2 — Registro | 1:00–1:45 | | |
| 3 — Armado del paquete | 1:45–3:30 | | |
| 4 — Pago y puntos | 3:30–4:15 | | |
| 5 — Cliente con historial | 4:15–5:15 | | |
| 6 — Canje con descuento | 5:15–6:15 | | |
| 7 — Reseña | 6:15–6:45 | | |
| 8 — Panel del administrador | 6:45–8:00 | | |
| **Total** | **8:00** | | |

---

## Checklist posterior al segundo ensayo

- [ ] Duración dentro de los 8 minutos
- [ ] Todos los tramos completados sin errores bloqueantes
- [ ] Ambos integrantes conocen la parte que les toca
- [ ] Video de respaldo grabado en el segundo ensayo
- [ ] Problemas del ensayo 1 corregidos
- [ ] Sistema listo para la fecha de sustentación
