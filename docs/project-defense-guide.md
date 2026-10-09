# LOKI - Technical and Oral Defense Guide

Snapshot checked on 2026-10-09. This guide describes the code and the linked Supabase project as they exist now; it distinguishes implemented behavior from dashboard setup that is still missing.

## 1. Request checklist

| Topic | Status | Evidence / remaining work |
| --- | --- | --- |
| Dashboard and account-menu spacing | Mostly done | Responsive account menu is now anchored to the viewport; mobile controls fit. Recheck the supplied reference screenshot if it shows a different board state. |
| Google and Discord sign-in | Working | Supabase Auth reports both providers enabled, and the user has confirmed successful sign-in with both. |
| Registration and database receipt | Partial | Email signup calls Supabase Auth. `public.app_users` exists, but its auth trigger cannot be confirmed with the public key. `public.user_profiles` is missing from the cloud project. |
| Frontend/backend folder split | Done for this architecture | React code is under `frontend/`; Supabase backend resources are under `backend/supabase/`. There is intentionally no separate Express server. |
| Sequence diagrams | Partial, corrected | Login/register represent Supabase Auth. Device/admin diagrams now match WebHID and the actual RLS/RPC flow. OAuth has its own diagram. |
| Database destination/name | Identified | Supabase project ref `ynccytvbcsfutwstwmjr`; URL `https://ynccytvbcsfutwstwmjr.supabase.co`; managed Postgres database is `postgres`, with `auth` and `public` schemas. |
| Feature modules | Mostly done | Auth, admin, assistant, devices, profiles, recommendations, and insights have folders. `App.jsx` remains the app orchestrator and still owns HID lifecycle/workspace logic. |
| A-to-Z technical explanation | Added | Use this guide and the linked sequence diagrams for the defense. |

## 2. Architecture

LOKI is a React 19 + Vite browser application deployed to GitHub Pages. Supabase is the managed backend: Auth, Postgres, PostgREST/RLS, and a Deno Edge Function. WebHID is a browser API. This is a serverless architecture, not a client plus a self-hosted Node/Express API.

```text
User
  -> GitHub Pages: React/Vite frontend
      -> Supabase Auth -> auth.users
      -> Supabase PostgREST + RLS -> public.app_users / public.user_profiles
      -> Supabase Edge Function: loki-chat -> external LLM API
      -> Browser WebHID -> user's mouse/keyboard
      -> localStorage/sessionStorage -> local device/profile state
```

### Repository map

Current source layout (generated dependencies/build output, ignored cache, and secret `.env` are intentionally omitted):

```text
LOKI/
|-- .github/workflows/deploy.yml       GitHub Pages build/deploy
|-- backend/supabase/
|   |-- admin_roles.sql                 app_users, trigger, RLS, admin RPC
|   |-- config.toml                     project ref + Edge Function config
|   |-- migrations/                     SQL schema migrations
|   `-- functions/loki-chat/index.ts    Deno AI Edge Function
|-- docs/
|   |-- project-defense-guide.md        architecture and oral-defense notes
|   |-- admin-roles-setup.md             first-admin setup
|   |-- erd.txt                          database ERD (PlantUML source)
|   `-- sequence-*.txt                   login/register/OAuth/HID/admin flows
|-- frontend/
|   |-- public/                          images and device illustrations
|   |-- src/
|   |   |-- features/
|   |   |   |-- admin/                   AdminDashboard.jsx
|   |   |   |-- assistant/               assistantService.js
|   |   |   |-- auth/                    AuthFormPanel.jsx, session panels, authService.js
|   |   |   |-- devices/                 DeviceCatalogPanel, WorkspaceSettings, deviceSettings
|   |   |   |-- insights/                 diagnostics and insight panels
|   |   |   |-- profiles/                 profile panels
|   |   |   `-- recommendations/          recommendation panels
|   |   |-- App.jsx                       app state and feature orchestration
|   |   |-- main.jsx                      React entry point
|   |   |-- profileService.js             browser/cloud profile helpers
|   |   `-- supabaseClient.js             browser Supabase client
|   |-- index.html
|   |-- App.css, index.css
|   `-- LokiDragon.jsx                    dragon illustration/component
|-- package.json, package-lock.json       scripts and dependencies
|-- vite.config.js                        Vite root=frontend; output=dist/
|-- eslint.config.js                      lint rules
|-- README.md                             setup and data ownership
`-- DinhhuongWeb.txtr                     project direction notes
```

Files under `frontend/src/features/` are grouped by responsibility, but `App.jsx` still owns device lifecycle/workspace orchestration. Supabase is the managed/serverless backend; there is no separate Node/Express server.

