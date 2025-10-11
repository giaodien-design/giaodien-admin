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

# AWS S3 Configuration (for image uploads)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name_here
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

### AWS S3 Setup (for Image Uploads)

This application uses AWS S3 to store uploaded app icons. To set it up:

1. **Create an S3 Bucket**:

   - Go to AWS Console → S3
   - Create a new bucket (e.g., `giaodien-admin-uploads`)
   - Choose your preferred region

2. **Configure Bucket Permissions**:

   - Block public access can be enabled (we'll use IAM credentials)
   - Or make it public if you want direct access to images

3. **Create IAM User**:

   - Go to AWS Console → IAM → Users
   - Create a new user for programmatic access
   - Attach policy with S3 permissions (e.g., `AmazonS3FullAccess` or custom policy)

4. **Custom IAM Policy** (recommended for production):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

5. **Add credentials to `.env`**:
   - Copy the Access Key ID and Secret Access Key
   - Add them to your `.env` file (see step 3 above)

### Notes

- Prisma Client is generated to `src/generated/prisma` (see `prisma/schema.prisma`). Files like `src/lib/prisma.ts` import from this path. If you see module-not-found errors, run `pnpm prisma generate`.
- The app uses the App Router and enables server actions (`next.config.ts`).
- Image uploads are handled via `/api/upload` endpoint which stores files in AWS S3.
- Maximum upload size is 5MB per image (configurable in `src/lib/s3.ts`).

### Troubleshooting

- "Error: P1001" or connection refused: Ensure Docker Postgres is running and `DATABASE_URL` is correct.
- "Cannot find module '@/generated/prisma'": Run `pnpm prisma generate`.
- Migrations failing on first run: Try `pnpm prisma db push` to create the schema, then `pnpm prisma migrate dev`.

### License
