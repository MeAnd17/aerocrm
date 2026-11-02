# Reporte de Verificación: TS-016, US-001, US-002
Rama base: `develop` / rama activa: `feat/us005-us007-us008-us009-fixes` (ya mergeada a develop)
Fecha de análisis: 2026-10

---

## Resumen ejecutivo

Las tres historias están **parcialmente implementadas** pero con brechas significativas. La más crítica es **TS-016**: el modelo `User` no tiene campo `role`, el JWT no lleva el rol, no existe un `RolesGuard`, y no hay usuario administrador en el seed. Sin TS-016 resuelto, US-002 (criterio de destino según rol) no puede funcionar. US-001 falta la confirmación de contraseña en el formulario activo, la tercera pregunta de preferencias (rango de gasto) y los campos opcionales de teléfono/nationalidad/fecha de nacimiento en la UI. US-002 falta el mensaje "Tu sesión expiró", el destino según rol, y el cierre de sesión lleva a `/login` en lugar de `/destinations`.

---

## Pregunta 1 — ¿Existe campo `role` en el modelo User de Prisma?

**NO.** El modelo `User` en `backend/prisma/schema.prisma` es:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  client    Client?
  bookings  Booking[]
}
```

No existe campo `role`, ni enum `UserRole`, ni enum `Role`. El criterio "solo dos roles: ADMIN y CLIENT" no tiene representación en el esquema.

**No hay usuario administrador en el seed.** `backend/prisma/seed.ts` solo llama a `seedDemoClients()` que crea tres clientes de demostración (lucia, diego, valeria). No existe ninguna llamada que cree un usuario `admin@aerocrm.com` con rol ADMIN. El archivo `StaffLoginComponent` muestra `admin@aerocrm.com / Admin1234!` como credencial de demostración, pero ese usuario no se crea en el seed — iniciar sesión con esas credenciales fallará con 401.

---

## Pregunta 2 — ¿El JWT incluye el rol?

**NO.** El payload del JWT se firma en `backend/src/auth/auth.service.ts`:

```ts
// login():
const payload = { sub: user.id, email: user.email, clientId: user.client?.id ?? null };

