Project Articture


frontend/
├─ src/
│  ├─ app/
│  │  ├─ core/                       # singletons (NO UI)
│  │  │  ├─ auth/
│  │  │  │  ├─ auth.service.ts       # Cognito/OIDC tokens, session
│  │  │  │  └─ auth.guard.ts
│  │  │  ├─ http/
│  │  │  │  ├─ api-client.ts         # generated from OpenAPI
│  │  │  │  └─ auth.interceptor.ts   # attach JWT; 401 refresh/redirect
│  │  │  ├─ config/
│  │  │  │  ├─ runtime-config.service.ts  # loads /assets/config/config.json
│  │  │  └─ state/                   # (optional) NgRx, Akita, or Signals stores
│  │  ├─ shared/                     # dumb/presentational components, pipes, directives
│  │  ├─ layout/                     # shell, header, sidebar, footer
│  │  ├─ features/                   # lazy-loaded verticals (one module per domain)
│  │  │  ├─ account/
│  │  │  └─ content/
│  │  ├─ pages/                      # route containers (if you separate page vs feature)
│  │  └─ app.routes.ts               # standalone routing
│  ├─ assets/
│  │  └─ config/
│  │     ├─ config.dev.json
│  │     ├─ config.stage.json
│  │     └─ config.prod.json
│  ├─ environments/                  # keep minimal; prefer runtime config above
│  ├─ styles/                        # global styles (Tailwind/SCSS)
│  └─ i18n/                          # en.json, ar.json (ngx-translate or built-in i18n)
├─ tools/                            # scripts (postbuild swap, codegen hooks)
├─ angular.json
├─ package.json
└─ tsconfig.json

================================================================================================

backend/
├─ cdk/                               # Infrastructure-as-code (TypeScript CDK)
│  ├─ bin/
│  │  └─ moso3a.ts                    # entry; reads STAGE env
│  ├─ lib/
│  │  ├─ auth-cognito.stack.ts        # UserPool, domain, app clients, triggers
│  │  ├─ api-http.stack.ts            # API Gateway HTTP API, routes -> Lambdas
│  │  ├─ storage.stack.ts             # DynamoDB tables, S3 buckets
│  │  ├─ web-hosting.stack.ts         # S3+CloudFront for Angular (OAC, cache)
│  │  └─ observability.stack.ts       # log groups, alarms, dashboards
│  ├─ cdk.json
│  └─ package.json
│
├─ services/                          # One folder per bounded context (Lambda)
│  ├─ users/
│  │  ├─ src/
│  │  │  ├─ handlers/http.ts          # APIGW router (tiny)
│  │  │  ├─ domain/                   # entities, use-cases (pure)
│  │  │  ├─ infra/                    # dynamo.repo.ts, s3.adapter.ts
│  │  │  ├─ utils/                    # validation, errors
│  │  │  └─ index.ts                  # handler export
│  │  ├─ tests/
│  │  ├─ package.json                 # keep deps tiny; esbuild-friendly
│  │  └─ tsconfig.json
│  └─ content/
│     └─ ... (same structure)
│
├─ api/
│  ├─ openapi.yaml                    # single source of truth for HTTP shapes
│  ├─ codegen/
│  │  ├─ generate.mjs                 # generates TS types + Angular client
│  │  └─ generated/                   # (ignored from git) output artifacts
│  └─ contracts/                      # JSON Schemas (zod optional)
│
├─ shared/                            # code reused by multiple Lambdas
│  ├─ logging/                        # powertools wrappers, requestId, tracing
│  ├─ config/                         # typed config loader (env/SSM)
│  └─ validation/                     # zod/valibot schemas
│
├─ config/                            # non-secret per-stage config snapshots
│  ├─ dev.json
│  ├─ stage.json
│  └─ prod.json
│
├─ scripts/                           # local dev & CI helpers
│  ├─ deploy.ts
│  └─ seed.ts
├─ tests/                             # integration tests (LocalStack or AWS)
├─ package.json
└─ tsconfig.json


