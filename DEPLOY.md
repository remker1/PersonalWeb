# Deploy to Vercel + Supabase (GitHub)

This project is set up to run on **Vercel** (frontend + serverless API) with **Supabase** as the database. Pushing to GitHub and connecting the repo to Vercel is enough to deploy.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the schema:
   - Open `supabase/schema.sql` in this repo.
   - Paste and run it in the Supabase SQL Editor.
3. Get credentials:
   - **Settings → API**: note **Project URL** and **anon public** key.
   - **Settings → API**: copy the **service_role** key (keep it secret; only for serverless).

## 2. GitHub

1. Create a new repo on GitHub.
2. Push this project:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## 3. Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New Project** → import your GitHub repo.
3. Configure:
   - **Framework Preset**: Vite (or leave auto).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment variables** (Settings → Environment Variables). Add for **Production** (and Preview if you want):

   | Name                         | Value                    | Notes                          |
   |-----------------------------|--------------------------|--------------------------------|
   | `VITE_SUPABASE_URL`         | `https://xxx.supabase.co`| Project URL                    |
   | `VITE_SUPABASE_ANON_KEY`    | `eyJ...`                 | anon public key                |
   | `SUPABASE_URL`              | `https://xxx.supabase.co`| Same as above (for serverless) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...`                 | service_role key (secret)      |
   | `ADMIN_PASSWORD`            | your chosen password     | Must match Admin page password |

5. Deploy. The first deployment will build the app and expose:
   - Your site at `https://your-project.vercel.app`
   - Admin API at `https://your-project.vercel.app/api/admin`

## 4. Admin password

Set `ADMIN_PASSWORD` in Vercel (server-side). When you visit `/admin`, you’ll enter this password; the Admin page verifies it against `/api/admin` and stores it only in `sessionStorage` for that browser session.

## 5. Local development with Supabase

1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase URL and anon key (and optionally service role + admin password for testing admin).
3. Run:

   ```bash
   npm run dev
   ```

   For the Admin API (add/delete) to work locally, either:

   - Run **Vercel Dev** (recommended): `npx vercel dev` — runs the Vite app and `/api/admin` locally, using the same env as production.
   - Or keep using the Express backend: run `npm run serve` in another terminal and point the app at it (e.g. proxy `/api` to that server); then don’t set `VITE_SUPABASE_*` so the app uses the Express API.

## 6. Summary

- **Vercel**: hosts the built Vite app and the serverless function `api/admin.js`.
- **Supabase**: stores experiences, projects, photos, and contact messages; RLS allows public read for content and public insert for messages; admin actions go through the serverless API with the service role.
- **GitHub**: connect the repo in Vercel so every push to the main branch triggers a new deployment.
