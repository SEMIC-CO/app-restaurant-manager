# AGENTS.md

Restaurant POS frontend. Single package (not a monorepo). React 19 + TypeScript (strict) + Vite 8 (SWC/Rolldown) + react-router-dom 7 + Zustand + shadcn/ui + Tailwind CSS 4. Package manager is **pnpm**. Node **>=24.22.2** (ver `.nvmrc`; `engines` en `package.json`).

## Commands

```bash
pnpm dev                  # dev server with HMR
pnpm lint                 # ESLint
pnpm exec tsc -b          # typecheck only (this is the fast gate — it is green)
pnpm build                # tsc -b && vite build
```

- There is **no test framework and no test script**. Don't guess a test command; verify with `pnpm exec tsc -b` and `pnpm lint`.
- `pnpm lint` currently fails on the existing codebase (~21 errors: `no-explicit-any` in pages, `react-refresh/only-export-components` on shadcn/ui files, empty interfaces in `input.tsx`/`textarea.tsx`). Don't assume your change caused these; just don't add new ones.

## Autenticación (contrato con el backend)

- `POST auth/login` → `data: { accessToken, user: {id, name, email, companyId, profileId, headquarterId} }`. El **refresh token nunca viaja en el body**: va en la cookie httpOnly `refresh_token` (`Path=/api/v1/auth`, `SameSite=Strict`, 7 días) → por eso `apiFetch` usa `credentials: 'include'`.
- El access token es un JWT de **15 minutos**: `apiFetch` lo manda como `Authorization: Bearer <token>` y, ante un `code: 401`, llama `auth/refresh` (cookie) y reintenta la petición una vez.
- **Modelo de sesión (XSS-safe)**: el access token vive **solo en memoria** (`src/store/auth-store.ts`, nunca en localStorage/sessionStorage); la única credencial persistente es la cookie httpOnly, invisible para JS. En el navegador solo se guarda un marcador sin credenciales (`app-session-scope`: `localStorage` = "recordarme", `sessionStorage` = solo la pestaña).
- La sesión **se verifica contra el backend**: al arrancar, `useSessionBootstrap()` llama `auth/refresh` (valida la cookie y rota el token) y el store queda en `status: 'checking' | 'authenticated' | 'anonymous'`. Los guards `ProtectedRoute`/`PublicRoute` (`src/components/common/`) deciden con ese estado, no con un flag local: sin sesión → `/login` (guardando la ruta de origen); con sesión → el **primer módulo permitido** del perfil (`firstMenuPath`, p. ej. `/mesas` para MESERO, `/cocina` para JEFE DE COCINA, `/` para ADMINISTRADOR). `ADMIN_HOME_ROUTE = '/'` queda como respaldo si el perfil no tiene módulos, y el dashboard solo es accesible si el perfil lo tiene en el menú.
- El refresh del front es **singleton** (`refreshSession()` en `src/services/useFetch.ts`): nunca hay dos renovaciones simultáneas, porque el backend rota el refresh token y un reuso fuera de su ventana de gracia revoca todas las sesiones del usuario.
- `POST auth/refresh` (solo cookie) → nuevo `accessToken` + `user`; `POST auth/logout` → borra la cookie (hay que llamarlo para cerrar sesión de verdad). Ambos devuelven `data: {message}`.
- El backend no tiene endpoint "me": la introspección de sesión es `auth/refresh`.
- En dev el backend espera el origen `http://localhost:5173` (CORS con credenciales) y envía el enlace de activación a `/activar-cuenta?token=...`.

## Known gotchas

- API base URL: `import.meta.env.VITE_URL_API` in `src/services/useFetch.ts` (e.g. `http://localhost:3000/api/v1`). Keep the name `VITE_URL_API`, not `VITE_API_URL`.
- The backend wraps every response in `{ code, msg, transactionId, timestamp, data }` — check `resp.code` (200/201 success, 400 validation with `data: string[]`), not HTTP status. Swagger: http://localhost:3000/docs/ (spec embedded in `/docs/swagger-ui-init.js`).
- **Never send `Content-Type: application/json` on a POST without body** (e.g. `auth/refresh`, `auth/logout`): Fastify answers `400 "Body cannot be empty when content-type is set to 'application/json'"`. `apiFetch` only sets that header when there is a body. `curl` hides this (it omits the header without `-d`), so verify browser-like calls with `-H 'Content-Type: application/json'` and no body.
- `GET /api/v1/locations/cities` is paginated (`page`, `limit` max 100; returns `{ items, total, page, limit, totalPages }`). `userService.getCities()` already loops all pages.
- Most services are **mock/in-memory** (`src/services/product-service.ts` returns inline arrays). Only `src/services/Auth/` (register, locations, login) hits the real backend.
- Route paths are in Spanish and registered flat in `src/App.tsx` (`/caja` POS, `/cocina` kitchen, `/entregas` delivery, `/facturacion` billing, `/reportes` analytics, `/configuracion/*`, `/login`). App.tsx is the source of truth — the route list in `.github/copilot-instructions.md` is stale.

## Architecture

- Layering: `src/app/layout/` (page layout wrappers) → `src/features/*-page.tsx` (pages) → `src/components/{feature}/` (feature components) → `src/components/ui/` (shadcn/ui primitives, don't hand-edit style conventions). Shared: `src/store/` (Zustand), `src/services/`, `src/types/index.ts` (all domain types live here), `src/utils/format.ts`.
- Every directory has a barrel `index.ts`. Import through barrels (`@/features`, `@/components/ui`) and add new exports to them.
- Path alias `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- Adding a feature: types in `src/types/index.ts` → service → store (if needed) → components → page in `src/features/` → export from `src/features/index.ts` → route in `src/App.tsx`.
- **Sidebar is DB-driven**: `ConfigSidebar`/`MobileSidebarDrawer` render `AppNav`, which paints what `GET /menus/mine` returns for the session profile (`useNavigationStore`, loaded by `useNavigationBootstrap()` on login/refresh and reset on logout). Menus come grouped by `groupName` and icons resolve by name with `NavIcon`. Adding a module means adding a menu row to the API's `db/seed-menu-navigation.sql` — not editing a static array. Per-profile assignment lives in `/configuracion/perfiles` ("Configurar" → `ProfilePermissionsDialog`); SYSTEM profiles are shared templates, so they are read-only (create a COMPANY profile to assign modules).
- Forms: react-hook-form + zod + shadcn/ui following the pattern in `FORMS-GUIDE.md` (Spanish; reference implementations: `src/components/common/product-form-dialog.tsx`, `customer-form-dialog.tsx`).

## Styling

- Tailwind 4 is CSS-first: theme colors are CSS variables in `src/index.css` (`@theme inline` + `:root`/`.dark`). `tailwind.config.ts` is vestigial — edit `src/index.css`, not the config.
- Add shadcn components with `pnpm dlx shadcn@latest add <component>` (config in `components.json`; they land in `src/components/ui/`).
- Use `cn()` from `@/lib/utils` for conditional classes.

## TypeScript

- `verbatimModuleSyntax` is on: type-only imports must use `import type`.
- `noUnusedLocals` / `noUnusedParameters` are on: unused code fails `tsc -b` (and therefore `pnpm build`).

## Conventions

- UI text and route paths are in Spanish.
- Commits: short Spanish messages, sometimes with a `feat:` prefix.
