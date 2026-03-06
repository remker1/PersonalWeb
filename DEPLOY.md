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

The password you set in **ADMIN_PASSWORD** on Vercel must match the one in the code so you can log in to the Admin page. Update it in one place:

- **Option A**: Change `ADMIN_PASSWORD` in Vercel and in `src/pages/Admin.jsx` (constant `ADMIN_PASSWORD`) to the same value.
- **Option B**: Use only env: you’d need to expose a build-time env to the client (e.g. `VITE_ADMIN_PASSWORD`) and use it in Admin.jsx. For simplicity, keep the constant in Admin.jsx in sync with Vercel’s `ADMIN_PASSWORD`.

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

## 7. Seeding existing content into Supabase

To move your current built-in content (from `translations.en`) into the database:

1. Ensure `.env.local` has:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Run:

```bash
npm run seed:supabase
```

This will replace the rows in `experiences` and `projects` (you can set `SEED_REPLACE_ALL=0` to only insert).


Anon Key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWJubGd4b3B1b3ZjZHViendyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjIxMjgsImV4cCI6MjA4ODMzODEyOH0.Lbrqv8KFi0G-8SvUoAl2bclUNf8PQNxsBHuoz-pGBlo

Database URL
https://yhibnlgxopuovcdubzwr.supabase.co

service role key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWJubGd4b3B1b3ZjZHViendyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2MjEyOCwiZXhwIjoyMDg4MzM4MTI4fQ.RgK0xnS86Ldxx3G_lOwB-Oylu7oeNOrRiP3FqxXbED0
