# LOKI

LOKI is a browser-based workspace for gaming peripherals. It supports account profiles, a device catalog, WebHID connection flows, recommendations, and setup diagnostics.

## Repository layout

- `frontend/` contains the React/Vite application, static assets, and Tailwind configuration.
- `backend/supabase/` contains Supabase configuration, SQL migrations, role setup SQL, and Edge Functions.
- `docs/` contains architecture notes, setup guides, and PlantUML diagrams.
- Root `package.json`, `vite.config.js`, and `.github/workflows/` provide the shared frontend commands and GitHub Pages deployment. Vite reads from `frontend/` and writes the Pages artifact to root `dist/`.
- [`docs/project-defense-guide.md`](docs/project-defense-guide.md) explains the code map, data flows, current deployment gaps, and oral-defense questions.

## Supabase project

The app points to Supabase project `ynccytvbcsfutwstwmjr` at `https://ynccytvbcsfutwstwmjr.supabase.co`. Supabase hosts the managed Postgres database (default database `postgres`), Auth schema, REST API, and Edge Functions; the repository does not contain a standalone Express server.

Cloud status checked on 2026-10-09:

- `public.app_users` exists. An anonymous read is denied, consistent with its authenticated-user RLS policy; this does not reveal account rows or confirm the auth trigger.
- `public.user_profiles` is missing from the project's PostgREST schema. The migration is in the repo but has not been applied to this cloud project.
- Supabase Auth currently reports both Google and Discord providers enabled; the user has confirmed successful sign-in with both. The OAuth sequence is documented in [`docs/sequence-oauth.txt`](docs/sequence-oauth.txt).

## Data ownership

| Data | Location | Purpose |
| --- | --- | --- |
| Account identity | Supabase-managed `auth.users` | Authentication and account identity |
| Account metadata and authorization role | `public.app_users` | Display name, email, `user`/`admin` role; one row per auth user |
| Saved profile names and active profile | `public.user_profiles` | Intended cloud sync, keyed by `(user_id, name)`; migration is not yet applied to the checked project |
| Guest profiles, device settings, and device history | Browser `sessionStorage` / `localStorage` | Local device workspace state; not currently synchronized to Supabase |
| Connected hardware | Browser WebHID session | Device access is handled by the user's browser and compatible hardware |

The schema and ownership relationships are shown in [`docs/erd.txt`](docs/erd.txt). The app does not currently persist generic DPI, polling-rate, calibration, or device-history records in the database.

## Database setup

1. In project `ynccytvbcsfutwstwmjr`, verify `public.app_users`, its auth-user trigger, policies, and RPC. The table exists; trigger state was not verifiable with the public key. If needed, apply [`backend/supabase/admin_roles.sql`](backend/supabase/admin_roles.sql) in the SQL Editor.
2. Apply [`backend/supabase/migrations/202610090001_user_profiles.sql`](backend/supabase/migrations/202610090001_user_profiles.sql) in the SQL Editor to create the owner-scoped table. Until then, the app falls back to browser storage and remote profile writes fail.
3. Follow [`docs/admin-roles-setup.md`](docs/admin-roles-setup.md) to bootstrap the first administrator.
4. Google and Discord are enabled and sign-in has been tested successfully. Keep the provider callback and Supabase redirect allowlist aligned with [`docs/project-defense-guide.md`](docs/project-defense-guide.md).

If using the Supabase CLI, run it with `--workdir backend/supabase` so it finds the project configuration and migrations.

## Account modes

- Guests use temporary browser storage and are not synchronized to an account.
- Signed-in users authenticate through Supabase Auth. Profile names synchronize through `public.user_profiles` after its migration is applied; device settings and history remain in browser storage.
- Administrators are checked against `public.app_users`. Account listing and role changes are protected by database policies and the `set_loki_user_role` RPC; the browser cannot assign roles directly.

## Development

Requirements: Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

The development server serves the app from `frontend/`. Production builds use the GitHub Pages base path configured in `vite.config.js` and emit files to root `dist/`.
