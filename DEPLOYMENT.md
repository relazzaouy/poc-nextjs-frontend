# Deployment — frontend

Full, cross-repository setup lives in the orchestrator repo:
**`poc-deployment/DEPLOYMENT.md`**. This file covers only what is specific to
this service.

## Vercel project

| Field | Value |
| --- | --- |
| Import from | `<owner>/poc-nextjs-frontend` |
| Framework Preset | **Next.js** (auto-detected) |
| Root Directory | `./` |
| Production branch | `main` |

No payment method is required. Vercel's Hobby plan takes no card and cannot be
billed — it pauses at the free-tier limits instead.

> Hobby is for **personal, non-commercial** projects. Fine for this POC; a real
> organisation project would need Pro.

## Environment variables to set in Vercel

| Key | Value | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://poc-nestjs-backend.vercel.app` | yes |

No trailing slash — the app appends `/api/hello`.

## The build-time gotcha

`NEXT_PUBLIC_*` variables are **inlined into the JavaScript bundle by
`next build`**, not read at runtime. Consequences:

1. Vercel exposes project environment variables during the build, so the value is
   baked in then.
2. **Changing `NEXT_PUBLIC_API_URL` requires a redeploy**, not a restart. Editing
   the value alone changes nothing that is already served.
3. The deploy pipeline builds the backend first so the frontend build always bakes
   in a backend that is already live.

If the deployed page shows `(NEXT_PUBLIC_API_URL is not set)` under the button,
the variable was missing when the build ran. Set it and redeploy.

## Automatic deployments are disabled

`vercel.json` contains:

```json
{ "git": { "deploymentEnabled": { "main": false } } }
```

Pushes to `main` do not deploy. Only the Deploy Hook fired by `poc-deployment`
does, which keeps the orchestrator as the single deployment entry point.

## CORS

The browser calls the backend directly, so the backend must allow this origin.
Set `CORS_ORIGIN` on the **backend** Vercel project to this project's URL.

A failed click showing "Failed to fetch" with a CORS error in the browser console
means that value is wrong or unset. Note the backend still returns `200` — CORS is
enforced by the browser using a header the server either sends or withholds, which
is why `curl` can look perfectly healthy while every click fails.

## Docker

The `Dockerfile` is **not** what Vercel runs, but CI still builds and smoke tests
it on every pull request, so the frontend stays portable to any container host.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 -t poc-nextjs-frontend .
docker run --rm -p 3000:3000 -e PORT=3000 poc-nextjs-frontend
```

## GitHub configuration for this repository

*Settings → Secrets and variables → Actions*

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `DEPLOY_DISPATCH_TOKEN` | fine-grained PAT scoped to `poc-deployment`, Contents: write |
| Variable | `DEPLOY_ORCHESTRATOR_REPO` | `<owner>/poc-deployment` |

`GITHUB_TOKEN` cannot be used for the dispatch: it is scoped to this repository
only and returns `404` against another repo's `/dispatches` endpoint. The
fine-grained PAT above is the minimum-privilege replacement — one repository, one
permission.

## What happens on merge

```
merge to main -> frontend-ci.yml validate -> repository_dispatch(deploy-all)
              -> poc-deployment/deploy.yml -> deploy backend -> deploy frontend
```

The deployed URLs appear in the **`poc-deployment`** run summary, not this one.