// register():
const payload = { sub: user.id, email: user.email, clientId: user.client?.id ?? null };
```

El campo `role` no se incluye. La estrategia JWT (`backend/src/auth/jwt.strategy.ts`) también lo confirma:

```ts
return { sub: payload.sub, email: payload.email, clientId: user.client?.id ?? null };
```

No se extrae ni propaga ningún rol. El objeto `req.user` disponible en los controladores no tiene `role`.

---

## Pregunta 3 — ¿Existe un guard de roles (RolesGuard)?

**NO existe `RolesGuard`.** El directorio `backend/src/auth/guards/` contiene únicamente:
- `jwt-auth.guard.ts` — extiende `AuthGuard('jwt')`, solo verifica que el token sea válido.
- `permissions.guard.ts` — guard heredado (ver pregunta 4).

No hay ningún decorator `@Roles()` ni guard que compare el campo `role` del usuario con un rol requerido en el endpoint. No existe mecanismo que rechace a un cliente intentando acceder a una operación de administrador con el mensaje "No tienes permiso para realizar esta acción".

---

## Pregunta 4 — ¿Existen `RequirePermission` y `PermissionsGuard`? ¿Se usan?

**Existen pero NO se usan en ningún endpoint activo.**

- `backend/src/auth/decorators/require-permission.decorator.ts` exporta el decorator `RequirePermission(...)`.
- `backend/src/auth/guards/permissions.guard.ts` contiene `PermissionsGuard`.

Búsqueda en todo `backend/src/`:
```
grep -rn "PermissionsGuard\|RequirePermission" backend/src/ --include="*.ts"
```
Los únicos matches son las propias definiciones de los dos archivos. **No hay ningún controlador ni módulo que los importe o aplique.** La maquinaria existe pero está muerta (no registrada en `AuthModule`, no usada en ningún `@UseGuards`).

Sin embargo, el criterio de TS-016 exige **eliminarla**. Estos archivos siguen presentes y deben borrarse junto con la actualización del contrato (AGENTS.md).

El `PermissionsGuard` referencia `user.roles` (plural, string array) y `user.permissions` — estructuras que no existen en el payload JWT actual ni en la base de datos. Si alguien lo registrara accidentalmente, bloquearía todas las rutas para todos los usuarios.

---

## Pregunta 5 — ¿El formulario de registro tiene todos los campos de US-001?

**PARCIALMENTE.** Analizando `frontend/src/app/features/auth/register/register.component.ts`:

| Campo | Estado |
|---|---|
| Nombre (firstName) | ✅ Presente, obligatorio |
| Apellido (lastName) | ✅ Presente, obligatorio |
| Correo (email) | ✅ Presente, obligatorio |
| Contraseña | ✅ Presente, obligatorio |
| **Confirmación de contraseña** | ❌ **AUSENTE** en el formulario activo (`/register`) |
| Teléfono (phone) | ❌ **AUSENTE** en la UI (existe en el DTO y en Prisma, pero no en el template) |
| Nacionalidad (nationality) | ❌ **AUSENTE** en la UI |
| Fecha de nacimiento (dateOfBirth) | ❌ **AUSENTE** en la UI |

El campo de confirmación de contraseña existe en `client-register.component.ts` (componente heredado no enrutado), pero **no en `register.component.ts`** que es el que usa la ruta `/register`.

### Validaciones en la UI:
- La validación de fortaleza de contraseña (≥8 chars, mayúscula, número) está **en el backend** (`auth.service.ts`) pero el frontend **no la valida antes de enviar** — solo hay un `placeholder` de texto recordatorio. Los errores llegan como respuesta HTTP y se muestran vía `apiErrorMessage()`.
- El mensaje de confirmación "Las contraseñas no coinciden" no puede mostrarse porque no hay campo de confirmación.
- El mensaje exacto requerido es "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número" (un solo mensaje combinado). El backend lanza tres `BadRequestException` separadas, una por cada regla fallida. Esto no cumple el criterio exacto.
- El mensaje "Este correo ya está registrado" ✅ funciona — el backend lanza `ConflictException` con ese texto y `apiErrorMessage()` lo muestra.

---

## Pregunta 6 — ¿Existen las preguntas opcionales de preferencias?

**PARCIALMENTE.** El componente `register.component.ts` (paso 2) tiene:

| Pregunta | Estado |
|---|---|
| ¿Cómo sueles viajar? (SOLO/PAREJA/FAMILIA/GRUPO) | ✅ Presente con botones visuales |
| ¿Qué tipo de destino prefieres? (PLAYA/CIUDAD/AVENTURA/CULTURA) | ✅ Presente con botones visuales |
| **¿Cuánto sueles gastar por viaje? (rangos)** | ❌ **AUSENTE** |

La tercera pregunta (rango de gasto) no está en el template ni en el modelo del formulario. El campo tampoco existe en el schema de Prisma (`Client`) ni en `RegisterDto`. Es una brecha de backend y frontend.

El botón "Omitir" ✅ existe (llama a `submit()` directamente desde el paso 2 sin seleccionar preferencias).

---

## Pregunta 7 — ¿El login guarda returnUrl y redirige correctamente?

**MAYORMENTE SÍ, con un gap.**

`frontend/src/app/features/auth/login/login.component.ts`:
```ts
next: () => this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))),
```

`safeReturnUrl()` en `auth.guard.ts`:
```ts
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/home';
  return value;
}
```

El flujo funciona para rutas protegidas: `authGuard` añade `?returnUrl=<url>` y el login lo lee.

**Gap — destino según rol (TS-016 / US-002 criterio 4):** `safeReturnUrl` siempre va a `/home` cuando no hay returnUrl. El administrador también iría a `/home` en lugar del panel de gestión. Sin el campo `role` en el JWT, es imposible implementar esta bifurcación.

---

## Pregunta 8 — ¿El interceptor detecta sesión vencida (401) y muestra el mensaje correcto?

**PARCIAL.** `frontend/src/app/core/interceptors/auth.interceptor.ts`:

```ts
if (err.status === 401 && !req.url.includes('/auth/login')) {
  auth.logout();
  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
}
```

El interceptor ✅ detecta el 401 y redirige al login con `returnUrl` preservado. Sin embargo:

- ❌ **No muestra el mensaje "Tu sesión expiró, vuelve a iniciar sesión"**. No llama al `ToastService` ni establece ningún estado que el componente de login pueda leer para mostrar ese aviso.
- El usuario llega al login sin ninguna indicación de por qué fue redirigido.

---

## Pregunta 9 — ¿El cierre de sesión redirige a `/destinations`?

**NO.** `AuthService.logout()`:

```ts
logout() {
  localStorage.removeItem(this.TOKEN_KEY);
  localStorage.removeItem(this.USER_KEY);
  this.currentUser.set(null);
  this.router.navigate(['/login']);  // ← va a /login, no a /destinations
}
```

El criterio de US-002 exige "Limpia la sesión y lleva a explorar" (es decir, `/destinations`). Actualmente lleva a `/login`.

---

## Pregunta 10 — ¿El auth guard redirige con returnUrl?

**SÍ.** `auth.guard.ts`:

```ts
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  return true;
};
```

✅ Funciona correctamente. Preserva la URL destino en `returnUrl`.

El `noAuthGuard` también funciona: redirige a `/home` si ya hay sesión. Hay un archivo `no-auth.guard.ts` duplicado (identificado en HEREDADO.md como candidato a retirar), pero las rutas de login y register importan el `noAuthGuard` desde `auth.guard.ts`, no desde el duplicado.

---

## Pregunta 11 — ¿Qué falta exactamente en cada historia?

### TS-016 (Roles) — TODO ausente

| Criterio | Estado | Detalle |
|---|---|---|
| Campo `role` en modelo User (ADMIN/CLIENT) | ❌ | No existe en schema.prisma. Requiere migración de base de datos. |
| Enum `UserRole` o similar en Prisma | ❌ | No existe. |
| Seed del administrador | ❌ | `admin@aerocrm.com` no se crea en ningún lugar del seed. |
| Registro público crea clientes | ✅ | `register()` crea User + Client. Funciona. |
| Rol en JWT | ❌ | payload no incluye `role`. |
| RolesGuard o equivalente | ❌ | No existe. No hay mecanismo de rechazo por rol. |
| Mensaje "No tienes permiso..." | ❌ | Sin guard, el mensaje nunca se emite. |
| Eliminación de `PermissionsGuard` + `RequirePermission` | ❌ | Archivos siguen presentes: `permissions.guard.ts`, `require-permission.decorator.ts`. |
| Admin → panel de gestión | ❌ | Sin `role` en JWT ni guard de roles, imposible rutear por rol. |
| Cliente → plataforma de compra | ✅ (implícito) | El flujo actual trata a todos como clientes. |

### US-001 (Registro) — Brechas en UI y validaciones

| Criterio | Estado | Detalle |
|---|---|---|
| Campos obligatorios (nombre, apellido, email, password) | ✅ | Presentes. |
| Campo confirmación de contraseña | ❌ | Ausente en `register.component.ts`. |
| Validación "Las contraseñas no coinciden" | ❌ | Sin campo de confirmación, imposible. |
| Validación "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número" (mensaje unificado) | ⚠️ | Backend lanza 3 errores separados; el mensaje unificado exacto no se produce. |
| Campos opcionales en UI: teléfono, nacionalidad, fechaNacimiento | ❌ | No están en el template del paso 1. |
| Preguntas opcionales: cómo viaja | ✅ | Presente en paso 2. |
| Preguntas opcionales: tipo destino | ✅ | Presente en paso 2. |
| Pregunta opcional: rango de gasto | ❌ | Ausente en UI, en RegisterDto y en schema de Prisma. |
| Botón omitir preferencias | ✅ | Presente. |
| Cliente creado en nivel EXPLORADOR con 0 puntos | ✅ | `membershipLevel @default(EXPLORADOR)`, `totalPoints @default(0)`. |
| Preferencias guardadas | ✅ | `travelStyle` y `destinationType` se guardan en `Client`. |
| Sesión iniciada al crear cuenta | ✅ | `register()` devuelve token, `AuthService` lo almacena. |
| Redirige a `returnUrl` o a `/home` | ✅ | `safeReturnUrl()` resuelve correctamente. |
| Solo para visitantes (noAuthGuard) | ✅ | La ruta `/register` usa `noAuthGuard`. |

### US-002 (Login y retorno) — Brechas en mensajes y redirecciones

| Criterio | Estado | Detalle |
|---|---|---|
| Credenciales incorrectas: "Correo o contraseña incorrectos" | ⚠️ | El backend lanza `UnauthorizedException('Credenciales incorrectas')`. El frontend usa `apiErrorMessage(err, 'Correo o contraseña incorrectos')`. Si el backend devuelve el mensaje exacto, se mostrará ese (incorrecto). Hay que cambiar el mensaje del backend a "Correo o contraseña incorrectos". |
| Retorno a pantalla protegida | ✅ | `authGuard` + `returnUrl` + `safeReturnUrl` funcionan. |
| Retorno desde el armador | ✅ | `step-summary.component.ts` navega a `/login?returnUrl=/packages/new`. |
| Sesión vencida: aviso "Tu sesión expiró, vuelve a iniciar sesión" | ❌ | El interceptor redirige pero no muestra el mensaje. |
| Al re-login tras sesión vencida: vuelve al origen | ✅ | El interceptor pasa `returnUrl: router.url` al login. |
| Destino según rol: cliente → /home, admin → panel | ❌ | Sin `role` en JWT, imposible bifurcar. `safeReturnUrl` siempre va a `/home`. |
| Cierre de sesión lleva a "explorar" (/destinations) | ❌ | `auth.logout()` navega a `/login`. Debe ser `/destinations`. |
| Solo para visitantes (noAuthGuard) | ✅ | La ruta `/login` usa `noAuthGuard`. |

---

## Conclusiones y recomendaciones de fix

### Fix 1 — Prisma: agregar campo `role` al modelo User (TS-016)

```prisma
enum UserRole {
  ADMIN
  CLIENT
}

