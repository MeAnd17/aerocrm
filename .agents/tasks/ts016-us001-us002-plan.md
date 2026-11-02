# Plan de implementación: TS-016 · US-001 · US-002
Rama: `feat/ts016-us001-us002-roles-auth`

---

## Contexto de dependencias

Los ítems están ordenados de mayor a menor dependencia:
- **TS-016** es la base: sin `role` en Prisma y en el JWT, los ítems de US-002 que bifurcan por rol no se pueden implementar.
- **US-001** es mayormente independiente de TS-016; su único punto de contacto es que el `register()` del backend debe incluir `role` en el JWT una vez que TS-016 esté hecho.
- **US-002** depende de TS-016 para el criterio de destino según rol; los demás criterios (mensaje de sesión expirada, logout a `/explore`) son independientes.

---

## TS-016 — Roles de usuario

- [ ] 1. Agregar enum `UserRole` y campo `role` al modelo `User` en Prisma.
      En `backend/prisma/schema.prisma`, añadir antes del modelo `User`:
      ```prisma
      enum UserRole {
        ADMIN
        CLIENT
      }
      ```
      Y dentro del modelo `User`, después del campo `isActive`:
      ```prisma
      role UserRole @default(CLIENT)
      ```
      Crear la migración ejecutando `npx prisma migrate dev --name add-user-role` contra la base local. El archivo de migración generado se commitea junto con el schema.
      Files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/<timestamp>_add_user_role/migration.sql`
      Verify: `cd backend && npx prisma validate` — debe salir sin errores. Luego `npm run build` — debe compilar sin errores de tipos.

- [ ] 2. Agregar campo `spendingRange` al modelo `Client` en Prisma (US-001 se incluye aquí porque es la segunda y última migración de schema; ambas van en el mismo PR por regla D1).
      En `backend/prisma/schema.prisma`, agregar el enum y el campo:
      ```prisma
      enum SpendingRange {
        LESS_500
        RANGE_500_1500
        RANGE_1500_3000
        MORE_3000
      }
      ```
      Y dentro del modelo `Client`, después de `destinationType`:
      ```prisma
      spendingRange SpendingRange?
      ```
      Crear la migración con `npx prisma migrate dev --name add-client-spending-range`.
      Files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/<timestamp>_add_client_spending_range/migration.sql`
      Verify: `cd backend && npx prisma validate && npm run build` — sin errores.

- [ ] 3. Actualizar `seed.ts`: agregar función `seedAdminUser()` que crea con `upsert` el usuario administrador.
      La función busca por `email: 'admin@aerocrm.com'` y hace `upsert` con:
      - `create`: `{ email: 'admin@aerocrm.com', password: await bcrypt.hash('Admin1234!', 10), firstName: 'Admin', lastName: 'AeroCRM', role: 'ADMIN' }`
      - `update`: `{ password: await bcrypt.hash('Admin1234!', 10), role: 'ADMIN', isActive: true }`
      No crea registro `Client` para este usuario (el admin no compra paquetes).
      Llamar a `seedAdminUser()` al inicio de `main()`, antes de `seedDestinations()`.
      También actualizar el `upsert` de `seedDemoClients()`: en `create` y `update`, asegurarse de que `role` quede como `'CLIENT'` (aunque es el default, ser explícito evita regresiones si el campo se repite en el seed).
      Files: `backend/prisma/seed.ts`
      Verify: `cd backend && npx prisma db seed` — debe terminar sin errores y el log final debe mostrar `admin@aerocrm.com` en la cuenta de usuarios. Confirmar que `npx prisma db seed` ejecutado dos veces deja el mismo resultado (idempotencia per regla D5).

- [ ] 4. Crear el decorador `@Roles()`.
      Crear `backend/src/auth/decorators/roles.decorator.ts`:
      ```typescript
      import { SetMetadata } from '@nestjs/common';
      export const ROLES_KEY = 'roles';
      export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
      ```
      Files: `backend/src/auth/decorators/roles.decorator.ts`
      Verify: `cd backend && npm run build` — sin errores de compilación.

