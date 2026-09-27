import { expect, test } from "@playwright/test";

test("offers equally accessible cookie acceptance and rejection, and lets readers change the choice", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/cookies");
  const notice = page.locator(".cookie-notice");
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("button", { name: "Αποδοχή προαιρετικών cookies" })).toBeVisible();
  await notice.getByRole("button", { name: "Απόρριψη προαιρετικών cookies" }).click();
  await expect(notice).toBeHidden();
  expect((await context.cookies()).find((cookie) => cookie.name === "acadimies_optional_cookies_v1")?.value).toBe("rejected");
  await page.getByRole("button", { name: /Άνοιξε ξανά τις επιλογές cookies/ }).click();
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Αποδοχή προαιρετικών cookies" }).click();
  await expect(notice).toBeHidden();
  expect((await context.cookies()).find((cookie) => cookie.name === "acadimies_optional_cookies_v1")?.value).toBe("accepted");
});

test("publishes distinct cookie and privacy explanations with the owner-provided contact", async ({ page }) => {
  await page.goto("/cookies");
  await expect(page.getByRole("heading", { level: 1, name: "Πολιτική cookies" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "πολιτική απορρήτου" })).toHaveAttribute("href", "/privacy-policy");
  await page.goto("/privacy-policy");
  await expect(page.getByRole("heading", { level: 1, name: "Πολιτική απορρήτου" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("main").getByRole("link", { name: "info@acadimies.gr" }).first()).toHaveAttribute("href", "mailto:info@acadimies.gr");
  await expect(page.locator("main")).toContainText("ως πρόχειρα");
});

test("links Dora's biography from Socials and her profile only from the biography", async ({ page }) => {
  await page.goto("/");
  const socials = page.locator("[data-site-footer] .publication-footer__socials");
  await expect(socials.getByRole("link", { name: "Δώρα Ιωακειμίδου" })).toHaveAttribute("href", "/dora-ioakeimidou");
  await expect(socials.locator('a[href="https://www.facebook.com/doraioakeimidoy"]')).toHaveCount(0);
  await page.goto("/dora-ioakeimidou");
  await expect(page.getByRole("heading", { level: 1, name: "Δώρα Ιωακειμίδου" })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: "προφίλ της στο Facebook" })).toHaveAttribute("href", "https://www.facebook.com/doraioakeimidoy");
  await expect(page.getByRole("heading", { level: 2, name: "Οι ιστορίες της" })).toBeVisible();
  const personData = page.locator('main script[type="application/ld+json"]');
  const person = JSON.parse(await personData.textContent() ?? "{}") as { "@type"?: string; url?: string };
  expect(person["@type"]).toBe("Person");
  expect(person.url).toBe("https://acadimies.gr/dora-ioakeimidou");
  const story = page.locator(".author-archive__grid .shaped-story-card").first();
  if (await story.count()) {
    const href = await story.locator("a").getAttribute("href");
    expect(href).toMatch(/^\/posts\//);
    await page.goto(href!);
    await expect(page.locator(".article-template > header > small").getByRole("link", { name: "Δώρα Ιωακειμίδου" })).toHaveAttribute("href", "/dora-ioakeimidou");
  }
});

test("shows published article topics as non-clickable tags", async ({ page }) => {
  await page.goto("/posts/allagi-nootropias-to-pragmatiko-stoixima-tis-anagennisis");
  const topics = page.locator(".article-topics");
  if (!await topics.count()) return;
  await expect(topics.locator("span").first()).toBeVisible();
  await expect(topics.locator("a")).toHaveCount(0);
});
