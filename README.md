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
