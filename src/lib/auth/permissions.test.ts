import { describe, expect, it } from "vitest";
import { can, isStaffRole, staffCapabilities } from "./permissions";
import { staffRoles } from "@/db/schema";

describe("admin authorization", () => {
  it("keeps every persisted role inside the permission matrix", () => {
    expect(staffRoles.every(isStaffRole)).toBe(true);
    expect(staffCapabilities).toHaveLength(11);
  });

  it("reserves staff administration for owners", () => {
    expect(can("owner", "staff:manage")).toBe(true);
    expect(can("editor", "staff:manage")).toBe(false);
    expect(can("author", "article:publish")).toBe(false);
    expect(can("owner", "newsletter:manage")).toBe(true);
    expect(can("editor", "newsletter:manage")).toBe(true);
    expect(can("author", "newsletter:manage")).toBe(false);
    expect(can("owner", "article:delete")).toBe(true);
    expect(can("editor", "article:delete")).toBe(true);
    expect(can("author", "article:delete")).toBe(false);
    expect(can("owner", "article:edit-any")).toBe(true);
    expect(can("editor", "article:edit-any")).toBe(true);
    expect(can("author", "article:edit-any")).toBe(false);
  });

  it("gives migration reviewers no editorial mutation authority", () => {
    expect(can("migration_reviewer", "migration:review")).toBe(true);
    expect(can("migration_reviewer", "article:create")).toBe(false);
  });
});
