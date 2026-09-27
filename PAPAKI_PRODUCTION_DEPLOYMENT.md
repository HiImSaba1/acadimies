# Acadimies.gr Papaki/Plesk production deployment

Status: preparation only. Nothing in this runbook authorizes a production change. Keep the existing site, its document root, and its database untouched until the explicit cutover gate.

## Readiness audit

Already present:

- Next.js 16.3.5 App Router, MySQL through `mysql2`/Drizzle, admin authentication, robots and both normal/news sitemaps.
- Read-only release inspection, bounded newsletter confirmation dry-run, and an explicit apply-only confirmation worker.
- Sprint 01/02 verification artifacts and owner-reported clean Sprint 19/20 results.
- A public `/api/health` endpoint that checks database reachability without exposing credentials.

Still required before production:

- Run the current Sprint 21 verification. It is implemented but has no recorded owner pass. Do not run confirmation delivery.
- Establish a new, empty production database with a dedicated non-root user. This repository has no committed Drizzle migration history, so `drizzle-kit push` is not an approved production bootstrap mechanism. Export/import the reviewed `next_acadimies` database separately, then run the read-only schema and release checks.
- Configure production-only secrets in `.env.production.local`, verify SMTP without sending, build on Papaki/Linux, and complete all live smoke tests.

Safest phases: local verification and archive -> backup and parallel infrastructure -> upload/configure -> read-only preflight -> Linux build -> private preview -> explicit cutover -> observation -> optional later cleanup.

## Phase 1 - owner-run local verification

From PowerShell in the repository:

```powershell
Set-Location 'C:\Users\sab_j\Desktop\Projects\Acadimies\web'
powershell -ExecutionPolicy Bypass -File .\scripts\acadimies.ps1 -Action Sprint21Verify
```

Acceptance gate: `artifacts\verification\sprint-21-failures.txt` says `PASS - no failed steps.` and the corresponding results file is fresh. The command runs the confirmation worker in inspection mode only. Never run `npm run newsletter:confirmations:deliver` during deployment.

Audit dependencies locally, but do not mutate them automatically:

```powershell
npm audit
```

Record findings separately. Do not run `npm audit fix` on production or fold dependency remediation into the deployment.

Create the verified source archive:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-papaki-release.ps1
```

Acceptance gate: the script prints the SHA-256 of `artifacts\release\acadimies-papaki-release.zip`. The staged archive must contain `.node-version`, `.env.production.example`, `start.js`, the package lock, Next/Drizzle configuration, `src/db/schema/index.ts`, production preflight/schema scripts, the environment loader, permission script, and `RELEASE-MANIFEST.sha256`. It must contain no `.env.production.local`, SQL/XML export, `node_modules`, `.next`, tests, caches, or verification output.

## Phase 2 - preserve rollback and prepare parallel services

In Plesk, before uploading anything:

1. Take a JetBackup/Plesk backup of the existing site files and existing live database. Verify that the backup is listed with the current timestamp.
2. Record the existing document root, PHP/WordPress settings, database name, and DNS/proxy state. Do not rename, delete, or overwrite them.
3. Create a new empty MySQL database and a dedicated database user limited to that database. Do not use `root` or the Plesk administrator account.
4. Export the reviewed source `next_acadimies` database to a SQL file outside the release archive. Review the export target and import it only into the new empty database. Never import over the existing live database.
5. Create a parallel application directory. In a normal Plesk subscription this is commonly `/var/www/vhosts/acadimies.gr/acadimies-app`; the logical layout is application root `acadimies-app` and document root `acadimies-app/public`. Confirm the exact absolute subscription path in Plesk instead of assuming it.

Acceptance gate: the old site and old database still serve normally; the new database is separate and contains the reviewed data; the new app directory is empty except for the uploaded release.

## Phase 3 - upload and environment

Upload the ZIP into the new application root and extract it flat. The root must directly contain `package.json`, `start.js`, `public`, `src`, and `scripts`; there must not be an extra nested `acadimies-app` directory.

In Plesk Node.js settings:

- Node.js version: 22.x (the repository also declares `22` in `.node-version`).
- Application mode: Production.
- Application root: `acadimies-app`.
- Document root: `acadimies-app/public`.
- Startup file: `start.js`.

Do not switch the existing domain document root yet if Plesk cannot preview the new app independently. Prefer a temporary protected subdomain/application URL for the preview.

Using SSH from the confirmed application root:

```bash
cd /var/www/vhosts/acadimies.gr/acadimies-app
cp .env.production.example .env.production.local
chmod 600 .env.production.local
```

Edit `.env.production.local` in Plesk's protected editor. Do not paste it into chat, shell history, logs, or verification output. Required production values are documented in `.env.production.example`. Keep both delivery switches safe:

```dotenv
ACADIMIES_CAMPAIGN_DELIVERY_ENABLED=false
ACADIMIES_NEWSLETTER_CONFIRMATION_APPLY=0
```

Apply bounded ordinary-file permissions, substituting the exact confirmed app root if necessary:

```bash
bash scripts/repair-release-permissions.sh /var/www/vhosts/acadimies.gr/acadimies-app
chmod 600 .env.production.local
```

Acceptance gate: ordinary directories are 755, ordinary files are 644, the permission script remains executable, and `.env.production.local` is 600. The permission script intentionally excludes all `.env*` files.

## Phase 4 - Node resolution, install, read-only checks, and build

Open the Plesk Node.js extension's terminal/environment. Verify the selected runtime before installing:

```bash
cd /var/www/vhosts/acadimies.gr/acadimies-app
node --version
npm --version
command -v node
```

Acceptance gate: Node reports v22.x and resolves to the Plesk/nodenv runtime. If `nodenv: node: command not found` appears, reselect Node 22 in Plesk, disable/re-enable Node.js for the domain, reopen the Plesk terminal, and retry. Do not install a second system Node.

Install exactly from the lockfile. The build requires dev dependencies such as TypeScript and `tsx`, so do not use `--omit=dev` before building:

```bash
npm ci --no-audit --no-fund
```

Run only read-only production checks:

```bash
npm run production:schema:check
npm run release:inspect
npm run production:preflight
```

`production:preflight` connects to MySQL, validates the dedicated database user and safety switches, verifies the SMTP handshake with Nodemailer `verify()`, and sends no message. The application has no runtime private-file write requirement: editorial media is shipped under `public/images`; the preflight confirms it is readable and does not create a writable public upload area.

Build with Webpack and one configured CPU:

```bash
npm run build:papaki
```

Acceptance gate: all three checks exit zero, SMTP says `messageSent: false`, the build completes, and `.next/BUILD_ID` exists. Never upload Windows `node_modules` or `.next`; both must be generated here on Linux.

If `spawn EAGAIN`, `pthread_create`, or fork-limit errors occur, stop other subscription processes, confirm `experimental.cpus: 1`, retry once from the Plesk runtime, and ask Papaki to raise the subscription process limit if it persists. Do not loop builds.

## Phase 5 - private preview

Start/restart the application from Plesk. `start.js` explicitly loads `.env.production.local` and then invokes the integrated `next start` server, matching this repository's normal output mode. It is not a standalone server.

Through the protected preview URL or Plesk application URL, check:

```text
/api/health
/api/health/live
/
/admin/login
/_next/static/...
/robots.txt
/sitemap.xml
/news-sitemap.xml
```

Acceptance gate:

- `/api/health` returns HTTP 200 with `{"ok":true,"database":"reachable"}`.
- `/api/health/live` returns HTTP 200 with `{"ok":true}` when the app can respond.
- Homepage and representative category, topic, author, and article pages render database content.
- Admin login works over HTTPS and an authenticated admin page loads.
- CSS, JavaScript, images, and fonts return 200 without mixed content.
- Contact SMTP was verified by preflight; no test message or campaign was sent.
- `robots.txt` blocks admin paths and exposes both sitemaps; sitemap URLs use `https://acadimies.gr` and contain expected published content.
- The old live site and old database remain unchanged.