- [ ] 5. Crear `RolesGuard`.
      Crear `backend/src/auth/guards/roles.guard.ts`:
      ```typescript
      import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
      import { Reflector } from '@nestjs/core';
      import { ROLES_KEY } from '../decorators/roles.decorator';

      @Injectable()
      export class RolesGuard implements CanActivate {
        constructor(private reflector: Reflector) {}

        canActivate(context: ExecutionContext): boolean {
          const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
          ]);
          if (!required || required.length === 0) return true;

          const { user } = context.switchToHttp().getRequest();
          if (!user || !required.includes(user.role)) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción');
          }
          return true;
        }
      }
      ```
      Files: `backend/src/auth/guards/roles.guard.ts`
      Verify: `cd backend && npm run build` — sin errores.

- [ ] 6. Eliminar la maquinaria heredada de permisos granulares.
      Borrar los dos archivos:
      - `backend/src/auth/guards/permissions.guard.ts`
      - `backend/src/auth/decorators/require-permission.decorator.ts`
      Verificar que ningún archivo en `backend/src/` los importa (la investigación confirma que nadie los importa, pero comprobarlo con `grep -rn "PermissionsGuard\|RequirePermission\|require-permission" backend/src/ --include="*.ts"` antes de borrar).
      Files: eliminar `backend/src/auth/guards/permissions.guard.ts`, `backend/src/auth/decorators/require-permission.decorator.ts`
      Verify: `cd backend && npm run build` — sin errores (confirma que nada los importaba).

- [ ] 7. Actualizar `AuthModule`: registrar `RolesGuard`, eliminar referencias a la maquinaria borrada.
      En `backend/src/auth/auth.module.ts`:
      - Importar `RolesGuard` desde `./guards/roles.guard`.
      - Agregar `RolesGuard` a `providers`.
      - Agregar `RolesGuard` a `exports` (para que otros módulos puedan inyectarlo con `@UseGuards`).
      - No importar ni exportar `PermissionsGuard` (ya no existe).
      También actualizar la referencia en `AGENTS.md` sección 2 (estructura de directorios) y sección B4: cambiar la línea que dice `JwtAuthGuard, PermissionsGuard, @RequirePermission, @CurrentUser` para que diga `JwtAuthGuard, RolesGuard, @Roles, @CurrentUser`. Este es el "contrato de trabajo" que TS-016 exige actualizar en el mismo aporte.
      Files: `backend/src/auth/auth.module.ts`, `AGENTS.md`
      Verify: `cd backend && npm run build` — sin errores.

- [ ] 8. Incluir `role` en el JWT: actualizar `auth.service.ts` y `jwt.strategy.ts`.
      En `backend/src/auth/auth.service.ts`:
      - En `login()`: cambiar el payload a `{ sub: user.id, email: user.email, clientId: user.client?.id ?? null, role: user.role }`.
      - En `login()`: cambiar el objeto `user` devuelto para incluir `role: user.role`.
      - En `register()`: cambiar el payload a `{ sub: user.id, email: user.email, clientId: user.client?.id ?? null, role: user.role }`.
      - En `register()`: el usuario registrado siempre tendrá `role: 'CLIENT'` (default de Prisma), incluirlo también en el objeto `user` devuelto: `role: user.role`.
      - En `login()`: cambiar el mensaje de error a `'Correo o contraseña incorrectos'` (fix de US-002, aquí porque es el mismo archivo).
        ```typescript
        throw new UnauthorizedException('Correo o contraseña incorrectos');
        ```
      - En `register()`: reemplazar las tres `BadRequestException` separadas por una sola validación combinada:
        ```typescript
        const passwordValid = dto.password.length >= 8 && /[A-Z]/.test(dto.password) && /[0-9]/.test(dto.password);
        if (!passwordValid) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
        ```

      En `backend/src/auth/jwt.strategy.ts`:
      - La estrategia ya hace un `findUnique` a la base; agregar `role: user.role` al objeto devuelto:
        ```typescript
        return { sub: payload.sub, email: payload.email, clientId: user.client?.id ?? null, role: user.role };
        ```

      En `backend/src/auth/auth.service.ts`, en `getMe()`: incluir `role: user.role` en el objeto de respuesta, para que el frontend pueda refrescar el rol sin relogin.

      Files: `backend/src/auth/auth.service.ts`, `backend/src/auth/jwt.strategy.ts`
      Verify: `cd backend && npm run build && npm test` — compila y pruebas existentes pasan.

