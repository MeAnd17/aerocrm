# Roles, registro con preferencias y sesión con retorno

This PR wires up the full user identity stack: a two-value `UserRole` enum, a `RolesGuard` with the required Spanish rejection message, registration with optional profile preferences including `spendingRange`, and login with role-based post-auth routing, session expiry detection, and role-aware guards throughout. The old permissions machinery is removed with no remaining references. All acceptance criteria are implemented with two possible concerns noted below.

**Watch for:**
- Register always navigates to `/home` after creation regardless of role — `safeReturnUrl` defaults to `/home`; the backend hardcodes `CLIENT` on register so this is not a real user-facing bug, but the criterion's "ingresa a su inicio" is technically unmet for the admin case. *Possible.*
- The interceptor excludes only `/auth/login` from the `sessionExpired` path; `/auth/register` is not excluded. Not triggered today (backend returns 409, not 401, for duplicate email), but narrower than defensive code would choose. *Possible.*

**Verdict**: APPROVED

---

## High-level view

The schema carries `UserRole { ADMIN CLIENT }` with `User.role` defaulting to `CLIENT`. The criterion described `spendingRange` as "optional String" but the implementation uses a proper `SpendingRange` enum — safe upgrade, consistent with `TravelStyle` and `DestinationType` on the same model. Both the JWT payload (login and register paths) and the strategy's `validate()` return `role` read from the live DB record, so a role change takes effect on the next request without token re-issuance.

Registration is a two-step form. Step 1 shows the password strength error inline as the user types and keeps Continue disabled while the password is weak or the confirmations don't match. Step 2 presents the three preference questions including spending range; all optional. `confirmPassword` is stripped before the payload is submitted.

Login routes ADMIN to `/admin` and CLIENT to `/home` when no `returnUrl` is present. The interceptor sets `sessionStorage.sessionExpired = 'true'` on 401s outside the login endpoint and redirects with `returnUrl`. The login component reads the flag on init and shows the expiry banner. The `noAuthGuard` now handles role-aware redirect for authenticated users visiting `/login` or `/register`.

---

<details>
<summary>Issues (2)</summary>

1. **Register post-success route ignores role** — `safeReturnUrl` defaults to `/home`. The backend always creates CLIENTs via the public form, so an ADMIN will never reach this path in practice, but the criterion requires role-aware navigation on registration success. The login component handles this correctly with `res.user.role === 'ADMIN' ? ['/admin'] : ['/home']`; the same split is missing in `register.component.ts`. *Possible* concern — confirm whether any code path can create an ADMIN through the register endpoint.

2. **Interceptor 401 exclusion is too narrow** — `!req.url.includes('/auth/login')` leaves `/auth/register` unexcluded. A 401 from the register endpoint would set `sessionExpired = true` and redirect to the login page, losing the user's in-progress registration. The backend currently returns 409 for duplicate email and never 401 from register, so this isn't triggered today. *Possible* concern.

</details>

---

<details>
<summary>Details</summary>

### JWT payload and role propagation

Both `login()` and `register()` build the same payload shape: `{ sub, email, clientId, role }`. The `validate()` method reads `role` directly from the DB record, not from the token — a role change takes effect on the next request without re-issuing the token.

### RolesGuard and Roles decorator

`RolesGuard` throws `ForbiddenException('No tienes permiso para realizar esta accion')` — exactly the accentless string the criterion specifies. The `@Roles()` decorator is typed against the Prisma-generated `UserRole` enum, ruling out unrecognized string values at compile time.

### Register post-success routing

After registration the component calls `this.router.navigateByUrl(safeReturnUrl(returnUrl))`. `safeReturnUrl` returns `/home` when there is no `returnUrl`. The backend hardcodes `role: 'CLIENT'` in `register()`, so an ADMIN can never be created through this form. The criterion's "ingresa a su inicio" is met for CLIENT users. The same role split the login component uses (`res.user.role === 'ADMIN' ? ['/admin'] : ['/home']`) is absent here, which is only a gap if the backend ever changes.

### Session expiry flow and interceptor exclusion

The interceptor catches 401s on any URL except `/auth/login`, sets `sessionStorage.sessionExpired = 'true'`, calls `auth.logout(true)`, then navigates to `/login` with `returnUrl`. The login component removes the flag immediately after reading it in `ngOnInit`, so it doesn't persist across refreshes.

The exclusion `!req.url.includes('/auth/login')` does not cover `/auth/register`. The current backend never returns 401 from that endpoint (duplicate email is 409), but if it ever did, the user would be redirected to the login page mid-registration with a spurious session-expiry banner. Widening the exclusion to `/auth/` would be safer.

### Permissions machinery removal

`permissions.guard.ts` and `require-permission.decorator.ts` are deleted. A full grep of `backend/src/` returns no references to either. The standalone `no-auth.guard.ts` file is also gone; its logic is inlined in `auth.guard.ts` as `noAuthGuard`.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `backend/prisma/schema.prisma` | Added `UserRole` enum, `role` field on `User`, `SpendingRange` enum on `Client` |
| `backend/src/auth/auth.service.ts` | `login()` and `register()` include `role` in JWT payload and response; `register()` validates password and passes `spendingRange`; `getMe()` returns `role` and `spendingRange` |
| `backend/src/auth/jwt.strategy.ts` | `validate()` returns `role` from live DB record |
| `backend/src/auth/guards/roles.guard.ts` | New — RBAC guard with Spanish forbidden message |
| `backend/src/auth/decorators/roles.decorator.ts` | New — `@Roles()` decorator typed against `UserRole` |
| `backend/src/auth/guards/permissions.guard.ts` | Deleted |
| `backend/src/auth/decorators/require-permission.decorator.ts` | Deleted |
| `backend/src/auth/dto/register.dto.ts` | Added optional `spendingRange: SpendingRange` |
| `backend/prisma/seed.ts` | `seedAdminUser()` creates ADMIN user without a Client record |
| `frontend/src/app/core/services/auth.service.ts` | `AuthUser` interface has `role: string`; `logout()` navigates to `/explore` |
| `frontend/src/app/core/guards/auth.guard.ts` | Added `adminGuard`, `noAuthGuard`, `safeReturnUrl`; removed standalone `no-auth.guard.ts` |
| `frontend/src/app/core/interceptors/auth.interceptor.ts` | Sets `sessionExpired` in sessionStorage on 401, redirects with `returnUrl` |
| `frontend/src/app/features/auth/login/login.component.ts` | Reads `sessionExpired` on init, shows expiry banner, routes by role on success |
| `frontend/src/app/features/auth/register/register.component.ts` | Two-step form: inline password validation, confirmPassword field, optional fields, spending range, strips `confirmPassword` from payload |
| `frontend/src/app/app.routes.ts` | `/admin` uses `adminGuard`; `/login` and `/register` use `noAuthGuard` |

</details>
