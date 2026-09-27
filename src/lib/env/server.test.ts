import { describe, expect, it } from "vitest";
import { readServerEnvironment } from "./server";

describe("readServerEnvironment", () => {
  it("accepts the intended local MySQL database", () => {
    expect(
      readServerEnvironment({
        DATABASE_URL: "mysql://editor:secret@127.0.0.1:3306/next_acadimies",
      }),
    ).toEqual({
      DATABASE_URL: "mysql://editor:secret@127.0.0.1:3306/next_acadimies",
    });
  });

  it.each([
    "postgres://localhost/next_acadimies",
    "mysql://localhost/another_database",
    "not-a-url",
  ])("rejects an unsafe database target: %s", (databaseUrl) => {
    expect(() => readServerEnvironment({ DATABASE_URL: databaseUrl })).toThrow();
  });

  it("builds a safe MySQL URL from phpMyAdmin-style environment fields", () => {
    expect(readServerEnvironment({
      DB_HOST: "127.0.0.1",
      DB_PORT: "3306",
      DB_NAME: "next_acadimies",
      DB_USER: "editor",
      DB_PASSWORD: "p@ss word",
    }).DATABASE_URL).toBe("mysql://editor:p%40ss%20word@127.0.0.1:3306/next_acadimies");
  });

  it("normalizes harmless whitespace while preserving the exact database boundary", () => {
    expect(readServerEnvironment({
      DB_HOST: " 127.0.0.1 ",
      DB_PORT: "3306",
      DB_NAME: " next_acadimies ",
      DB_USER: " editor ",
      DB_PASSWORD: "secret",
    }).DATABASE_URL).toBe("mysql://editor:secret@127.0.0.1:3306/next_acadimies");
  });

  it("removes invisible Unicode markers copied into the database name", () => {
    expect(readServerEnvironment({
      DB_HOST: "127.0.0.1",
      DB_NAME: "next_acadimies\uFEFF",
      DB_USER: "editor",
      DB_PASSWORD: "secret",
    }).DATABASE_URL).toContain("/next_acadimies");
  });
});
