# Deployment — frontend

Full, cross-repository setup lives in the orchestrator repo:
**`poc-deployment/DEPLOYMENT.md`**. This file covers only what is specific to
this service.

## Render service

| Field | Value |
| --- | --- |
| Type | Web Service |
| Repository | `<owner>/poc-nextjs-frontend` |
| Language / Runtime | **Docker** |
| Dockerfile Path | `./Dockerfile` |
| Branch | `main` |
| Health Check Path | `/` |
| Auto-Deploy | **Off** — `poc-deployment` owns deployments |

## Environment variables to set in Render

| Key | Value | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://poc-nestjs-backend.onrender.com` | yes |
| `PORT` | — | **no**, Render injects it |

No trailing slash.

## The build-time gotcha

`NEXT_PUBLIC_*` variables are **inlined into the JavaScript bundle by
`next build`**, not read at runtime. Consequences:

1. The `Dockerfile` declares `ARG NEXT_PUBLIC_API_URL` and promotes it to `ENV`
   before `npm run build`. Render forwards the service's environment variables to
   `docker build` as build args, which is how it gets populated.
2. **Changing `NEXT_PUBLIC_API_URL` in Render requires a redeploy**, not a
   restart. Editing the value alone changes nothing that is already served.
3. The deploy pipeline builds the backend first so the frontend build always
   bakes in a backend that is already live.

If the deployed page shows `(NEXT_PUBLIC_API_URL is not set)` under the button,
the variable was missing when the image was built. Set it and redeploy.

## CORS

The browser calls the backend directly, so the backend must allow this origin.
Set `CORS_ORIGIN` on the **backend** Render service to this service's URL. A
failed call showing "Failed to fetch" with a CORS error in the browser console
means that value is wrong or unset.

## GitHub configuration for this repository

*Settings → Secrets and variables → Actions*

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `DEPLOY_DISPATCH_TOKEN` | fine-grained PAT scoped to `poc-deployment`, Contents: write |
| Variable | `DEPLOY_ORCHESTRATOR_REPO` | `<owner>/poc-deployment` |

`GITHUB_TOKEN` cannot be used for the dispatch: it is scoped to this repository
only and returns `404` against another repo's `/dispatches` endpoint. The
fine-grained PAT above is the minimum-privilege replacement — one repository,
one permission.

## What happens on merge

```
merge to main -> frontend-ci.yml validate -> repository_dispatch(deploy-all)
              -> poc-deployment/deploy.yml -> deploy backend -> deploy frontend
```

The deployed URLs appear in the **`poc-deployment`** run summary, not this one.
