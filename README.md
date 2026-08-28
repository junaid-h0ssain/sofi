# sofi — an educational e-commerce platform (split backend)

A full-stack **electronics store** built to teach modern, service-oriented
development. The monolithic SvelteKit app was migrated into **three
cooperating services** sharing one Neon PostgreSQL database — the exact shape
you'd deploy when a mobile app is next on the roadmap.

Everything is heavily commented so you can read the code top-to-bottom and
learn how each piece works.

## Architecture

```
                    ┌─────────────────────────────┐
  Browser ────────▶ │  web/ SvelteKit (SSR + BFF) │ :5173
                    │  · renders pages            │
                    │  · proxies /api/auth/* ────────────▶ auth/ (Hono + Bun) :4000
                    │  · loads/actions call API ─────────┘  better-auth
                    │    with Bearer <session>     │
                    └─────────────────────────────┘         │
                                                            ▼
  Future mobile ──▶  backend/ SoFi.Api (.NET 10) :5080 ──▶ Neon Postgres
                    EF Core · REST /api/v1        (shared by ALL services)
```

| Service | Stack | Owns |
| --- | --- | --- |
| `auth/` | Hono + Bun + better-auth | `user`, `session`, `account`, `verification` tables; sign-up/in/out, GitHub OAuth |
| `backend/src/SoFi.Api` | ASP.NET Core (.NET 10) + EF Core | `brand`, `category`, `product`, `cart_item`, `order`, `order_item`; all business logic via REST `/api/v1` |
| root (`src/`) | SvelteKit + Svelte 5 + shadcn-svelte | SSR pages; acts as **BFF** (server-side proxy) so the browser only ever talks to one origin |

### How authentication works across services

1. Sign-in posts to better-auth (through the web proxy), which creates a row
   in the shared `session` table and sets a cookie on the web origin.
2. On every request, `hooks.server.ts` validates that cookie against the auth
   service and keeps the **plain session token** in `event.locals`.
3. Server-side page code calls the .NET API with
   `Authorization: Bearer <token>`; a custom ASP.NET handler
   (`Auth/BetterAuthHandler.cs`) verifies the token against the same session
   table and builds the standard claims principal — so plain
   `[Authorize(Roles = "admin")]` just works.
4. **Mobile app later?** Enable better-auth's bearer plugin in `auth/` and send
   the same header from the app — zero API changes needed.

## Tech stack

