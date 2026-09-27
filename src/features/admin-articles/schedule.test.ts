import { describe, expect, it } from "vitest";
import { formatAthensDateTimeLocal, isFutureSchedule, parseAthensDateTimeLocal } from "./schedule";

describe("Athens article scheduling", () => {
  it("round-trips summer and winter local publication times", () => {
    expect(parseAthensDateTimeLocal("2027-01-05T12:30")).toBe("2027-01-05T10:30:00.000Z");
    expect(parseAthensDateTimeLocal("2027-07-05T12:30")).toBe("2027-07-05T09:30:00.000Z");
    expect(formatAthensDateTimeLocal("2027-07-05T09:30:00.000Z")).toBe("2027-07-05T12:30");
  });

  it("rejects invalid wall-clock values and requires a future instant", () => {
    expect(parseAthensDateTimeLocal("2027-02-30T12:30")).toBeNull();
    expect(isFutureSchedule("2027-01-05T10:30:00.000Z", new Date("2027-01-05T10:00:00.000Z"))).toBe(true);
    expect(isFutureSchedule("2027-01-05T10:30:00.000Z", new Date("2027-01-05T11:00:00.000Z"))).toBe(false);
  });
});
