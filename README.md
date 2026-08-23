# sofi — an educational e-commerce store

A full-stack **electronics store** built to teach modern full-stack development:
browse a catalog, filter by brand/category/price, manage a cart, check out
(mock payment), and administer products through an admin panel — with
authentication, role-based access and database-level Row Level Security.

Everything is heavily commented so you can read the code top-to-bottom and
learn how each piece works.

## Tech stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Framework      | [SvelteKit](https://svelte.dev/docs/kit) + Svelte 5 (runes)       |
| Styling / UI   | Tailwind CSS 4 + [shadcn-svelte](https://shadcn-svelte.com)        |
| Database       | PostgreSQL on [Neon](https://neon.tech) (serverless HTTP driver)   |
| ORM            | [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit              |
| Auth           | [better-auth](https://better-auth.com) (email/password + GitHub, admin plugin) |

## Features

- **Catalog** — product listing with URL-based filters (`?q=&brand=&category=&sort=&min=&max=&page=`),
  so filtered views are shareable links that work without JavaScript
- **Product pages** — flexible JSONB specs table, stock badges, related items
- **Cart** — database-backed per-user cart with live badge count in the header
- **Mock checkout** — address form + simulated payment; the whole order is
  written in **one atomic `db.batch()`** (order + items + stock decrement + cart clear)
- **Orders** — history list and detail page with purchase-time price snapshots
- **Auth** — sign up / sign in / GitHub OAuth; sessions handled by better-auth
- **Admin panel** (`/admin`) — dashboard stats + CRUD for products, brands,
  categories, protected by the user's `role`
- **Row Level Security** — catalog tables are world-readable via policies;
  cart/order tables deny every non-owner connection outright

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- A free [Neon](https://neon.tech) PostgreSQL database (or any Postgres — see note below)

### Setup

```sh
bun install

# configure environment variables
cp .env.example .env
```

Fill in `.env`:

```ini
DATABASE_URL="postgres://…"        # your Neon connection string
BETTER_AUTH_SECRET="any-long-random-string"
ORIGIN="http://localhost:5173"     # app URL (used by better-auth)
GITHUB_CLIENT_ID=""                # optional — enables GitHub login button
GITHUB_CLIENT_SECRET=""
```

Create the tables and load demo data:

```sh
bun run db:push    # create/update tables from src/lib/server/db/schema.ts (incl. RLS policies)
bun run db:seed    # 8 brands, 8 categories, 34 products — idempotent, safe to re-run
```

Start developing:

```sh
bun run dev
```

> Using plain Postgres instead of Neon? Swap the driver in
> `src/lib/server/db/index.ts` (e.g. `drizzle-orm/node-postgres`). Note the
> checkout uses `db.batch()` because the neon-http driver has no transactions;
> with a regular driver you could use `db.transaction()` instead.

### Create an admin account

1. Sign up through the UI (`/signup`)
2. Promote yourself:

```sh
bun run db:admin your@email.com
```

3. Reload the page — the "Admin panel" link appears in the user menu.

## Scripts

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `bun run dev`       | Start the dev server                                      |
| `bun run build`     | Production build                                          |
| `bun run preview`   | Preview the production build                              |
| `bun run check`     | Type-check everything (svelte-check)                      |
| `bun run db:push`   | Push schema.ts changes to the database                    |
| `bun run db:studio` | Browse/edit data in Drizzle Studio                        |
| `bun run db:seed`   | Insert demo data (idempotent upserts)                     |
| `bun run db:admin <email>` | Promote a user to `role = 'admin'`                 |
| `bun run auth:schema` | Regenerate better-auth tables after changing auth config |

## Project structure

```
src/
├── hooks.server.ts            # runs on EVERY request: session → event.locals
├── lib/
│   ├── server/                # ⚠️ never ships to the browser (SvelteKit enforces this)
│   │   ├── auth.ts            # better-auth configuration
│   │   ├── guard.ts           # requireUser() / requireAdmin() redirects
│   │   ├── catalog.ts         # all product/brand/category queries
│   │   ├── cart.ts            # cart reads & writes (ownership-scoped)
│   │   ├── product-form.ts    # shared form parsing/validation for admin
│   │   └── db/
│   │       ├── schema.ts      # all tables, relations & RLS policies ← start reading here!
│   │       ├── index.ts       # database client
│   │       └── seed.ts        # demo data seeder
│   ├── components/
│   │   ├── layout/            # header, footer
│   │   ├── product/           # product card tile
│   │   └── admin/             # shared admin form
│   ├── components/ui/         # shadcn-svelte primitives (button, card, …)
│   ├── utils/                 # money/pricing/slug/link helpers
│   └── types.ts               # shared client+server TypeScript types
└── routes/
    ├── +layout.server.ts      # header data (user, categories, cart count)
    ├── +page.svelte           # homepage: hero, categories, featured
    ├── products/              # catalog + filters, [slug] detail + add-to-cart
    ├── cart/                  # cart page + quantity/remove/clear actions
    ├── checkout/              # mock checkout → atomic batch write
    ├── orders/                # order history + [id] confirmation/detail
    ├── login, signup, signout # authentication pages
    └── admin/                 # guarded area: stats + product/brand/category CRUD
```

## How a request flows (the mental model)

```
browser ──GET /products?category=router──▶ hooks.server.ts
                                            │ loads session → event.locals.user
                                            ▼
                               routes/products/+page.server.ts   (load)
                                            │ calls $lib/server/catalog.ts
                                            ▼
                                        Neon Postgres
                                            │ rows returned
                                            ▼
                               routes/products/+page.svelte      (render)

browser ──POST /cart?/setQuantity──▶ same route's actions.setQuantity()
                                            │ validates + writes via Drizzle
                                            ▼
                          re-rendered page / redirect / action result
```

Key SvelteKit ideas used throughout:

- **load functions** fetch data before rendering (`+page.server.ts`)
- **form actions** are named POST handlers (`?/addToCart`) — real HTML forms
  that work without JavaScript; `use:enhance` adds smooth client behavior
- **URL is state** — filters/pagination live in query params
- **layouts** share data across pages (header user/cart info)
- **Svelte 5 runes** — `$props`, `$state`, `$derived`, snippets

## Design decisions worth knowing

| Decision | Why |
| -------- | --- |
| Prices as integer cents | Floating-point money causes rounding bugs; `$19.99` is stored as `1999` |
| UUID text ids generated in JS | Needed so checkout can build ALL statements before executing one atomic batch |
| Order copies name/price | Old orders stay historically correct after products change |
| `db.batch()` not `db.transaction()` | neon-http driver has no interactive transactions; batch is atomic over one request |
| Filters in URL params | Shareable/bookmarkable views; works without JS |
| RLS on every table | Defense-in-depth if a lesser DB credential ever leaks |

## Learning path suggestion

Read the files in this order:

1. `src/lib/server/db/schema.ts` — the data model
2. `src/lib/server/db/index.ts` — connecting to Postgres
3. `src/hooks.server.ts` + `src/lib/server/auth.ts` — sessions
4. `src/lib/server/catalog.ts` — querying with Drizzle
5. `src/routes/products/+page.server.ts` then its `.svelte` — load + render
6. `src/routes/products/[slug]/+page.server.ts` — your first form action
7. `src/routes/checkout/+page.server.ts` — atomic multi-table writes
8. `src/routes/admin/…` — guards + full CRUD

---

Built as a learning project — not production-ready (no real payments, rate
limiting, or image uploads). Take it apart!