- [ ] 9. Agregar `spendingRange` al `RegisterDto` y pasarlo al `create` de `Client` (US-001 backend).
      En `backend/src/auth/dto/register.dto.ts`:
      - Agregar import de `SpendingRange` desde `@prisma/client`.
      - Agregar campo opcional:
        ```typescript
        @IsOptional()
        @IsEnum(SpendingRange)
        spendingRange?: SpendingRange;
        ```
      En `backend/src/auth/auth.service.ts`, dentro de `register()`, en el `client.create`:
      - Agregar `spendingRange: dto.spendingRange ?? null`.
      En `backend/src/common/validation.ts`, agregar `spendingRange: 'rango de gasto'` al objeto `FIELD_LABELS`.
      Files: `backend/src/auth/dto/register.dto.ts`, `backend/src/auth/auth.service.ts`, `backend/src/common/validation.ts`
      Verify: `cd backend && npm run build` — sin errores de tipos. El campo `SpendingRange` existe en el cliente Prisma generado (paso 2 ya corrió la migración).

---

## US-001 — Registro con preferencias (frontend)

- [ ] 10. Actualizar el formulario de registro — Paso 1: confirmación de contraseña, campos opcionales y validación de fortaleza en cliente.
      En `frontend/src/app/features/auth/register/register.component.ts`:

      **Modelo del formulario** — extender `form` con los nuevos campos:
      ```typescript
      form: any = {
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        phone: '', nationality: '', dateOfBirth: '',
        travelStyle: null, destinationType: null, spendingRange: null
      };
      ```

      **Nueva señal** para el error de contraseña en cliente:
      ```typescript
      passwordError = signal('');
      ```

      **Paso 1 del template** — añadir después del campo `password`:
      - Campo `confirmPassword` (type="password", ngModel, name="confirmPassword").
      - Bloque `@if` que muestra `'Las contraseñas no coinciden'` cuando `form.confirmPassword && form.password !== form.confirmPassword`.
      - Bloque `@if` que muestra `passwordError()` cuando no está vacío.
      - Campos opcionales (todos debajo de confirmPassword, con etiqueta "Opcional" en el label):
        - `phone` (type="tel")
        - `nationality` (type="text")
        - `dateOfBirth` (type="date")

      **Método `nextStep()`** — agregar validaciones antes de avanzar:
      ```typescript
      nextStep() {
        this.passwordError.set('');
        if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.password) return;
        const pwOk = this.form.password.length >= 8
          && /[A-Z]/.test(this.form.password)
          && /[0-9]/.test(this.form.password);
        if (!pwOk) {
          this.passwordError.set('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
          return;
        }
        if (this.form.password !== this.form.confirmPassword) return; // el template ya muestra el mensaje
        this.step.set(2);
      }
      ```
      El botón "Continuar →" debe quedar `[disabled]` cuando `form.confirmPassword && form.password !== form.confirmPassword`.

      **Al enviar** — el campo `confirmPassword` no debe enviarse al backend; en `submit()`, antes de llamar a `this.auth.register()`, crear una copia del formulario sin ese campo:
      ```typescript
      submit() {
        this.loading.set(true);
        this.error.set('');
        const { confirmPassword, ...payload } = this.form;
        this.auth.register(payload).subscribe({
          next: () => this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))),
          error: (err) => { this.error.set(apiErrorMessage(err, 'No pudimos crear la cuenta')); this.loading.set(false); },
        });
      }
      ```

      Files: `frontend/src/app/features/auth/register/register.component.ts`
      Verify: `cd frontend && npm run build` — sin errores de compilación angular.

- [ ] 11. Actualizar el formulario de registro — Paso 2: agregar la tercera pregunta de rango de gasto.
      En el mismo `register.component.ts`:

      **Agregar la lista de opciones** en la clase del componente:
      ```typescript
      spendingOptions = [
        { value: 'LESS_500', label: '💸 Menos de S/ 500' },
        { value: 'RANGE_500_1500', label: '💳 S/ 500 – 1 500' },
        { value: 'RANGE_1500_3000', label: '🧳 S/ 1 500 – 3 000' },
        { value: 'MORE_3000', label: '✈️ Más de S/ 3 000' },
      ];
      ```

      **Añadir al template del paso 2**, después del bloque de `destinationOptions` y antes del bloque de error:
      ```html
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">¿Cuánto sueles gastar por viaje?</label>
        <div class="grid grid-cols-2 gap-2">
          @for (option of spendingOptions; track option.value) {
            <button type="button" (click)="form.spendingRange = option.value"
              [class.ring-2]="form.spendingRange === option.value"
              [class.ring-blue-500]="form.spendingRange === option.value"
              class="border border-gray-200 rounded-lg py-2.5 text-sm hover:border-blue-400 transition text-center">
              {{ option.label }}
            </button>
          }
        </div>
      </div>
      ```

      Files: `frontend/src/app/features/auth/register/register.component.ts`
      Verify: `cd frontend && npm run build` — sin errores.

