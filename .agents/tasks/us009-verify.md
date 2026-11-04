# Verificación US-009 — Mantener mis datos y mis viajeros frecuentes

**Veredicto general: IMPLEMENTADA PARCIALMENTE — 3 de 5 criterios completos, 2 con brechas.**

---

## Resumen ejecutivo

La historia US-009 está en estado **"EXISTE con ajustes"** según `docs/tareas/sprint-1.md`, y eso es exacto: la estructura principal (endpoints backend + componente frontend) funciona, pero faltan tres comportamientos obligatorios de los criterios de aceptación:

| Criterio CA | Estado | Brecha |
|---|---|---|
| 1. Editar teléfono, nacionalidad, fechaNacimiento, documento + 2 preferencias de viaje | ✅ Completo | — |
| 2. Agregar y eliminar viajeros (editar no aplica aún) | ✅ Completo | — |
| 3a. Validación "Ya tienes un viajero con ese documento" | ❌ Falta | No implementada en backend ni frontend |
| 3b. Confirmación de eliminación "¿Eliminar a [nombre] de tus viajeros?" | ❌ Falta | No hay `confirm()` ni modal en el frontend |
| 4. Confirmar con "Datos actualizados" al guardar | ⚠️ Parcial | El mensaje dice "✓ Guardado", no "Datos actualizados" |
| 5. Acceso solo al propio perfil | ✅ Completo | JWT + `req.user.sub` garantizan aislamiento |

> **Nota sobre "tres preferencias":** La US menciona tres preferencias de viaje, pero el modelo `Client` solo tiene dos campos (`travelStyle`, `destinationType`). El esquema fue diseñado con dos preferencias y el componente de perfil muestra exactamente esas dos. No hay un tercer campo en la base de datos ni en el DTO. Esto es una decisión de diseño preexistente, no una brecha de implementación de US-009.

---

## Evidencia detallada

### 1. Endpoint PATCH para datos propios del cliente

**Archivo:** `backend/src/clients/clients.controller.ts` línea 27

```typescript
@Patch('me')
@ApiOperation({ summary: 'Actualiza mi perfil y preferencias' })
updateProfile(@Request() req, @Body() dto: UpdateClientDto) {
  return this.clientsService.updateProfile(req.user.sub, dto);
}
```

**DTO:** `backend/src/clients/dto/update-client.dto.ts`

```typescript
export class UpdateClientDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() dateOfBirth?: string;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsEnum(TravelStyle) travelStyle?: TravelStyle;
  @IsOptional() @IsEnum(DestinationType) destinationType?: DestinationType;
}
```

Cubre: teléfono, nacionalidad, fecha de nacimiento, número de documento, y las dos preferencias (`travelStyle`, `destinationType`). El servicio en `clients.service.ts` línea 38 aplica el `prisma.client.update()` correctamente.

**Veredicto CA-1: ✅ COMPLETO**

---

### 2. Endpoints para viajeros frecuentes

**Archivo:** `backend/src/clients/clients.controller.ts`

| Operación | Método | Ruta | Línea |
|---|---|---|---|
| Listar | `GET` | `clients/me/travelers` | 35 |
| Agregar | `POST` | `clients/me/travelers` | 40 |
| Eliminar | `DELETE` | `clients/me/travelers/:id` | 46 |

No existe `PATCH clients/me/travelers/:id`, pero la US especifica explícitamente: **"Hoy solo se pueden agregar y eliminar, no corregir"** — por lo tanto la ausencia de edición es correcta.

El DTO `CreateTravelerDto` cubre todos los campos requeridos: `firstName`, `lastName`, `documentNumber`, `dateOfBirth`, `relation`.

**Veredicto CA-2: ✅ COMPLETO**

---

### 3a. Validación de documento duplicado

**Backend:** `clients.service.ts` método `createTraveler` (línea 111):

```typescript
async createTraveler(userId: number, dto: CreateTravelerDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { client: true } });
  if (!user?.client) throw new NotFoundException('Perfil no encontrado');
  return this.prisma.traveler.create({
    data: { ...dto, dateOfBirth: new Date(dto.dateOfBirth), clientId: user.client.id },
  });
}
```

No hay consulta previa para verificar si ya existe un viajero con el mismo `documentNumber` para ese cliente. No hay constraint `@@unique` en el modelo `Traveler` del esquema Prisma para `(clientId, documentNumber)`. El backend simplemente crea el registro sin verificar duplicados.

**Frontend:** `profile.component.ts` método `addTraveler()` (línea 162):

```typescript
addTraveler() {
  this.api.post<any>('clients/me/travelers', this.newTraveler).subscribe(t => {
    this.travelers.update(list => [...list, t]);
    // ...
  });
}
```

Tampoco hay validación previa del lado del cliente. No se muestra ningún mensaje de error de negocio.

**Veredicto CA-3a: ❌ FALTA — El mensaje "Ya tienes un viajero con ese documento" no existe ni en backend ni en frontend.**

---

### 3b. Confirmación de eliminación

**Frontend:** `profile.component.ts` línea 170:

```typescript
deleteTraveler(id: number) {
  this.api.delete(`clients/me/travelers/${id}`).subscribe(() => {
    this.travelers.update(list => list.filter(t => t.id !== id));
  });
}
```

La plantilla HTML llama directamente `(click)="deleteTraveler(t.id)"` sin ningún `window.confirm()`, modal, ni diálogo de confirmación. El viajero se borra inmediatamente al hacer clic.

No aparece en ningún archivo el texto "¿Eliminar a" ni ninguna variante de confirmación.

