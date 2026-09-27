import "dotenv/config";

import { readScheduledPublisherSecret } from "../src/features/admin-articles/scheduler-auth";

const configured = readScheduledPublisherSecret() !== null;
process.stdout.write(`${JSON.stringify({ configured, endpoint: "/api/internal/publish-scheduled",
  authentication: "bearer", minimumSecretLength: 32, secretPrinted: false,
  publicationAttempted: false }, null, 2)}\n`);
if (!configured) {
  process.stderr.write("Scheduled publisher secret is missing or shorter than 32 characters. Configure SCHEDULED_PUBLISH_SECRET, then verify again. No secret was printed.\n");
  process.exitCode = 1;
}