- `frontend/src/main.jsx`: React entry point; mounts the app.
- `frontend/src/App.jsx`: application orchestration, auth/session restoration, centered auth modal, device lifecycle, profiles, assistant actions, and workspace routing. This remains the largest module.
- `frontend/src/features/auth/`: email form modal, guest/authenticated account panels, OAuth preflight/helper, role queries and RPC calls.
- `frontend/src/features/admin/`: role-protected account console.
- `frontend/src/features/devices/`: device catalog, workspace settings UI, and local device-setting defaults. WebHID connection/workspace orchestration is still in `App.jsx`.
- `frontend/src/features/assistant/`: request to the `loki-chat` Edge Function and validation of proposed actions.
- `frontend/src/features/profiles/`, `recommendations/`, and `insights/`: profile controls, recommendation UI, diagnostics and insight panels.
- `frontend/src/profileService.js`: browser storage helpers and the intended `user_profiles` PostgREST synchronization.
- `frontend/src/supabaseClient.js`: Supabase project URL and public publishable key. A publishable key is expected in browser code; service-role and LLM secrets must never be put here.
- `backend/supabase/admin_roles.sql`: `app_users`, auth trigger, RLS policies, and admin RPC setup.
- `backend/supabase/migrations/202610090001_user_profiles.sql`: owner-scoped profile table migration.
- `backend/supabase/functions/loki-chat/index.ts`: Deno Edge Function that validates requests, calls the configured LLM, and returns text/tool proposals.
- `docs/`: ERD, setup instructions, and PlantUML sequence diagrams.
- Root `vite.config.js`, `package.json`, and `.github/workflows/deploy.yml`: build configuration, commands, and Pages deployment.

`Gitingest` is a repository-context/export tool, not part of the running application. If using it to prepare an analysis, exclude `.env`, credentials, `node_modules`, and generated `dist` output.

## 3. Where data goes

| Data | Actual destination | Important detail |
| --- | --- | --- |
| Login identity/password | Supabase Auth `auth.users` | The app does not store passwords in `public.app_users`. Supabase Auth manages password hashing and sessions. |
| Role and account display metadata | `public.app_users` | `id` is also a foreign key to `auth.users.id`; allowed roles are `user` and `admin`. The auth trigger in `admin_roles.sql` is intended to create/update this row. |
| Profile names/active flags | Intended `public.user_profiles` | Composite key `(user_id, name)`; RLS is owner-scoped. The table is currently absent from the checked cloud project, so profile upserts do not currently reach Postgres. |
| Device settings, button assignments, DPI stage lists, device history | Browser `localStorage` for signed-in users, `sessionStorage` for guests | These are application settings/history, not writes to the physical device and not rows in Supabase. |
| HID connection | Browser WebHID permission/session | The browser talks directly to the selected hardware. No app backend or database participates in connecting it. |
| Chat messages | In-memory React state | The Edge Function receives recent messages/context for a request; the app does not persist chat history to a database. |
| LLM key | Supabase Edge Function secret | Never expose it in frontend code. Rotate the previously exposed LLM key before relying on this integration. |

### Cloud checks performed

- `GET /rest/v1/app_users?select=id&limit=0` returned `401` with `permission denied for table app_users`. The error names the existing table and says `anon` lacks `SELECT`; this is consistent with the SQL grant to `authenticated` only and RLS. It does not expose or verify account rows.
- `GET /rest/v1/user_profiles?select=user_id&limit=0` returned `404 PGRST205`, so this table is not in the project's schema cache. Apply the migration before describing cloud profile sync as working.
- Supabase Auth settings returned `external.google=true` and `external.discord=true`; the user has confirmed successful login with both providers.
- The public client cannot safely verify whether the auth trigger exists or create a test user without an authorized test account. Verify the trigger in the Supabase SQL Editor; do not paste service-role keys into chat or frontend files.

## 4. Authentication and registration flow

### Email/password

1. The account menu offers Login/Sign up; `AuthFormPanel.jsx` collects email/password in a centered modal.
2. `App.jsx` calls `supabase.auth.signUp()` or `signInWithPassword()`.
3. Supabase Auth creates/verifies the identity in `auth.users` and returns a session/JWT when appropriate.
  The form does not collect a display name; the `app_users` trigger uses an empty `display_name` default unless metadata is added later.
4. If email confirmation is enabled, signup may create the auth identity without an immediate session; the UI asks the user to verify email.
5. After a session exists, `authService.js` reads the caller's role from `public.app_users`. RLS allows the user to read their own row and admins to read accounts.
6. The app loads cached profiles locally and tries to read `public.user_profiles`. With the current missing table, `profileService.js` catches the query error and returns no remote profiles; writes return `false`.