**Veredicto CA-3b: ❌ FALTA — No hay confirmación de eliminación.**

---

### 4. Confirmación "Datos actualizados" al guardar

**Frontend:** `profile.component.ts` línea 157 (lógica) y línea 45 (template):

```typescript
next: () => { this.saving.set(false); this.saved.set(true); setTimeout(() => this.saved.set(false), 3000); },
```

```html
@if (saved()) { <span class="ml-3 text-green-600 text-sm">✓ Guardado</span> }
```

El sistema muestra confirmación visual durante 3 segundos. Sin embargo, el texto es **"✓ Guardado"**, no **"Datos actualizados"** como especifica el criterio de aceptación. La funcionalidad existe, pero el mensaje exacto no coincide.

Adicionalmente, la confirmación solo aparece al guardar los datos personales. Al agregar un viajero, el formulario se cierra pero no hay mensaje de éxito.

**Veredicto CA-4: ⚠️ PARCIAL — Existe confirmación visual pero el texto no es "Datos actualizados" y no cubre el guardado de viajeros.**

---

### 5. Acceso solo al propio perfil

**Guard frontend:** `auth.guard.ts` — `authGuard` redirige a `/login` si no hay sesión. La ruta `/profile` está protegida:

```typescript
{
  path: 'profile',
  loadComponent: () => import('./features/profile/profile.component')...,
  canActivate: [authGuard],
},
```

**Backend — JWT Strategy:** `jwt.strategy.ts` línea 14:

```typescript
async validate(payload: any) {
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, ... });
  if (!user || !user.isActive) throw new UnauthorizedException();
  return { sub: payload.sub, email: payload.email, clientId: user.client?.id ?? null };
}
```

**Backend — Todos los endpoints usan `req.user.sub`** (el id del usuario autenticado) para filtrar los datos. Por ejemplo, `deleteTraveler` verifica que `clientId` del viajero coincida con el del usuario:

```typescript
return this.prisma.traveler.delete({ where: { id: travelerId, clientId: user.client.id } });
```

El interceptor `auth.interceptor.ts` agrega el JWT a cada petición y maneja 401 cerrando sesión automáticamente.

**Veredicto CA-5: ✅ COMPLETO — El aislamiento está garantizado tanto en frontend (guard) como en backend (JWT + filtrado por `user.sub`).**

---

## Resumen de brechas y recomendaciones

### Brecha 1 — CA-3a: Validación de documento duplicado en viajeros

**Qué implementar:**

1. **Backend** — en `clients.service.ts`, método `createTraveler`, agregar antes del `prisma.traveler.create`:
   ```typescript
   const existing = await this.prisma.traveler.findFirst({
     where: { clientId: user.client.id, documentNumber: dto.documentNumber },
   });
   if (existing) throw new BadRequestException('Ya tienes un viajero con ese documento');
   ```
2. **Frontend** — en `profile.component.ts`, método `addTraveler`, manejar el error 400 y mostrar el mensaje de negocio al usuario.

Opcionalmente agregar `@@unique([clientId, documentNumber])` en el modelo `Traveler` de `schema.prisma` como segunda línea de defensa.

---

### Brecha 2 — CA-3b: Confirmación de eliminación

**Qué implementar:**

En `profile.component.ts`, método `deleteTraveler`, agregar confirmación con el nombre del viajero:

```typescript
deleteTraveler(id: number) {
  const traveler = this.travelers().find(t => t.id === id);
  const nombre = traveler ? `${traveler.firstName} ${traveler.lastName}` : 'este viajero';
  if (!confirm(`¿Eliminar a ${nombre} de tus viajeros?`)) return;
  this.api.delete(`clients/me/travelers/${id}`).subscribe(() => {
    this.travelers.update(list => list.filter(t => t.id !== id));
  });
}
```

Si se prefiere un modal en lugar de `confirm()` nativo, adaptar el mismo patrón con una señal de estado y un overlay en la plantilla.

---

### Brecha 3 — CA-4: Texto exacto de confirmación

**Qué cambiar:**

En la plantilla HTML de `profile.component.ts`, reemplazar:

```html
@if (saved()) { <span class="ml-3 text-green-600 text-sm">✓ Guardado</span> }
```

por:

```html
@if (saved()) { <span class="ml-3 text-green-600 text-sm">✓ Datos actualizados</span> }
```

Adicionalmente, si la US requiere confirmación al agregar viajeros también, agregar una señal `travelerSaved` con lógica análoga.

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `backend/src/clients/clients.controller.ts` | Endpoints de perfil y viajeros |
| `backend/src/clients/clients.service.ts` | Lógica de negocio — falta validación de doc duplicado |
| `backend/src/clients/dto/update-client.dto.ts` | DTO de actualización de perfil |
| `backend/src/clients/dto/create-traveler.dto.ts` | DTO de viajero frecuente |
| `backend/src/auth/guards/jwt-auth.guard.ts` | Guard JWT Passport |
| `backend/src/auth/jwt.strategy.ts` | Estrategia JWT — valida y expone `req.user.sub` |
| `backend/prisma/schema.prisma` | Modelo `Client` y `Traveler` — sin unique en documentNumber |
| `frontend/src/app/features/profile/profile.component.ts` | Componente de perfil — falta confirm de eliminación y texto exacto |
| `frontend/src/app/core/guards/auth.guard.ts` | Guard de rutas privadas |
| `frontend/src/app/core/interceptors/auth.interceptor.ts` | Interceptor que adjunta el JWT |
| `docs/tareas/sprint-1.md` | Definición oficial de US-009 |
