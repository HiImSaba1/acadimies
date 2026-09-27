import { staffRoles, type StaffRole } from "@/db/schema";

export const staffCapabilities = [
  "admin:access",
  "article:create",
  "article:edit-own",
  "article:edit-any",
  "article:delete",
  "article:publish",
  "taxonomy:manage",
  "media:manage",
  "migration:review",
  "staff:manage",
  "newsletter:manage",
] as const;

export type StaffCapability = (typeof staffCapabilities)[number];

const capabilitiesByRole = {
  owner: staffCapabilities,
  editor: [
    "admin:access",
    "article:create",
    "article:edit-own",
    "article:edit-any",
    "article:delete",
    "article:publish",
    "taxonomy:manage",
    "media:manage",
    "migration:review",
    "newsletter:manage",
  ],
  author: ["admin:access", "article:create", "article:edit-own", "media:manage"],
  migration_reviewer: ["admin:access", "migration:review"],
} as const satisfies Record<StaffRole, readonly StaffCapability[]>;

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.includes(value as StaffRole);
}

export function can(role: StaffRole, capability: StaffCapability): boolean {
  return (capabilitiesByRole[role] as readonly StaffCapability[]).includes(capability);
}
