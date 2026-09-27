# Cats in Knead

Cats in Knead is an Express and TypeScript website with a PostgreSQL-backed admin panel.

## Requirements

- Node.js 20
- PostgreSQL 14 or newer

## Run locally

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Set the required environment variables. Copy `.env.example` as a reference, then export the values in your shell or configure them in your hosting provider:

   ```bash
   export DATABASE_URL="postgresql://postgres:password@localhost:5432/cats_in_knead"
   export SESSION_SECRET="replace-with-a-long-random-secret"
   ```

3. Start the server:

   ```bash
   npm run dev
   ```

   The site is available at `http://localhost:5000` by default.

The server creates and verifies its required PostgreSQL tables during startup. The first startup creates an admin account and prints its temporary credentials in the server log. Change that password after signing in.

## Useful commands

```bash
npm ci             # Install the exact lockfile dependencies
npm run check      # Type-check the server and shared code
npm run dev        # Start the development server
npm start          # Start the server for a hosting provider
```

## Pages

- `/` — public website
- `/admin` — admin login
- `/admin.html` — admin login, direct file URL

The public site is a single-page website. Sections such as `/cats`, `/clinic`, `/foster`, `/forms`, `/contact`, and `/resources` are supported direct URLs and are also available through the navigation.

## GitHub and deployment

GitHub stores the source code but does not run this Express server or provide the PostgreSQL database. To deploy from a GitHub repository, use a Node-compatible hosting provider:

- Install command: `npm ci`
- Start command: `npm start`
- Required environment variables: `DATABASE_URL`, `SESSION_SECRET`
- Optional environment variables: `PORT`, `HOST`

Never commit `.env` files, database URLs, session secrets, or generated credentials. The included `.gitignore` excludes those files.

Uploaded images are stored in `public/uploads` by the current application. If the hosting provider uses ephemeral storage, configure persistent storage before relying on uploaded images.