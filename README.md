# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## LOKI

LOKI is a browser-based dashboard for gaming peripherals. It brings device connection, button configuration, user profiles, recommendations, and diagnostics into one workspace.

## Account Modes

### Guest

Guests can connect supported hardware with WebHID and use temporary profiles. Temporary profile data is stored in `sessionStorage` and is not synchronized to an account.

### Authenticated User

Users sign up or sign in through Supabase Auth. The application loads the account role from `public.app_users`; standard users receive the `user` role. Account profiles are synchronized through `profileService.js` and Supabase, with a local browser cache.

### Administrator

An account with the database-verified `admin` role sees the Admin Console. The console lists registered accounts and requests role changes through the `set_loki_user_role` RPC. Row-level security restricts account listing and role updates; the browser does not assign roles directly.

To create the role table, policies, trigger, and RPC, run [`supabase/admin_roles.sql`](supabase/admin_roles.sql) in the Supabase SQL Editor. Then follow [`docs/admin-roles-setup.md`](docs/admin-roles-setup.md) to promote the first administrator account.

## Source Layout

- `src/App.jsx` coordinates application state, device events, authentication, and the dashboard.
- `src/features/auth/` contains guest, authenticated-user, authentication-form, and role lookup components/services.
- `src/features/admin/` contains the role-protected account management console.
- `src/features/devices/` contains the supported-device catalog; WebHID workspace logic remains in `App.jsx`.
- `src/features/profiles/` contains profile controls and saved-profile panels.
- `src/features/recommendations/` contains recommendation cards and profile details.
- `src/features/insights/` contains performance insights and setup diagnostics.
- `src/profileService.js` manages profile storage and Supabase synchronization.
- `src/mockData.js` provides the current device catalog, recommendations, diagnostics, and schema preview data.
- `src/supabaseClient.js` initializes the browser Supabase client.

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