| Layer | Technology |
| --- | --- |
| Web frontend | [SvelteKit](https://svelte.dev/docs/kit) + Svelte 5 runes, Tailwind CSS 4, [shadcn-svelte](https://shadcn-svelte.com) |
| Backend API | [.NET 10](https://dotnet.microsoft.com) Web API, controllers, Swagger |
| ORM | [EF Core 10](https://learn.microsoft.com/ef/core/) + Npgsql (snake_case naming, jsonb specs, real transactions) |
| Auth | [better-auth](https://better-auth.com) as a standalone [Hono](https://hono.dev) service on Bun |
| Database | PostgreSQL on [Neon](https://neon.tech) (serverless, remote — see compose note) |

## Features

- Catalog with URL-based filters (`?q=&brand=&category=&sort=&min=&max=&page=`)
- Product pages with JSONB spec tables, stock badges, related items
- Database-backed cart with live header badge
- Mock checkout executed in ONE database transaction (order + items +
  stock decrement + cart clear)
- Order history & confirmation with purchase-time price snapshots
- Email/password + GitHub OAuth sign-in/sign-up
- Role-guarded admin panel: dashboard stats, product/brand/category CRUD
- Row Level Security on every domain table

## Getting started

### Prerequisites

- [Bun](https://bun.sh) v1.2+ (web + auth)
- [.NET 10 SDK](https://dotnet.microsoft.com/download) (API)
- A free [Neon](https://neon.tech) database (or any Postgres)

### Configure

```sh
cp .env.example .env   # fill in DATABASE_URL, BETTER_AUTH_SECRET, optionally GitHub keys
```

The `.env` sits at the repo root and feeds **all three services**
(Bun auto-loads it; Program.cs parses it for dotnet; compose interpolates it).

### Run natively (three terminals)

```sh
# 1) auth service (also owns the auth tables' schema)
cd auth && bun install && bun run src/index.ts          # :4000

# 2) .NET API — auto-applies migrations + seeds demo data in Development
cd backend/src/SoFi.Api && dotnet ef database update --context AppDbContext   # first time*
dotnet run                                               # :5080

# 3) web
bun install && bun run dev                               # :5173
```

\* Requires the tool manifest: `cd backend && dotnet tool restore`.
Order matters once: the auth service must create its tables before the API's
first migration runs (its FKs reference the `user` table). After that,
everything is idempotent. `dotnet run` also auto-migrates/seeds in Development.

### Or run everything with Docker Compose

```sh
docker compose up
```

No postgres container — Neon is remote; compose wires all three services to
`${DATABASE_URL}` and waits for auth health before starting the API.
Web runs with hot reload via mounted sources.

### Create an admin account

```sh
cd backend/src/SoFi.Api && dotnet run --no-build -- promote-admin your@email.com
```

Reload the site — "Admin panel" appears in the user menu.

## Useful commands

| Where | Command | Purpose |
| --- | --- | --- |
| root | `bun run dev` / `build` / `check` | web dev server / production build / type-check |
| root | `docker compose up` | run all three services |
| `auth/` | `bun run generate` | regenerate better-auth schema after config changes |
| `auth/` | `bunx drizzle-kit push` | apply auth-table schema changes |
| `backend/` | `dotnet ef migrations add <Name> --project src/SoFi.Api --context AppDbContext` | evolve domain schema |
| `backend/` | `dotnet ef database update --project src/SoFi.Api --context AppDbContext` | apply migrations |
| `backend/src/SoFi.Api` | `dotnet run -- promote-admin <email>` | promote user to admin |

## API surface (`http://localhost:5080/api/v1`)

```
GET  /products?q&brand*&category*&sort&min&max&page     → { items, total, page, pages }
GET  /products/featured?limit=8      GET /products/{slug}    GET /products/{slug}/related
GET  /brands                         GET /categories         (with product counts)

Authorization: Bearer <better-auth-session-token>
GET  /cart                           POST /cart/items        { productId, quantity }
PUT  /cart/items/{itemId}            DELETE /cart/items/{itemId}
DELETE /cart                         POST /checkout/orders   → 201 { orderId }
GET  /orders                         GET /orders/{id}

role=admin:
GET  /admin/products/stats           GET|POST|PUT|DELETE /admin/products[/{id}]
GET|POST /admin/brands               DELETE /admin/brands/{id}
GET|POST /admin/categories           DELETE /admin/categories/{id}
```

Swagger UI: `http://localhost:5080/swagger` (Development only).

## Learning path suggestion

Read in this order:

1. `src/lib/server/db/schema.ts` — *(moved)* now split: `auth/src/db/schema.ts`
   + `backend/src/SoFi.Api/Domain/*.cs`
2. `auth/src/auth.ts` → `auth/src/index.ts` — extracting better-auth into a service
3. `src/routes/api/auth/[...path]/+server.ts` — writing an HTTP proxy correctly
   (multiple Set-Cookie headers!)
4. `src/hooks.server.ts` — cross-service session resolution
5. `backend/src/SoFi.Api/Auth/BetterAuthHandler.cs` — custom ASP.NET authentication
6. `backend/src/SoFi.Api/Data/AppDbContext.cs` — EF Core modelling (jsonb,
   FKs to another service's table, ExcludeFromMigrations)
7. `backend/src/SoFi.Api/Services/CheckoutService.cs` — atomic checkout
8. `src/lib/server/api.ts` — typed BFF client
9. `src/routes/admin/**` — role-guarded CRUD end to end

## Design decisions worth knowing

| Decision | Why |
| -------- | --- |
| Split into three services | One REST API serves web AND future mobile clients unchanged |
| Session-token Bearer instead of JWT | All services share one DB; token lookup is simple and instantly revocable. JWT plugin can be added later without touching the API contract |
| better-auth stays in Node | Reuses battle-tested auth logic + existing accounts; isolated behind a proxy so nothing else needs Node for auth |
| EF Core owns domain schema (migrations) | Versioned schema evolution going forward; RLS re-applied inside the migration |
| Prices as integer cents | No floating-point money bugs anywhere in the stack |
| UUID text ids generated client-side | Lets checkout build every statement up-front; consistent across languages |
| BFF pattern for the web | Browser sees a single origin: no CORS, cookies stay first-party |

---

Built as a learning project — not production-ready (mock payments, no rate
limiting/uploads). Take it apart!