---

## US-002 — Login con retorno y ruteo por rol (frontend)

- [ ] 12. Agregar `role` a `AuthUser` en el servicio de autenticación del frontend y corregir `logout()`.
      En `frontend/src/app/core/services/auth.service.ts`:
      - Agregar `role: string` a la interfaz `AuthUser`:
        ```typescript
        export interface AuthUser {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
          clientId: number | null;
          membershipLevel: string | null;
          availablePoints: number;
          completedTrips: number;
          role: string;
        }
      ```
      - En `logout()`, cambiar la navegación de `/login` a `/explore`:
        ```typescript
        this.router.navigate(['/explore']);
        ```
      Files: `frontend/src/app/core/services/auth.service.ts`
      Verify: `cd frontend && npm run build` — sin errores (el compilador detectará si algún sitio produce un `AuthUser` sin `role`).

- [ ] 13. Actualizar el interceptor para señalizar sesión expirada via `sessionStorage`.
      En `frontend/src/app/core/interceptors/auth.interceptor.ts`:
      Dentro del bloque `if (err.status === 401 && !req.url.includes('/auth/login'))`, antes de `auth.logout()`, agregar:
      ```typescript
      sessionStorage.setItem('sessionExpired', 'true');
      ```
      El resto del bloque permanece igual: `auth.logout()` ya navega a `/explore` (después del cambio del ítem 12), pero el interceptor llama a `router.navigate(['/login'], ...)` directamente — esa navegación está bien porque aquí queremos ir al login con el `returnUrl`. Mantenerla; solo se agrega la línea de `sessionStorage`.

      Nota: `auth.logout()` en el interceptor limpia el token/usuario del storage pero navega a `/explore`. La línea del interceptor que hace `router.navigate(['/login'], { queryParams: { returnUrl: router.url } })` sobreescribe esa navegación y manda al usuario al login con `returnUrl`. El orden correcto es: setItem → logout (limpia storage, navega a /explore) → router.navigate (sobreescribe, manda a /login con returnUrl). Esto es el comportamiento actual y se mantiene; solo se añade el `sessionStorage.setItem` al inicio.

      Files: `frontend/src/app/core/interceptors/auth.interceptor.ts`
      Verify: `cd frontend && npm run build` — sin errores.

- [ ] 14. Actualizar el componente de login: mostrar mensaje de sesión expirada y rutear por rol.
      En `frontend/src/app/features/auth/login/login.component.ts`:

      **Al inicializar** — leer y limpiar el flag de sesión expirada. Agregar implementación de `OnInit`:
      ```typescript
      import { Component, OnInit, signal } from '@angular/core';
      // ...
      export class LoginComponent implements OnInit {
        // ...señales existentes...
        sessionExpiredMsg = signal('');

        ngOnInit() {
          if (sessionStorage.getItem('sessionExpired') === 'true') {
            this.sessionExpiredMsg.set('Tu sesión expiró, vuelve a iniciar sesión');
            sessionStorage.removeItem('sessionExpired');
          }
        }
      ```

      **En el template** — añadir justo encima del `<form>`:
      ```html
      @if (sessionExpiredMsg()) {
        <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm mb-4">
          {{ sessionExpiredMsg() }}
        </div>
      }
      ```

      **En `onSubmit()`** — bifurcar el destino post-login por rol cuando no hay `returnUrl`:
      ```typescript
      onSubmit() {
        if (!this.email || !this.password) return;
        this.loading.set(true);
        this.error.set('');
        this.auth.login(this.email, this.password).subscribe({
          next: (res) => {
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            if (returnUrl) {
              this.router.navigateByUrl(safeReturnUrl(returnUrl));
            } else {
              this.router.navigate(res.user.role === 'ADMIN' ? ['/admin'] : ['/home']);
            }
          },
          error: (err) => {
            this.error.set(apiErrorMessage(err, 'Correo o contraseña incorrectos'));
            this.loading.set(false);
          },
        });
      }
      ```

      Nota: el método `login()` del `AuthService` actualmente retorna `Observable<{ access_token: string; user: AuthUser }>` via el `tap` pero el `subscribe` en el componente no recibe el valor porque el `tap` lo transforma a `void` implícitamente. Para que `next` reciba `res`, el operador `tap` debe preservar el valor; en el servicio el `pipe(tap(...))` ya retorna el observable tipado, así que el suscriptor sí recibe `res`. Verificar el tipo del observable en `auth.service.ts`: si el `tap` no retorna el valor al suscriptor, cambiar la suscripción del login al componente para que lea `this.auth.currentUser()` directamente en lugar de `res.user`.

      Files: `frontend/src/app/features/auth/login/login.component.ts`
      Verify: `cd frontend && npm run build` — sin errores.

      **Nota sobre la ruta `/admin`**: la ruta no existe todavía en `app.routes.ts`. El plan del administrador corresponde a otra historia. Para evitar que el admin aterrice en un 404 ahora, agregar una ruta temporal de placeholder en `app.routes.ts`:
      ```typescript
      {
        path: 'admin',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        canActivate: [authGuard],
      },
      ```
      Esto hace que `/admin` cargue el `HomeComponent` provisionalmente, sin bloquear a ningún usuario, y deja la ruta registrada para cuando se implemente el panel de gestión real.
      Files: `frontend/src/app/app.routes.ts`
      Verify: `cd frontend && npm run build` — sin errores.