model User {
  // ...campos existentes...
  role UserRole @default(CLIENT)
}
```

Crear migración con `npx prisma migrate dev --name add-user-role`.

### Fix 2 — Seed: crear usuario administrador (TS-016)

En `seed.ts`, agregar una sección `seedAdminUser()` que cree con `upsert` un usuario `admin@aerocrm.com` con `role: 'ADMIN'` y sin registro de `Client` asociado.

### Fix 3 — JWT: incluir el rol en el payload (TS-016)

En `auth.service.ts`, cambiar el payload de `login()` y `register()`:
```ts
const payload = { sub: user.id, email: user.email, clientId: user.client?.id ?? null, role: user.role };
```

En `jwt.strategy.ts`:
```ts
return { sub: payload.sub, email: payload.email, clientId: ..., role: payload.role };
```

En `AuthUser` (frontend `auth.service.ts`), agregar `role: string`.

### Fix 4 — Crear RolesGuard (TS-016)

Crear `backend/src/auth/guards/roles.guard.ts` y `backend/src/auth/decorators/roles.decorator.ts`. El guard compara `req.user.role` con los roles permitidos y lanza `ForbiddenException('No tienes permiso para realizar esta acción')`. Registrarlo en `AuthModule`.

### Fix 5 — Eliminar maquinaria heredada (TS-016)

Borrar `backend/src/auth/guards/permissions.guard.ts` y `backend/src/auth/decorators/require-permission.decorator.ts`. Verificar que ningún módulo los importe (actualmente no hay ninguno).

### Fix 6 — Formulario de registro: confirmación de contraseña y campos opcionales (US-001)

En `register.component.ts`, paso 1:
- Añadir campo `confirmPassword` con validación inline "Las contraseñas no coinciden".
- Añadir campos opcionales: teléfono, nacionalidad, fecha de nacimiento.
- Bloquear el botón "Continuar →" si `password !== confirmPassword`.
- Validar la fortaleza de contraseña en el frontend antes de enviar, mostrando el mensaje unificado "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número".

### Fix 7 — Pregunta de rango de gasto (US-001)

- Agregar enum `SpendingRange` en Prisma (`Client.spendingRange`).
- Agregar campo al `RegisterDto`.
- Agregar los botones de rango en el paso 2 del formulario.

### Fix 8 — Mensaje de sesión expirada (US-002)

En `auth.interceptor.ts`, antes de `router.navigate`, usar `ToastService` (o un `sessionStorage` temporal) para mostrar "Tu sesión expiró, vuelve a iniciar sesión". El login debe leer este estado al cargar y mostrarlo en el banner de error.

### Fix 9 — Mensaje de credenciales incorrectas (US-002)

En `auth.service.ts` (backend), cambiar:
```ts
throw new UnauthorizedException('Credenciales incorrectas');
```
a:
```ts
throw new UnauthorizedException('Correo o contraseña incorrectos');
```

### Fix 10 — Cierre de sesión a `/destinations` (US-002)

En `AuthService.logout()` (frontend):
```ts
this.router.navigate(['/destinations']);
```

### Fix 11 — Destino según rol post-login (US-002)

Una vez que el `role` viaje en el JWT y en `AuthUser` (Fix 3), modificar `safeReturnUrl` o el `onSubmit` del login:
```ts
next: (res) => {
  const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  if (returnUrl) {
    this.router.navigateByUrl(safeReturnUrl(returnUrl));
  } else {
    this.router.navigate(res.user.role === 'ADMIN' ? ['/admin'] : ['/home']);
  }
}
```

---

## Archivos que requieren cambios

| Archivo | Historia | Tipo de cambio |
|---|---|---|
| `backend/prisma/schema.prisma` | TS-016 | Agregar enum `UserRole`, campo `role` en `User` |
| `backend/prisma/seed.ts` | TS-016 | Agregar seed del administrador |
| `backend/src/auth/auth.service.ts` | TS-016, US-002 | Rol en payload JWT; mensaje de error corregido |
| `backend/src/auth/jwt.strategy.ts` | TS-016 | Rol en objeto `req.user` |
| `backend/src/auth/dto/register.dto.ts` | US-001 | Agregar `spendingRange` |
| `backend/src/auth/guards/permissions.guard.ts` | TS-016 | **ELIMINAR** |
| `backend/src/auth/decorators/require-permission.decorator.ts` | TS-016 | **ELIMINAR** |
| `backend/src/auth/guards/roles.guard.ts` | TS-016 | **CREAR** |
| `backend/src/auth/decorators/roles.decorator.ts` | TS-016 | **CREAR** |
| `frontend/src/app/core/services/auth.service.ts` | TS-016, US-002 | Agregar `role` en `AuthUser`; logout → `/destinations` |
| `frontend/src/app/core/interceptors/auth.interceptor.ts` | US-002 | Mostrar mensaje "Tu sesión expiró..." |
| `frontend/src/app/features/auth/register/register.component.ts` | US-001 | Confirmación de contraseña, campos opcionales, pregunta de gasto |
| `frontend/src/app/features/auth/login/login.component.ts` | US-002 | Bifurcación de destino por rol |
| `backend/prisma/migrations/<nueva>/` | TS-016, US-001 | Migración para `role` y `spendingRange` |
