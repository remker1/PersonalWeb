## Personal Website (Vite + React)

This is a Vite + React personal website with:

- **Admin page** at `/admin` for adding/removing experiences, projects, and photos
- **Contact form** at `/contact`
- **Supabase** as the database (recommended for production)
- **Vercel serverless API** (`/api/admin`) for admin-only operations (uses Supabase service role)

### Scripts

- **`npm run dev`**: run Vite locally
- **`npm run build`**: build production bundle into `dist/`
- **`npm run preview`**: preview the `dist/` build locally

### Deploy

See `DEPLOY.md` for the exact steps for **GitHub → Vercel + Supabase**.

### Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local`.

### Notes

- The admin password is **not hard-coded** in the frontend. It is verified server-side via `/api/admin`.
- The legacy Express backend (`backend/server.js`) is still useful for local/alternative hosting, but Vercel+Supabase is the recommended path.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
