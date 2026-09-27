import { describe, expect, it } from "vitest";
import { headerTemplateKeys } from "@/db/schema";
import { headerTemplateRegistry } from "./HeaderDispatcher";

describe("header template registry", () => {
  it("maps every persisted key to exactly one approved component", () => {
    expect(Object.keys(headerTemplateRegistry)).toEqual(headerTemplateKeys);
    expect(new Set(Object.values(headerTemplateRegistry)).size).toBe(headerTemplateKeys.length);
  });
});
