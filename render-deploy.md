# Render deployment

Use a Render **Web Service** with the repository root set to this project.

| Setting | Value |
|---|---|
| Build Command | `pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm start` |
| Runtime | Node.js |
| Port | Render-provided `PORT` |
| Health Check Path | `/healthz` |

Required private environment variables are `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `CANONICAL_ORIGIN`, and `GMAIL_SMTP_APP_PASSWORD`. The Gmail value must be a Google-generated App Password for `ankit.mukhmal.official@gmail.com`; never use a normal Gmail password in deployment.

The public enquiry form validates name, Indian mobile number, website type, and budget. A honeypot rejects bot-filled submissions, and the database stores a SHA-256 phone hash with a unique constraint to block repeat enquiries from the same mobile number. Email delivery remains disabled until `GMAIL_SMTP_APP_PASSWORD` is supplied privately.

The SSR response includes title, description, canonical URL, Open Graph, Twitter card, Person JSON-LD, `robots.txt`, and `sitemap.xml`. YouTube content remains linked through public channel URLs and thumbnail fallbacks.

Render should use `/healthz` as the health-check path. It returns HTTP 200 with `{ "ok": true }` when the Node Web Service process is running; it does not expose credentials or require owner login.
