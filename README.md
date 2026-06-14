# Next Level Studio

A two-sided platform for a **video-editing team** — built dark, English-only,
royal-purple on near-black.

**Team workspace** (`/dashboard`):
- **admin** — full access
- **editor** — video editors: tasks, projects, and **deliverables** (the videos they produce)
- **sales** — commercial team: **leads** pipeline, their **clients**, quotes/invoices, finance

**Client portal** (`/portal`):
- Each client logs in (real email) to see **their videos** (with watch links),
  **their payments/invoices**, and **their tasks** — read-only, isolated by RLS.

Sales/admin create a client's login from the client detail page.

---

## Status

🟢 **Pivot complete** — two-sided platform live.

What works now:
- Next.js 15 + TypeScript + Tailwind, deployed on Vercel
- English-only UI in the Next Level dark/purple brand system
- One login page: **email → client portal**, **username → team dashboard**
  (middleware keeps each role on its own side)
- Roles `admin · editor · sales · client` with full RLS isolation
- Team: tasks, projects, deliverables, leads (→ convert to client), clients,
  quotes/invoices, finance, services, team
- Client portal: home, my videos, payments, tasks, account
- Full SQL schema + RLS as Supabase CLI migrations — applied via `npm run db:push`
  or `node scripts/apply-migrations.mjs`

---

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + RLS) · @supabase/ssr · Vercel

---

## First-time setup (~15 min)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to https://supabase.com → **New project** (free tier).
2. Pick a region close to Tunisia (e.g. `eu-west-2` London or `eu-central-1` Frankfurt).
3. Save the **database password** somewhere safe.
4. Wait ~2 min for the project to provision.

### 3. Apply the database schema (Supabase CLI — one command)

We use the [Supabase CLI](https://supabase.com/docs/guides/cli) so the schema lives in version control and ships with one command. The CLI is already declared as a devDependency, so `npm install` (step 1) already installed it.

```bash
npx supabase login                # one-time, opens your browser to authenticate
npm run db:link                   # links to project ref exdatjsgeomejhdofgvw (asks for DB password)
npm run db:push                   # applies all 3 migrations (schema + RLS + seed services)
```

That's it — the database is provisioned. You'll be prompted for the database password you saved in step 2.

### 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in (Supabase dashboard → **Project Settings** → **API**):

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY` — `service_role` `secret` key (used by the future "Add team member" admin flow)
- `USERNAME_EMAIL_DOMAIN` — leave as `areencubs.studio`

### 5. Create your first admin user

Supabase Auth needs an email; we use a synthetic one so users only see a username.

1. Supabase dashboard → **Authentication** → **Users** → **Add user**
2. Email: `yourname@areencubs.studio` (replace `yourname` — this becomes your login username)
3. Password: pick a strong one
4. ✅ **Auto Confirm User**
5. Click **Create user** and copy the new user's UUID
6. Open [`supabase/bootstrap_admin.sql`](./supabase/bootstrap_admin.sql), replace `PASTE-USER-UUID-HERE` and `yourusername` / `Your Full Name`, run it in **SQL Editor**

You can now log in with username `yourname` + your password.

### 6. Run locally

```bash
npm run dev
```

Open http://localhost:3000 → you'll be redirected to `/login`.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new → **Import Git Repository**.
3. Pick this repo.
4. Add the same environment variables from `.env.local` to Vercel (**Project Settings → Environment Variables**).
5. Click **Deploy**. Done — every push to `main` auto-deploys.

---

## Project structure

```
AreenCUBs-Studio/
├─ STRATEGY.md                     ← full strategy & roadmap
├─ README.md                       ← this file
├─ package.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ .env.example                    ← copy to .env.local
├─ src/
│  ├─ middleware.ts                ← auth + route protection
│  ├─ app/
│  │  ├─ layout.tsx                ← root layout + I18nProvider
│  │  ├─ page.tsx                  ← redirects to /login or /dashboard
│  │  ├─ globals.css
│  │  ├─ login/
│  │  │  ├─ page.tsx               ← username + password form
│  │  │  └─ actions.ts             ← server action: signIn
│  │  └─ dashboard/
│  │     ├─ page.tsx               ← role detection
│  │     └─ dashboard-shell.tsx    ← Admin / Worker / Freelancer views
│  ├─ lib/
│  │  ├─ utils.ts                  ← cn(), usernameToEmail()
│  │  ├─ supabase/
│  │  │  ├─ client.ts              ← browser client
│  │  │  ├─ server.ts              ← server-component client
│  │  │  └─ middleware.ts          ← session refresh
│  │  └─ i18n/
│  │     ├─ dictionary.ts          ← FR + EN strings
│  │     └─ provider.tsx           ← <I18nProvider>
│  └─ components/
│     ├─ ui/                       ← Button, Input, Card
│     └─ language-toggle.tsx
└─ supabase/
   ├─ config.toml                                        ← project_id for the CLI
   ├─ migrations/
   │  ├─ 20260506000001_initial_schema.sql              ← tables, enums, triggers
   │  ├─ 20260506000002_rls_policies.sql                ← role-based row-level security
   │  └─ 20260506000003_seed_services.sql               ← 17-service catalog (idempotent)
   └─ bootstrap_admin.sql                                ← promote first user to admin
```

---

## Adding teammates later (after Phase 0)

Until the admin "Manage team" UI ships in Phase 1, add users the same way as the bootstrap admin:

1. Supabase **Auth → Users → Add user** with email `<their-username>@areencubs.studio`
2. SQL Editor:
   ```sql
   insert into public.profiles (id, username, full_name, role)
   values ('UUID-OF-NEW-USER'::uuid, 'their-username', 'Their Name', 'worker'); -- or 'freelancer'
   ```

They sign in with `their-username` + password.

---

## Useful commands

```bash
npm run dev         # local dev server (http://localhost:3000)
npm run build       # production build
npm run start       # run production build
npm run typecheck   # tsc --noEmit
```