Registration does not automatically prove that a row was created in every public table. `auth.users` is the identity destination. `public.app_users` depends on the database trigger being installed. Profile rows depend on applying the migration.

### Google/Discord OAuth

`AuthFormPanel.jsx` calls `App.jsx -> authService.signInWithOAuthProvider()`. The service first checks `/auth/v1/settings`; if the requested provider is enabled, it calls `supabase.auth.signInWithOAuth()`. Both configured providers currently work. The callback path is derived from Vite's `BASE_URL`:

- Supabase provider callback for Google/Discord consoles: `https://ynccytvbcsfutwstwmjr.supabase.co/auth/v1/callback`
- LOKI redirect URL to allow in Supabase: `https://lilfanq.github.io/Nguyen-Luong-Nhat-Phuong_24CT1_CNPM_LOKI/`
- Local development redirect URL: `http://localhost:5173/`

Google and Discord are enabled in Supabase Dashboard > Authentication > Providers; each provider's client ID/secret is stored there, and the LOKI redirect URLs are allowed in Supabase Auth URL configuration. The Supabase callback is registered in both provider consoles. “Sign in with Google” is Google OAuth, not a Gmail password form. Do not commit provider secrets.

## 5. Device and settings flow

`App.jsx` checks `navigator.hid`, calls `getDevices()` and, if needed, `requestDevice({ filters: [] })`. The user chooses a device in the browser permission chooser; LOKI opens it and filters to supported device IDs. The browser owns the permission and connection.

Workspace settings are stored under a key combining device identity and active profile. Signed-in settings use `localStorage`; guest settings use `sessionStorage`. The current app UI can save profile-scoped values such as DPI stages, polling rate, sleep threshold, and button mappings, but it does not send generic settings to the device firmware. Do not claim a physical DPI/polling/RGB write unless a device-specific protocol is implemented and tested.

## 6. Assistant flow

1. `frontend/src/features/assistant/assistantService.js` invokes Supabase Function `loki-chat` with messages and bounded app context.
2. `backend/supabase/config.toml` sets `verify_jwt = true`; the Edge Function runs on Deno, enforces request size/message/rate limits, and reads LLM configuration from server-side secrets.
3. The function calls Gemini or an OpenAI-compatible API and may return one of the declared tool proposals.
4. The frontend validates every proposal with `validateAssistantAction()` before changing profiles or browser-stored button actions.

The assistant can change LOKI's local profile/button configuration. It cannot write settings to physical hardware. The function does not persist chat messages.

## 7. Admin and security

- Admin visibility is based on the database role returned from `public.app_users`; a browser flag alone does not grant admin access.
- `app_users` has RLS. `set_loki_user_role` is a `SECURITY DEFINER` RPC that checks `is_loki_admin()`, validates the role, rejects self-demotion/change, and checks the target exists.
- `public.user_profiles` uses owner-only RLS after its migration is applied.
- The frontend contains only the public Supabase project key. Keep service-role, OAuth client secrets, and LLM keys on the server/dashboard.
- The admin schema and profile migration are separate setup steps; both need to be present for all documented flows.

## 8. Build and deployment

`npm ci`, `npm run dev`, `npm run lint`, and `npm run build` run from the repository root. Vite uses `frontend/` as its root and writes `dist/` to the repository root. The GitHub Actions workflow builds on `main` and deploys `dist/` to GitHub Pages at the repository base path.

At this check, lint has no errors and one existing React Hooks warning in `App.jsx` about `syncDevices`; production build succeeds. There is no test script in `package.json`.

## 9. Short oral-defense answers

- **What is LOKI?** A browser-based gaming-peripheral workspace built with React/Vite, Supabase, and WebHID.
- **Where is the backend?** Supabase managed services: Auth, Postgres/PostgREST with RLS, and a Deno Edge Function. There is no separate Express server.
- **Where are accounts stored?** Identity in `auth.users`; role/display metadata in `public.app_users` when the auth trigger is installed.
- **What is the database name?** The Supabase project ref is `ynccytvbcsfutwstwmjr`; its managed Postgres database is `postgres`. `auth` and `public` are schemas, not separate databases.
- **Are user profiles in cloud now?** Not on the checked project: `public.user_profiles` is absent until its migration is applied. The app currently falls back to browser storage.
- **Can LOKI configure hardware?** It can request a WebHID connection and store app-side settings. Generic DPI/polling/RGB changes are not yet written to firmware.
- **How is admin protected?** Supabase RLS and the `set_loki_user_role` database RPC validate permissions; frontend UI hiding is not the security boundary.
- **What remains before demonstrating all data flows?** Verify the SQL trigger and apply the profile migration; OAuth itself has been enabled and tested. Confirm resulting rows through an authenticated/admin SQL session.
