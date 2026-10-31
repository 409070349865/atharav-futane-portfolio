# Atharav Arun Futane — Portfolio

The existing React + TypeScript + Vite portfolio is extended with a same-origin Express API, OpenAI-backed portfolio assistant, public GitHub data, browser-only engineering demos, a searchable blog framework, recruiter mode, terminal, and private SQLite-backed admin analytics.

## Requirements and local setup

- Node.js 20.19+ or 22.12+ (LTS recommended) and npm
- Copy `.env.example` to `.env`. Set a private admin password and a random session secret:

```env
ADMIN_PASSWORD=use-a-long-unique-password
ADMIN_SESSION_SECRET=generate-at-least-32-random-characters
OPENAI_API_KEY=
```

Generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Never add `.env` or API keys to source control or any `VITE_*` variable.

```bash
npm install
npm run dev
```

Vite runs on `http://localhost:5173` and proxies `/api` requests to the Express API on port `3001`. The context-generation script imports the approved content from `src/data.ts` before local development, tests, and builds.

The assistant returns a clear configuration error until `OPENAI_API_KEY` is set. Its key is read only by the backend. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.

If the assistant reports that OpenAI rejected its key, replace `OPENAI_API_KEY` with a valid key in the backend `.env` file (local) or the service's secret environment variables (Render), then restart or redeploy the backend. Never paste the key into chat, frontend code, or a `VITE_*` variable. The assistant intentionally hides provider error details so credentials cannot be exposed in browser responses or server logs.

### If `/api` reports `ECONNREFUSED`

The Vite process is running but the Express API on port `3001` is not. Stop any old dev terminal with `Ctrl+C`, open a terminal in this project folder, and run:

```bash
npm install
npm run dev
```

The startup output should show both `concurrently`, `node --watch server/index.js`, and Vite. Confirm the API responds at `http://localhost:3001/api/health`. If you intentionally start Vite alone with `npm run vite` or the Vite CLI, start the API in a second terminal with `npm start`. When port `5173` is already occupied Vite can choose another port; the local API accepts localhost development origins on that port.

## Features and where to edit them

- **Portfolio content:** edit `profile`, `projects`, `skillGroups`, `certifications`, `education`, and `learningAreas` in `src/data.ts`.
- **Project showcase:** search and filter the existing projects; each case study contains a conceptual architecture flow and explicitly notes absent screenshots, code samples, or live deployment URLs. Add verified `screenshots`, `codeExamples`, and `demo` properties to a project in `src/data.ts` when available.
- **GitHub:** fetches public repositories and recent public events from the GitHub REST API for the configured `profile.github` username. GitHub may rate-limit unauthenticated requests. The contribution visualization is explicitly limited to the public events returned by that API; it is not a full contribution graph and excludes private activity.
- **Engineering Lab:** client-side KNN on fixed synthetic samples, local-only Sobel image edges, a generated synthetic stream, and code examples. No images are uploaded and demonstrations are not project performance claims.
- **Recruiter mode and terminal:** resume preview/download, skills and education overview, availability, contact shortcuts, and supported command shortcuts.
- **Technical blog:** add entries to the typed `articles` array in `src/data.ts`. Search, categories, tags, reading-time estimates, hash-based article pages, and lightweight code highlighting are included. The initial list is empty; no sample or fabricated posts are published.
- **Learning dashboard:** edit current learning focus in `learningAreas`; displayed project statuses and certificate links come from the portfolio data. It does not invent progress percentages.
- **AI assistant:** the build generates `server/generated/portfolio-context.json` from approved portfolio data. The API responds only with that content and explicitly reports when experience details are absent.
- **Private analytics and contact submissions:** `server/index.js` stores anonymous page/project/resume events and submitted messages in SQLite. Analytics totals are shown for the last 30 days; events older than 180 days are pruned at startup. Contact messages are retained until an admin deletes them.
- **Themes and command palette:** dark/light mode is saved in browser storage. Press `Ctrl+K`/`Cmd+K` to open the accessible command palette.

Styles for the original design remain in `src/styles.css`; additive responsive styles are in `src/features.css`.

## Admin and privacy

Open the **Private admin** section in the footer and sign in with `ADMIN_PASSWORD`. The server issues a signed, HTTP-only, same-site cookie; the session-signing secret must be at least 32 characters. Admin credentials and data never appear in the client bundle. The dashboard API is authenticated and same-origin; login, contact, assistant, and event endpoints are rate-limited.

Page/project/resume analytics do not store visitor IP addresses. Contact submissions contain the visitor's name, email, subject, and message. Use HTTPS in production; protect and back up the persistent database volume, and configure an appropriate data-retention policy for submitted messages.

## Test and build

```bash
npm test
npm run build
npm start
```

`npm start` serves both the generated Vite `dist/` site and API. Do not deploy the site as a static-only Vite build if you need the assistant, contact submission, resume tracking, or admin APIs.

## Deploy to Render

The included [render.yaml](./render.yaml) configures one Node web service, a persistent SQLite disk, and prompts for the required secrets through `sync: false` environment variables. The source must first be pushed to a GitHub repository connected to your Render account.

1. In Render, choose **New → Blueprint** and select the connected GitHub repository containing this project and `render.yaml`.
2. Review the Blueprint. When prompted, enter:
   - `OPENAI_API_KEY`: create or use a valid API key from your OpenAI account and enter it directly in Render's secret field. Never put it in source code, a `VITE_*` variable, or a chat message.
   - `ADMIN_PASSWORD`: choose a strong, unique password for the private admin page.
   - `PUBLIC_ORIGIN`: enter the final Render HTTPS origin, for example `https://your-service.onrender.com`, without a trailing slash. If using a custom domain, use that domain instead.
3. Keep the generated `ADMIN_SESSION_SECRET` private and unchanged. Keep `OPENAI_MODEL` as `gpt-4o-mini` unless you have configured a different supported model.
4. Apply the Blueprint and wait for the service health check at `/api/health` to pass. The SQLite database is stored at `/var/data/portfolio.sqlite` on the persistent disk.
5. If the deployment already exists, open **Dashboard → your service → Environment**, replace `OPENAI_API_KEY` with a valid key, save, and choose **Save, rebuild, and deploy**. Do not share the key with anyone or commit it to the repository.

If configuring a Render Web Service manually, use build command `npm ci && npm run build`, start command `npm start`, and attach a persistent disk mounted at `/var/data`. Set `DATABASE_PATH=/var/data/portfolio.sqlite`.

## Content accuracy

- Existing project descriptions and credential details are preserved. Conceptual architecture diagrams are labelled as such.
- No live demos, LinkedIn URL, screenshots, code samples, complete contribution graph, blog articles, or project-progress percentages are fabricated.
- The resume file is `public/Atharav_Futane_CV.pdf`; replace it with an updated PDF when needed.
- Replace the placeholder domain in `public/robots.txt` and `public/sitemap.xml` before launch.
