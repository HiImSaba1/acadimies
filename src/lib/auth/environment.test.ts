import { describe, expect, it } from "vitest";
import { authSecret, matchesEnvironmentOwner, readAdminEnvironment } from "./environment";

const valid = {
  ADMIN_USERNAME: "newsroom-owner",
  ADMIN_PASSWORD: "a-secure-password-with-12-chars",
  ADMIN_SESSION_SECRET: "a-session-secret-that-is-at-least-32-characters",
};

describe("admin environment boundary", () => {
  it("accepts owner credentials without exposing them in a public config", () => {
    expect(readAdminEnvironment(valid).ADMIN_USERNAME).toBe("newsroom-owner");
    expect(authSecret(valid)).toBe(valid.ADMIN_SESSION_SECRET);
  });

  it("prefers the NextAuth-native secret when both aliases exist", () => {
    expect(authSecret({ ...valid, NEXTAUTH_SECRET: "nextauth-secret-that-is-at-least-32-characters" }))
      .toBe("nextauth-secret-that-is-at-least-32-characters");
  });

  it("rejects weak passwords and missing session secrets", () => {
    expect(() => readAdminEnvironment({ ADMIN_USERNAME: "owner", ADMIN_PASSWORD: "short" })).toThrow();
  });

  it("matches both configured owner fields and rejects either mismatch", () => {
    const environment = readAdminEnvironment(valid);
    expect(matchesEnvironmentOwner("NEWSROOM-OWNER", valid.ADMIN_PASSWORD, environment)).toBe(true);
    expect(matchesEnvironmentOwner("another-owner", valid.ADMIN_PASSWORD, environment)).toBe(false);
    expect(matchesEnvironmentOwner(valid.ADMIN_USERNAME, "incorrect-password", environment)).toBe(false);
  });
});
