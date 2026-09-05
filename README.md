# code-vibes

A full-stack **personal & business finance tracker** with debt and credit bookkeeping. Track income and expenses per finance space, record money you owe (**debts**) and money owed to you (**credits**), log repayments, and see a live dashboard summary — all scoped to your account.

This is a monorepo containing:

| Directory | Description |
| --- | --- |
| [`income-tracker`](income-tracker/) | Go / PostgreSQL REST API backend |
| [`income-tracker-web`](income-tracker-web/) | React 19 + TypeScript + Vite frontend |
| [`stitch_personal_finance_debt_tracker`](stitch_personal_finance_debt_tracker/) | UI/UX design explorations (specs & HTML prototypes) that inform the app's visual theme |

## Features

- **Account auth** — register/login with email & password (bcrypt-hashed), JWT sessions.
- **Finance spaces** — keep finances organized into separate *personal* and *business* workspaces under one account.
- **Income & expenses** — category-tagged cash-flow records (income and expense category types).
- **Debt & credit tracking** —
  - *Debts*: money you owe someone, with **debt repayments**.
  - *Credits*: money you lent / is owed to you, with **credit repayments**.
  - Outstanding amounts are derived automatically from the repayment ledgers.
- **People** — an address book of contacts you owe or are owed by.
- **Dashboard** — per-space summary cards (income, expenses, balance, money you owe, money owed to you) plus recent-activity and repayment lists.

## Repository layout

### `income-tracker/` — Backend

Go 1.25, standard-library HTTP routing, PostgreSQL via `pgx/v5`.

- `cmd/server/main.go` — server entrypoint and route registration.
- `internal/…` — one package per domain (`users`, `auth`, `finance`, `categories`, `people`, `income`, `expenses`, `debts`, `debt_repayments`, `credits`, `credit_repayments`, `dashboard`, `database`). Each domain exposes SQL logic plus an HTTP handler (`Create`, `List`).
- Multi-stage `Dockerfile` → distroless static image (default port `8080`).

### `income-tracker-web/` — Frontend

React 19 + TypeScript + Vite, linted with [Oxlint](https://oxc.rs). Application code lives primarily in `src/App.tsx`.

- In development, Vite proxies `/api/*` → `http://localhost:8080` (rewriting the prefix away). See `vite.config.ts`.
- Styling is split into theme tokens (`src/index.css`, *Midnight Obsidian* palette) and component styles (`src/App.css`).

### `stitch_personal_finance_debt_tracker/` — Design explorations

Concept mockups for the product across two visual directions — the light *Clarity* family and the dark *Aegis Ledger / Midnight Obsidian* family. Each concept folder contains a self-contained `code.html` prototype and, where available, a `screen.png` preview. The `DESIGN.md` files under `clarity_wealth/` and `midnight_obsidian_financial_discipline/` are full token-level design specs (colors, type scale, radii, spacing, components). The shipped frontend implements the **Midnight Obsidian** theme.

## Getting started

### Prerequisites

- Go 1.25+
- Node.js (recent LTS) + npm
- A running PostgreSQL instance (or use the included dev container)

### 1. Backend (`income-tracker`)

Configure the database connection and secrets via environment variables (or a `.env` file in `income-tracker/`):

| Variable | Purpose |
| --- | --- |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign/verify auth tokens (**required**) |
| `FRONTEND_URL` | Allowed CORS origin; defaults to `*` when unset |
| `PORT` | HTTP port (default `8080`) |

> Note: the repository does not ship database migrations — the schema is expected to exist in your PostgreSQL instance. Define tables matching the queries in the `internal/*` packages (or restore from your existing database) before first run.

```bash
cd income-tracker
go mod download
go run ./cmd/server
```

### 2. Frontend (`income-tracker-web`)

```bash
cd income-tracker-web
npm install
npm run dev        # http://localhost:5173
```

`VITE_API_URL` can override the API base URL (default `http://localhost:8080`). When running the frontend dev server alongside the backend on `localhost`, the built-in `/api` proxy handles the connection.

### Dev container

A `.devcontainer/` is provided (VSCode / GitHub Codespaces) that forwards PostgreSQL (`5433`) and the frontend (`5173`, auto-opened in the browser).

## API overview

All routes below require `Authorization: Bearer <token>`, except registration and login:

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/users` | Register an account |
| `POST` | `/login` | Log in, returns JWT + user |
| `GET` | `/health` | Health check |
| `GET/POST` | `/finance-spaces` | List / create finance spaces |
| `GET/POST` | `/categories` | List / create income & expense categories |
| `GET/POST` | `/people` | List / create people |
| `GET/POST` | `/income` | List / create income records |
| `GET/POST` | `/expenses` | List / create expense records |
| `GET/POST` | `/debts` | List / create debts (money you owe) |
| `GET/POST` | `/debt-repayments` | List / create debt repayments |
| `GET/POST` | `/credits` | List / create credits (owed to you) |
| `GET/POST` | `/credit-repayments` | List / create credit repayments |
| `GET` | `/dashboard` | Dashboard summary |

## Deployment

The backend is containerized for deployment (see `income-tracker/Dockerfile`) and has been deployed on [Render](https://render.com) as a two-service setup (API + web). Set the environment variables from the table above (at minimum `JWT_SECRET` and the `DB_*` values) on the API service, and `VITE_API_URL` on the web service.

## License

[MIT](LICENSE) © 2026 HerPerception