## Phase 6 - explicit cutover only

Stop here and obtain explicit action-time confirmation. Cutover changes the production route and is not authorized by repository preparation.

After confirmation, point the domain's Plesk Node.js application/document-root mapping to the new app, restart it once, and immediately repeat every Phase 5 check on `https://acadimies.gr`. Keep the old files and database intact as rollback. Observe Plesk logs for at least one normal browsing session and one admin login.

Run the local `npm run production:smoke -- --base-url https://acadimies.gr --post-path /posts/new-xmas-27o-golden-cup-2027` command after cutover. See [the rollback and monitoring guide](docs/papaki-rollback.md) for response steps and external uptime checks.

Rollback if any acceptance check fails:

1. Restore the recorded old document root/application mapping.
2. Disable or stop the new Node application without deleting it.
3. Confirm the old homepage and admin are healthy.
4. Leave both databases intact and capture the new app's error log for diagnosis.

## Troubleshooting

- Missing release file: rerun `prepare-papaki-release.ps1`; do not hand-add a forgotten runtime file to the ZIP. Compare extracted files to `RELEASE-MANIFEST.sha256` with `sha256sum -c RELEASE-MANIFEST.sha256`.
- Environment permission/read error: confirm ownership belongs to the subscription user and run `chmod 600 .env.production.local`. Never broaden it to 644.
- `database-not-configured`, `root@localhost`, or password `NO`: the Node process did not load the production env file or the URL is malformed. Stop and correct `.env.production.local`; do not run migrations or OAuth/admin tests first.
- `Could not find a production build`: the Linux `npm run build:papaki` did not finish or Plesk points at the wrong application root.
- Standalone/custom mismatch: this app has no `output: "standalone"`; do not point Plesk at `.next/standalone/server.js`. Use repository-root `start.js`, which invokes `next start`.
- Static assets 404: confirm document root `acadimies-app/public`, application root `acadimies-app`, and that the Node application proxy handles `/_next/*`.
- Schema check fails: do not use `db:push` against production. Recreate the new empty database from the reviewed export or produce/review a formal migration in a separate sprint.

## Deferred cleanup

Deletion of the old WordPress files, old database, release ZIP, old backups, or previous app directories is deliberately excluded. Perform cleanup only after a separately approved retention period and explicit action-time confirmation, with a fresh backup immediately beforehand.
