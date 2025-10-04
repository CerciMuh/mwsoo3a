'''text
frontend/
├─ src/
│  ├─ app/
│  │  ├─ core/                 # Singletons (NO UI)
│  │  │  ├─ auth/
│  │  │  │  ├─ auth.service.ts       # Cognito/OIDC tokens, session
│  │  │  │  └─ auth.guard.ts
│  │  │  ├─ http/
│  │  │  │  ├─ api-client.ts         # Generated from OpenAPI
│  │  │  │  └─ auth.interceptor.ts   # Attach JWT; 401 refresh/redirect
│  │  │  ├─ config/
│  │  │  │  └─ runtime-config.service.ts # Loads /assets/config/config.json
│  │  │  └─ state/                   # (Optional) NgRx, Akita, or Signals stores
│  │  ├─ shared/                     # Dumb/presentational components, pipes, directives
│  │  ├─ layout/                     # Shell, header, sidebar, footer
│  │  ├─ features/                   # Lazy-loaded modules (one per domain)
│  │  │  ├─ account/
│  │  │  └─ content/
│  │  ├─ pages/                      # Route containers (optional separation)
│  │  └─ app.routes.ts               # Standalone routing
│  ├─ assets/
│  │  └─ config/
│  │     ├─ config.dev.json
│  │     ├─ config.stage.json
│  │     └─ config.prod.json
│  ├─ environments/                  # Keep minimal; prefer runtime config
│  ├─ styles/                        # Global styles (Tailwind/SCSS)
│  └─ i18n/                          # en.json, ar.json (ngx-translate or Angular i18n)
├─ tools/                            # Scripts (postbuild swap, codegen hooks)
├─ angular.json
├─ package.json
└─ tsconfig.json
backend/
├─ cdk/                         # Infrastructure as Code (TypeScript CDK)
│  ├─ bin/
│  │  └─ moso3a.ts                   # Entry; reads STAGE env
│  ├─ lib/
│  │  ├─ auth-cognito.stack.ts       # UserPool, domain, app clients, triggers
│  │  ├─ api-http.stack.ts           # API Gateway HTTP API, routes -> Lambdas
│  │  ├─ storage.stack.ts            # DynamoDB tables, S3 buckets
│  │  ├─ web-hosting.stack.ts        # S3 + CloudFront for Angular hosting
│  │  └─ observability.stack.ts      # Log groups, alarms, dashboards
│  ├─ cdk.json
│  └─ package.json
│
├─ services/                    # One folder per bounded context (Lambda)
│  ├─ users/
│  │  ├─ src/
│  │  │  ├─ handlers/http.ts         # APIGW router (tiny)
│  │  │  ├─ domain/                  # Entities, use-cases (pure logic)
│  │  │  ├─ infra/                   # dynamo.repo.ts, s3.adapter.ts
│  │  │  ├─ utils/                   # Validation, errors
│  │  │  └─ index.ts                 # Handler export
│  │  ├─ tests/
│  │  ├─ package.json                # Keep deps minimal; esbuild-friendly
│  │  └─ tsconfig.json
│  └─ content/                       # Same structure as users/
│
├─ api/
│  ├─ openapi.yaml                   # Single source of truth for HTTP shapes
│  ├─ codegen/
│  │  ├─ generate.mjs                # Generates TS types + Angular client
│  │  └─ generated/                  # (Ignored in git) output artifacts
│  └─ contracts/                     # JSON Schemas (optional Zod)
│
├─ shared/                           # Code reused by multiple Lambdas
│  ├─ logging/                       # Powertools wrappers, requestId, tracing
│  ├─ config/                        # Typed config loader (env/SSM)
│  └─ validation/                    # Zod/Valibot schemas
│
├─ config/                           # Non-secret per-stage config snapshots
│  ├─ dev.json
│  ├─ stage.json
│  └─ prod.json
│
├─ scripts/                          # Local dev & CI helpers
│  ├─ deploy.ts
│  └─ seed.ts
│
├─ tests/                            # Integration tests (LocalStack or AWS)
├─ package.json
└─ tsconfig.json

'''text
