# Papre

Papre is a private space to organize notes, journal by date, and keep a
personal reading library — pages and folders, a calendar journal, PDF/manual
book volumes, workspaces with roles, and page sharing, with page content
encrypted at rest.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Prisma 7](https://www.prisma.io) + PostgreSQL
- [Auth.js (NextAuth v5)](https://authjs.dev) — Google OAuth + email/password
- [MinIO](https://min.io) for object storage (cover images, imported PDFs)
- [BlockNote](https://www.blocknotejs.org) for the page editor
- [Bun](https://bun.sh) as the package manager and runtime

## Getting started

### 1. Environment variables

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

See `.env.example` for the full list of required variables (database,
auth, MinIO, SMTP). `DATA_ENCRYPTION_MASTER_KEY` must be a base64-encoded
32-byte key — generate one with:

```bash
openssl rand -base64 32
```

### 2. Run with Docker Compose (recommended)

This spins up Postgres, MinIO, runs migrations, and starts the app:

```bash
docker compose up -d --build
```

### 3. Or run locally

Requires a Postgres database and a MinIO server reachable at the values in
your `.env`.

```bash
bun install       # also runs `prisma generate` via postinstall
bunx prisma migrate deploy
bun run dev
```

The app runs at [http://localhost:3000](http://localhost:3000) by default.

## Project structure

- `src/app` — Next.js App Router routes (auth, protected app, API routes)
- `src/components` — UI components
- `src/services` — server actions (data access + mutations)
- `src/lib` — shared server-side utilities (encryption, MinIO, mail, auth config)
- `prisma/schema.prisma` — database schema
- `prisma/migrations` — versioned schema migrations

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run start` | Start the production server |
| `bun run lint` | Run ESLint |
| `bun run encrypt:data` | One-off script to encrypt any pre-existing unencrypted data |

## License

[MIT](./LICENSE)
