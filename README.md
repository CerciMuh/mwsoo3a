# Project Architecture

This repository contains both the **frontend (Angular)** and **backend (AWS CDK + Lambda)** codebases.  
The structure emphasizes modular design, clear separation of concerns, and infrastructure as code.

---

## Frontend (`/frontend`)

- **src/**
  - **app/**
    - **core/** – singletons (no UI)
      - **auth/**
        - `auth.service.ts` – Cognito/OIDC tokens, session handling  
        - `auth.guard.ts` – route guard  
      - **http/**
        - `api-client.ts` – generated from OpenAPI  
        - `auth.interceptor.ts` – attach JWT, handle 401 refresh/redirect  
      - **config/**
        - `runtime-config.service.ts` – loads `/assets/config/config.json`  
      - **state/** – optional NgRx, Akita, or Signals stores  
    - **shared/** – presentational components, pipes, directives  
    - **layout/** – shell, header, sidebar, footer  
    - **features/** – lazy-loaded modules (one per domain)  
      - **account/**  
      - **content/**  
    - **pages/** – route containers (if separated from features)  
    - `app.routes.ts` – standalone routing  
  - **assets/**
    - **config/**
      - `config.dev.json`  
      - `config.stage.json`  
      - `config.prod.json`  
  - **environments/** – minimal (prefer runtime config)  
  - **styles/** – global styles (Tailwind/SCSS)  
  - **i18n/** – `en.json`, `ar.json` (ngx-translate or Angular i18n)  
- **tools/** – scripts (postbuild swap, codegen hooks)  
- `angular.json`  
- `package.json`  
- `tsconfig.json`  

---

## Backend (`/backend`)

- **cdk/** – infrastructure as code (TypeScript CDK)  
  - **bin/**
    - `moso3a.ts` – entry; reads STAGE env  
  - **lib/**
    - `auth-cognito.stack.ts` – UserPool, domain, app clients, triggers  
    - `api-http.stack.ts` – API Gateway HTTP API, routes to Lambdas  
    - `storage.stack.ts` – DynamoDB tables, S3 buckets  
    - `web-hosting.stack.ts` – S3 + CloudFront for Angular hosting  
    - `observability.stack.ts` – log groups, alarms, dashboards  
  - `cdk.json`  
  - `package.json`  

- **services/** – one folder per bounded context (Lambda)  
  - **users/**
    - **src/**
      - `handlers/http.ts` – APIGW router  
      - **domain/** – entities, use-cases (pure logic)  
      - **infra/** – `dynamo.repo.ts`, `s3.adapter.ts`  
      - **utils/** – validation, errors  
      - `index.ts` – handler export  
    - **tests/**  
    - `package.json` – minimal, esbuild-friendly  
    - `tsconfig.json`  
  - **content/** – same structure as `users/`  

- **api/**  
  - `openapi.yaml` – single source of truth for HTTP shapes  
  - **codegen/**  
    - `generate.mjs` – generates TS types + Angular client  
    - **generated/** – ignored in Git  
  - **contracts/** – JSON Schemas (optional Zod)  

- **shared/** – reusable code for Lambdas  
  - **logging/** – powertools wrappers, requestId, tracing  
  - **config/** – typed config loader (env/SSM)  
  - **validation/** – Zod/Valibot schemas  

- **config/** – per-stage non-secret config snapshots  
  - `dev.json`  
  - `stage.json`  
  - `prod.json`  

- **scripts/** – local dev & CI helpers  
  - `deploy.ts`  
  - `seed.ts`  

- **tests/** – integration tests (LocalStack or AWS)  
- `package.json`  
- `tsconfig.json`  

---

## Key Principles

- **Separation of Concerns**: frontend and backend live in distinct workspaces.  
- **Single Source of Truth**: OpenAPI spec drives both client and server contracts.  
- **Runtime Config**: prefer JSON runtime configs over environment builds.  
- **Infrastructure as Code**: all AWS resources defined in CDK.  
- **Scalable Services**: each bounded context is its own Lambda service with domain, infra, and handler layers.  

---

## Development Workflow

1. **Frontend**  
   - Angular standalone components + lazy-loaded features  
   - Runtime configuration from `/assets/config`  
   - i18n with `ngx-translate` or Angular built-in  

2. **Backend**  
   - CDK for infrastructure (Cognito, API Gateway, DynamoDB, S3, CloudFront)  
   - OpenAPI contract generates Angular API client and TypeScript models  
   - Each service organized by domain (domain, infra, handlers)  

3. **Testing**  
   - Unit tests inside each service folder  
   - Integration tests in `/tests` using LocalStack or AWS test environments  
