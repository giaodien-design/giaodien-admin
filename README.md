## GiaoDien Admin

Modern admin dashboard built with Next.js (App Router). Uses Prisma ORM with PostgreSQL and Tailwind CSS for styling.

### Tech stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, `clsx`, `tailwind-merge`
- **UI/UX**: Radix UI (`@radix-ui/react-*`), Lucide icons
- **Database**: PostgreSQL (Docker), Prisma 6

### Requirements

- Node.js 20+ (recommended)
- pnpm (recommended) or npm/yarn
- Docker (optional, used here for local PostgreSQL)

### Quick start

1. Install deps

```bash
pnpm install
```

2. Start database (Docker)

```bash
docker compose up -d
```

3. Configure environment
   Create a `.env` file in the project root:

```bash
# PostgreSQL (matches docker-compose.yml)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/giaodien_db?schema=public"
```

4. Prisma: generate client and sync schema

```bash
# generate the Prisma Client into ./src/generated/prisma
pnpm prisma generate

# create the database schema (choose one)
pnpm prisma migrate dev --name init
# or
pnpm prisma db push
```

5. Optional: seed database

```bash
pnpm prisma db seed
# or
npx tsx prisma/seed.ts
```

6. Run the app

```bash
pnpm dev
```

Visit `http://localhost:3000`.

### Scripts

- `pnpm dev`: Start Next.js in dev mode
- `pnpm build`: Generate Prisma client, then build Next.js
- `pnpm start`: Start Next.js production server
- `pnpm lint`: Run Next.js ESLint
- `pnpm postinstall`: Auto-runs `prisma generate`

### Project structure (high-level)

```
src/
  app/              # App Router pages and routes
    api/
      apps/
        route.ts    # Apps API endpoint
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/             # Radix UI components (button, alert, etc.)
  generated/
    prisma/         # Generated Prisma Client
  lib/
    prisma.ts       # Prisma client (generated import)
    utils.ts        # Utilities (e.g., cn)
  types/
    app.ts          # Application type definitions
    screen.ts
    index.ts
prisma/
  schema.prisma     # Prisma schema (PostgreSQL)
  seed.ts           # Database seeding script
public/             # Static assets (SVGs, images)
docker-compose.yml  # Local PostgreSQL service
```

### Notes

- Prisma Client is generated to `src/generated/prisma` (see `prisma/schema.prisma`). Files like `src/lib/prisma.ts` import from this path. If you see module-not-found errors, run `pnpm prisma generate`.
- The app uses the App Router and enables server actions (`next.config.ts`).
- Images are allowed from `images.unsplash.com` per `next.config.ts`.

### Troubleshooting

- "Error: P1001" or connection refused: Ensure Docker Postgres is running and `DATABASE_URL` is correct.
- "Cannot find module '@/generated/prisma'": Run `pnpm prisma generate`.
- Migrations failing on first run: Try `pnpm prisma db push` to create the schema, then `pnpm prisma migrate dev`.

### License