---

## Verificación final

- [ ] 15. Verificación integral de backend.
      ```bash
      cd backend
      npm run build
      npm test
      ```
      Resultado esperado: compilación limpia, todas las pruebas unitarias existentes pasan. Si hay pruebas e2e que cubren login/register, ejecutar también `npm run test:e2e` y confirmar que pasan con los nuevos mensajes de error.

- [ ] 16. Verificación integral de frontend.
      ```bash
      cd frontend
      npm run build
      ```
      Resultado esperado: compilación Angular sin errores ni advertencias de tipos.

---

## Resumen de archivos

| Archivo | Acción | Historia |
|---|---|---|
| `backend/prisma/schema.prisma` | Modificar: enum `UserRole` + campo `role` en `User`; enum `SpendingRange` + campo `spendingRange` en `Client` | TS-016, US-001 |
| `backend/prisma/migrations/<ts>_add_user_role/migration.sql` | Crear (generado por Prisma) | TS-016 |
| `backend/prisma/migrations/<ts>_add_client_spending_range/migration.sql` | Crear (generado por Prisma) | US-001 |
| `backend/prisma/seed.ts` | Modificar: agregar `seedAdminUser()` | TS-016 |
| `backend/src/auth/decorators/roles.decorator.ts` | Crear | TS-016 |
| `backend/src/auth/guards/roles.guard.ts` | Crear | TS-016 |
| `backend/src/auth/guards/permissions.guard.ts` | Eliminar | TS-016 |
| `backend/src/auth/decorators/require-permission.decorator.ts` | Eliminar | TS-016 |
| `backend/src/auth/auth.module.ts` | Modificar: registrar y exportar `RolesGuard` | TS-016 |
| `backend/src/auth/auth.service.ts` | Modificar: `role` en JWT + objetos de respuesta; mensaje único de contraseña; mensaje de credenciales incorrectas; `spendingRange` en `register()` | TS-016, US-001, US-002 |
| `backend/src/auth/jwt.strategy.ts` | Modificar: `role` en objeto `req.user` | TS-016 |
| `backend/src/auth/dto/register.dto.ts` | Modificar: agregar `spendingRange` | US-001 |
| `backend/src/common/validation.ts` | Modificar: agregar `spendingRange` a `FIELD_LABELS` | US-001 |
| `AGENTS.md` | Modificar: actualizar referencias a `PermissionsGuard`/`@RequirePermission` → `RolesGuard`/`@Roles` | TS-016 |
| `frontend/src/app/core/services/auth.service.ts` | Modificar: `role` en `AuthUser`; `logout()` a `/explore` | TS-016, US-002 |
| `frontend/src/app/core/interceptors/auth.interceptor.ts` | Modificar: `sessionStorage.setItem('sessionExpired','true')` antes del logout | US-002 |
| `frontend/src/app/features/auth/login/login.component.ts` | Modificar: `ngOnInit` lee `sessionExpired`; `onSubmit` bifurca por rol | US-002 |
| `frontend/src/app/features/auth/register/register.component.ts` | Modificar: Paso 1 (confirmPassword, opcionales, validación fortaleza); Paso 2 (pregunta gasto) | US-001 |
| `frontend/src/app/app.routes.ts` | Modificar: ruta `/admin` provisional | US-002 |
