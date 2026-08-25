# poc-nextjs-frontend

Minimal Next.js + TypeScript UI for the multi-repo CI/CD proof of concept.

This repository is **independent**. It contains no backend source code and talks
to the API purely over HTTP, at a URL supplied by an environment variable.

The page renders "Multi-Repo CI/CD POC" and a **Call Backend** button that
fetches `${NEXT_PUBLIC_API_URL}/api/hello` and shows the response.

## Local development

The backend is not required to start the frontend — you just get an error panel
when you click the button.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

To exercise the full path, run `poc-nestjs-backend` on port 3001 in another
terminal, with `NEXT_PUBLIC_API_URL=http://localhost:3001` here.

## Environment variables

| Variable | Local | Render |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://poc-nestjs-backend.onrender.com` |

No trailing slash — the app appends `/api/hello`.

**This value is baked in at build time.** Next.js inlines every `NEXT_PUBLIC_*`
variable into the client bundle during `next build`, so changing it requires a
rebuild, not a restart. That is why the deploy pipeline builds the backend first
and the frontend second. Locally, restart `npm run dev` after editing
`.env.local`.

`.env*` files are gitignored; only `.env.example` is tracked.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | dev server on 3000 |
| `npm run build` | production build (`output: 'standalone'`) |
| `npm start` | serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 -t poc-nextjs-frontend .
docker run --rm -p 3000:3000 -e PORT=3000 poc-nextjs-frontend
```

The build arg is not optional — omit it and the deployed page has no backend to
call. Render supplies it from the service's environment variables.

Three stages: install dependencies, build, then a `node:22-alpine` runtime that
carries only the standalone server, static assets, and `public/`, running as the
non-root `node` user.

## CI/CD

`.github/workflows/frontend-ci.yml`

- **Pull request → `main`** — install, lint, typecheck, build, `docker build`,
  and a container smoke test. Nothing deploys.
- **Push to `main` (merge)** — the same validation, then a `repository_dispatch`
  to `poc-deployment`, which deploys **both** applications.

Deployment configuration lives in [DEPLOYMENT.md](DEPLOYMENT.md).
