# Papaki rollback and monitoring

Keep the old WordPress document root, database, and local backup until the new site has passed live checks and the owner accepts the release. Record the old Plesk application root, document root, and Node.js settings before changing them.

## If the new site fails after cutover

1. In Plesk, restore the recorded old document root and application mapping for `acadimies.gr`. Stop the new Node.js application only if needed for that mapping.
2. Confirm that the old homepage and WordPress admin work. Leave both databases and all uploaded files intact.
3. Save the new application's error log and the failing URL/status for diagnosis. Do not repeat a build if Plesk reports `fork: Resource temporarily unavailable`, `No child processes`, or a build timeout; ask Papaki to clear the account's stalled processes.
4. Retry the new release only after the cause is fixed and its private preview passes the checks below.

## Release smoke check

After the private preview starts, and again immediately after cutover, run this from the local `web` folder with a known published post slug:

```powershell
npm run production:smoke -- --base-url https://acadimies.gr --post-path /posts/new-xmas-27o-golden-cup-2027
```

For a private preview, replace the base URL with the exact preview origin and use a published post in its database. The script checks app liveness, database readiness, homepage, admin login page, that post, and one JavaScript/CSS asset. It follows no redirects, sends no credentials, writes no data, and exits nonzero if a check fails. A passing script does not prove that login, editing, SMTP, or every image works; check those manually before acceptance.

## Uptime monitoring after launch

Configure an external uptime service after the live URL passes its smoke check. Probe `https://acadimies.gr/api/health/live` and `https://acadimies.gr/api/health` every five minutes; alert the owner only after two consecutive failures. The first detects an unavailable app, while the second detects an unavailable app or database. Keep monitoring credentials and alert recipients in the monitoring service, not this repository. Also inspect the homepage and a published article after each deployment. Monitoring cannot be enabled reliably until the new site is live.
