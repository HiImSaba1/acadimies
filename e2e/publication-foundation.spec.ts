import { expect, test } from "@playwright/test";

test("renders the Greek-first editorial hierarchy", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Ακαδημίες/);
  await expect(page.locator("html")).toHaveAttribute("lang", "el");
  await expect(page.getByTestId("publication-header")).toBeVisible();
  await expect(page.locator(".latest-hero h1")).toBeVisible();
  await expect(page.locator(".latest-hero h1")).not.toHaveText("");
  await expect(page.getByRole("heading", { name: "Γονείς & παιδί" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ιστορίες που αξίζει να δεις" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Προπονητική & ανάπτυξη" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Πρόσωπα & συνεντεύξεις" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Μείνε κοντά στο παιχνίδι" })).toBeVisible();
});

test("shows four shaped trending stories and a category-by-category homepage edition", async ({ page }) => {
  await page.goto("/");
  const trending = page.getByRole("region", { name: "Τέσσερις ιστορίες στην πρώτη γραμμή" });
  await expect(trending.locator(".shaped-story-card")).toHaveCount(4);
  await expect(trending.locator(".shaped-story-card__date")).toHaveCount(4);
  const firstDateBadge = trending.locator(".shaped-story-card__date").first();
  await expect(firstDateBadge.locator(".publication-date-badge__stack > span")).toHaveText([/^[A-Z][a-z]{2}$/, /^\d{2}'$/]);
  await expect(trending.locator(".shaped-story-card__date").first()).toHaveAttribute("aria-label", /(?:Ενδεικτική ημερομηνία σχεδιασμού|Δημοσιεύτηκε)/);
  const mosaic = page.getByRole("region", { name: "Η έκδοση ανά θέμα" });
  await expect(mosaic.locator(".category-mosaic__group")).toHaveCount(6);
  await expect(mosaic.locator(".category-mosaic__masthead")).toHaveCount(0);
  await expect(mosaic.locator(".animated-editorial-rule")).toHaveCount(6);
  await expect(mosaic.locator(".animated-editorial-rule").first()).toHaveCSS("height", "1px");
  for (const slug of ["nea-akadimion", "proponitiki", "paidi-psychologia", "goneis", "synentefxeis", "diethnis-matia"]) {
    await expect(mosaic.locator(`[data-category-slug="${slug}"]`).getByRole("link", { name: /.+/ }).first()).toHaveAttribute("href", `/category/${slug}`);
  }
  await expect(mosaic.locator('[data-category-slug="proponitiki"] .shaped-story-card')).toHaveCount(4);
  await expect(mosaic.locator('[data-category-slug="paidi-psychologia"] .shaped-story-card')).toHaveCount(2);
  const advertisement = mosaic.locator("[data-advertisement]");
  await expect(advertisement).toHaveAccessibleName("Διαφήμιση Golden Cup");
  await expect(advertisement).toHaveCSS("border-radius", "10px");
  await expect(advertisement.locator("[data-parallax-media]")).toHaveCount(1);
  await expect(advertisement.locator("source")).toHaveAttribute("media", "(max-width: 760px)");
  await expect(advertisement.locator("source")).toHaveAttribute("srcset", "/images/2026/09/ad_golden_cup_xmas_poster_mobile.webp");
  await expect(advertisement.locator("img")).toHaveAttribute("src", /ad_golden_cup_xmas_poster_desktop/);
  await expect(mosaic.locator(".shaped-story-card__date").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("uses the rounded article-card treatment while preserving compact and carousel variants", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main .story-card .lucide-arrow-up-right, main .shaped-story-card .lucide-arrow-up-right")).toHaveCount(0);
  const regular = page.locator("#most-read .story-card").first();
  await expect(regular).toHaveAttribute("data-card-design", "cover");
  await expect(regular.locator(".story-card__date")).toHaveCount(1);
  await expect(regular.locator(".story-card__media")).toHaveCSS("border-radius", "10px");
  await expect(page.locator("#most-read .story-card[data-card-design='cover']")).toHaveCount(3);
  await expect(page.locator("#most-read .story-card__body")).toHaveCount(0);
  const mostReadColumns = await page.locator("#most-read .story-grid--latest").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
  expect(mostReadColumns).toBe((page.viewportSize()?.width ?? 1280) <= 760 ? 2 : 3);
  await expect(page.locator("#coaching .story-card")).toHaveCount(4);
  await expect(page.locator("#coaching .story-card--row")).toHaveCount(4);
  await expect(page.locator("#coaching .story-card").nth(1)).toHaveAttribute("data-card-design", "legacy");
  await expect(page.locator("#coaching .story-card__media").first()).toHaveCSS("border-radius", "10px");
  const coachingGap = await page.locator("#coaching .category-grid").evaluate((grid) => Number.parseFloat(getComputedStyle(grid).gap));
  expect(coachingGap).toBeLessThanOrEqual(28);
  if ((page.viewportSize()?.width ?? 0) > 760) {
    const coachingCard = page.locator("#coaching .story-card--row").first();
    await coachingCard.hover();
    await expect(coachingCard).toHaveCSS("background-color", "rgb(17, 22, 18)");
    await expect(coachingCard.locator("h3")).toHaveCSS("color", "rgb(250, 249, 245)");
  }
  await expect(page.locator("#popular .story-card").first()).toHaveAttribute("data-card-design", "carousel");
  await expect(page.locator("#popular .story-card").first()).toHaveCSS("border-radius", "10px");
  await expect(page.locator("#popular .story-card__date")).toHaveCount(6);
  await expect(page.locator("#popular .story-card__body")).toHaveCount(0);
  await expect(page.locator("#popular .story-card__cover h3")).toHaveCount(6);
  const coverTitle = page.locator("#popular .story-card__cover h3").first();
  const coverImage = page.locator("#popular .story-card__media").first();
  expect(await coverTitle.evaluate((element) => element.getBoundingClientRect().bottom))
    .toBeLessThanOrEqual(await coverImage.evaluate((element) => element.getBoundingClientRect().bottom));
  const compactRow = page.locator("#people .story-card--row").first();
  await expect(compactRow).toHaveAttribute("data-card-design", "legacy");
  await expect(compactRow).toHaveCSS("border-radius", "10px");
  expect(await compactRow.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingTop))).toBeLessThanOrEqual(11);
  await expect(page.locator("#people .story-card--voice-feature")).toHaveCSS("border-radius", "10px");
  await expect(page.locator("#coaching .story-card").first()).toHaveCSS("border-radius", "10px");
  await expect(page.locator(".latest-hero")).toHaveCSS("border-bottom-right-radius", "10px");
  await expect(page.locator(".editorial-button").first()).toHaveCSS("border-radius", "10px");
  const trending = page.locator(".trending-strip .shaped-story-card").first();
  await expect(trending.locator(".shaped-story-card__overlay")).toHaveCount(1);
  if ((page.viewportSize()?.width ?? 0) > 760) {
    await trending.hover();
    await expect(trending.locator(".shaped-story-card__overlay")).toHaveCSS("opacity", "1");
    await expect(trending.locator(".shaped-story-card__copy h3")).toHaveCSS("opacity", "0");
  }
});

test("fits three draggable cards on desktop and two on mobile", async ({ page }) => {
  await page.goto("/");
  const carouselSection = page.locator("#popular");
  await expect(carouselSection).toHaveCSS("min-height", "0px");
  await expect(page.locator(".latest-hero").getByRole("button", { name: "Προηγούμενη ιστορία" })).toBeVisible();
  await expect(page.locator(".latest-hero").getByRole("button", { name: "Επόμενη ιστορία" })).toBeVisible();
  const rail = page.locator("#popular [data-draggable-rail]");
  const bottomSpacing = await carouselSection.evaluate((section) => {
    const railElement = section.querySelector<HTMLElement>("[data-draggable-rail]")!;
    return { actual: section.getBoundingClientRect().bottom - railElement.getBoundingClientRect().bottom,
      padding: Number.parseFloat(getComputedStyle(section).paddingBottom) };
  });
  expect(Math.abs(bottomSpacing.actual - bottomSpacing.padding)).toBeLessThanOrEqual(2);
  const cards = rail.locator(".popular-carousel__item");
  await expect(cards).toHaveCount(6);
  const metrics = await rail.evaluate((element) => {
    const first = element.querySelector<HTMLElement>(".popular-carousel__item")!;
    const style = getComputedStyle(element);
    const cardWidth = first.getBoundingClientRect().width;
    const gap = Number.parseFloat(style.columnGap);
    return { cardWidth, gap, railWidth: element.getBoundingClientRect().width,
      viewport: document.documentElement.clientWidth, edgeGutter: element.getBoundingClientRect().left };
  });
  const visibleCount = (page.viewportSize()?.width ?? 0) <= 760 ? 2 : 3;
  expect(Math.abs(visibleCount * metrics.cardWidth + (visibleCount - 1) * metrics.gap - metrics.railWidth)).toBeLessThanOrEqual(2);
  expect(metrics.edgeGutter).toBeGreaterThan(0);
  expect(Math.abs(2 * metrics.edgeGutter + metrics.railWidth - metrics.viewport)).toBeLessThanOrEqual(12);
  const previous = page.getByRole("button", { name: "Προηγούμενες ιστορίες" });
  const next = page.getByRole("button", { name: "Επόμενες ιστορίες" });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(10);
  await expect(previous).toBeEnabled();
});

test("keeps titles compact with readable leading", async ({ page }) => {
  await page.goto("/");
  const titleMetrics = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((titles) =>
    titles
      .filter((title) => {
        const style = getComputedStyle(title);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .map((title) => {
        const style = getComputedStyle(title);
        return {
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: Number.parseFloat(style.lineHeight),
        };
      }),
  );
  expect(titleMetrics.length).toBeGreaterThan(0);
  for (const metric of titleMetrics) {
    expect(metric.lineHeight).toBeGreaterThanOrEqual(metric.fontSize - 0.5);
    expect(metric.fontSize).toBeLessThanOrEqual(110);
  }
});

test("renders the editorial story grid and curtain footer", async ({ page }) => {
  await page.goto("/");
  const latestGrid = page.locator(".story-grid--latest");
  await expect(latestGrid.locator(".story-card")).toHaveCount(3);
  const firstCard = latestGrid.locator(".story-card").first();
  if ((page.viewportSize()?.width ?? 1280) > 760) {
    await firstCard.hover();
    await expect(firstCard).toHaveAttribute("data-card-design", "cover");
    await expect(firstCard.locator(".story-card__cover")).toBeVisible();
    const secondCard = latestGrid.locator(".story-card").nth(1);
    await secondCard.hover();
    await expect(secondCard).toHaveAttribute("data-card-design", "cover");
    await expect(secondCard.locator(".story-card__cover")).toHaveCSS("opacity", "1");
  }

  const footer = page.locator("[data-site-footer]");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toHaveAttribute("data-footer-animation", "words");
  await expect(footer).toHaveCSS("position", "sticky");
  await expect(footer).toHaveCSS("min-height", "0px");
  await expect(footer).toHaveCSS("background-color", "rgb(241, 239, 232)");
  await expect(footer).toHaveCSS("color", "rgb(17, 22, 18)");
  await expect(footer.getByRole("img", { name: "ΑΚΑΔΗΜΙΕΣ" })).toHaveCount(0);
  await expect(footer.locator(".publication-footer__base").getByText("Football Academies Journal", { exact: true })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Made by Saba Web Solutions" })).toHaveAttribute("href", "https://sabaweb.gr");
  await expect(footer.locator(".publication-footer__brand")).toHaveCount(0);
  await expect(footer.getByRole("navigation", { name: "Πλοήγηση υποσέλιδου" })).toBeVisible();
  await expect(footer.getByRole("heading", { name: "Quick links" })).toBeVisible();
  await expect(footer.locator(".publication-footer__links .editorial-button")).toHaveCount(5);
  await expect(footer.getByRole("heading", { name: "Socials" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://www.facebook.com/acadimies");
  await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/acadimies/");
  await expect(footer.getByRole("link", { name: "Facebook" }).locator(".editorial-button__arrow")).toHaveCSS("background-color", "rgb(200, 255, 61)");
  await expect(footer.getByRole("link", { name: "Δώρα Ιωακειμίδου" })).toHaveAttribute("href", "/dora-ioakeimidou");
  await expect(footer.getByRole("link", { name: "Cookies" })).toHaveAttribute("href", "/cookies");
  await expect(footer.getByRole("link", { name: "Απόρρητο" })).toHaveAttribute("href", "/privacy-policy");
  await expect(footer.getByRole("navigation", { name: "Νομικές πληροφορίες" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Συντακτική ομάδα" })).toHaveCount(0);
  await expect(footer.getByText("Ανεξάρτητη ψηφιακή έκδοση")).toHaveCount(0);
  await expect(footer.getByText("Η επόμενη προπόνηση αρχίζει με μια ιδέα")).toHaveCount(0);
  await expect(page.locator("[data-home-section]")).toHaveCount(5);
  await expect(page.locator("#coaching .story-card")).toHaveCount(4);
  await expect(page.locator("#people .story-card")).toHaveCount(4);
  await expect(page.locator("#popular .story-card")).toHaveCount(6);
  const stacking = await page.evaluate(() => ({
    main: Number.parseInt(getComputedStyle(document.querySelector("[data-public-route] > main")!).zIndex, 10),
    footer: Number.parseInt(getComputedStyle(document.querySelector("[data-site-footer]")!).zIndex, 10),
  }));
  expect(stacking.main).toBeGreaterThan(stacking.footer);
  const sectionBackgrounds = await page.locator("[data-public-route] > main > section").evaluateAll((sections) =>
    sections.map((section) => getComputedStyle(section).backgroundColor),
  );
  expect(sectionBackgrounds.every((color) => color !== "rgba(0, 0, 0, 0)")).toBe(true);
});

test("composes six understandable editorial homepage sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main [data-animated-headline]")).not.toHaveCount(0);
  await expect(page.locator("main [data-animated-lines]")).not.toHaveCount(0);
  await expect(page.locator("[data-latest-hero]")).toHaveCount(1);
  await expect(page.locator(".latest-hero__story-copy h1")).toBeVisible();
  await expect(page.locator(".latest-hero__story-action .story-meta")).toBeVisible();
  await expect(page.locator(".latest-hero__story-action .editorial-button")).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) > 760) {
    const heroColumns = await page.locator(".latest-hero__editorial-grid").evaluate((grid) => {
      const copyWidth = grid.querySelector<HTMLElement>(".latest-hero__story-copy")!.getBoundingClientRect().width;
      const actionWidth = grid.querySelector<HTMLElement>(".latest-hero__story-action")!.getBoundingClientRect().width;
      return copyWidth / actionWidth;
    });
    expect(heroColumns).toBeGreaterThan(2.9);
    expect(heroColumns).toBeLessThan(3.1);
  }
  await expect(page.locator("[data-home-section]")).toHaveCount(5);
  await expect(page.locator("#most-read .story-card")).toHaveCount(3);
  await expect(page.locator("#popular [data-draggable-rail] .story-card")).toHaveCount(6);
  await expect(page.locator("#coaching .story-card")).toHaveCount(4);
  await expect(page.locator("#people .story-card")).toHaveCount(4);
  await expect(page.locator("#newsletter form[aria-label='Εγγραφή στο newsletter']")).toBeVisible();
  await expect(page.locator("#newsletter")).toHaveAttribute("data-layout", "auto");
  await expect(page.locator("#newsletter")).toHaveCSS("border-radius", "10px");
  await expect(page.locator("#newsletter [data-parallax-media] img")).toHaveCount(1);

  const newsletterWidths = await page.locator("#newsletter").evaluate((section) => ({
    heading: section.querySelector<HTMLElement>(".section-heading")!.getBoundingClientRect().width,
    form: section.querySelector<HTMLElement>(".newsletter-cta__form")!.getBoundingClientRect().width,
  }));
  expect(Math.abs(newsletterWidths.heading - newsletterWidths.form)).toBeLessThan(2);

  const imageSources = await page.locator("[data-public-route] img").evaluateAll((images) =>
    images.map((image) => image.getAttribute("src") ?? ""),
  );
  expect(imageSources.length).toBeGreaterThan(0);
  expect(imageSources.every((source) => /(?:\/|%2F)(?:webp|images)(?:\/|%2F)/i.test(source))).toBe(true);
  await expect(page.locator(".editorial-art")).toHaveCount(await page.locator(".editorial-art [data-parallax-media]").count());

  const headingRatios = await page.locator("[data-home-section] .section-heading").evaluateAll((headings) => headings.map((heading) => ({
    title: getComputedStyle(heading.querySelector(".section-heading__title")!).flexBasis,
    summary: getComputedStyle(heading.querySelector(".section-heading__summary")!).flexBasis,
  })));
  expect(headingRatios.every(({ title, summary }) => title === "70%" && summary === "30%")).toBe(true);
  const titleLines = await page.locator("[data-home-section] .section-heading h2").evaluateAll((titles) => titles.map((title) => {
    const style = getComputedStyle(title);
    return {
      height: title.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(style.lineHeight),
      whiteSpace: style.whiteSpace,
    };
  }));
  expect(titleLines.every(({ height, lineHeight, whiteSpace }) => whiteSpace === "nowrap" && height <= lineHeight * 1.5)).toBe(true);
  const reversedHeadings = page.locator(".section-heading[data-reverse]");
  await expect(reversedHeadings).toHaveCount(2);
  await expect(page.locator("[data-home-section] .section-heading > div > span")).toHaveCount(0);
  for (const heading of await reversedHeadings.all()) {
    await expect(heading.locator(".section-heading__title")).toHaveCSS("text-align", "right");
  }

  const rail = page.locator("[data-draggable-rail]");
  const railDimensions = await rail.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
  expect(railDimensions.scroll).toBeGreaterThan(railDimensions.client);
});

test("uses the reusable single-line animated CTA system", async ({ page }) => {
  await page.goto("/");
  const buttons = page.locator(".editorial-button");
  await expect(buttons).toHaveCount(13);
  for (const button of await buttons.all()) {
    await expect(button.locator(".editorial-button__label")).toHaveCSS("white-space", "nowrap");
    await expect(button.locator(".editorial-button__arrow svg")).toHaveCount(1);
    await expect(button.locator("[data-hover-text-base]")).toHaveCount(1);
    await expect(button.locator("[data-hover-text-active]")).toHaveCount(1);
    const leading = await button.locator(".editorial-button__label").evaluate((element) => {
      const style = getComputedStyle(element);
      return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) };
    });
    expect(leading.lineHeight).toBeGreaterThanOrEqual(leading.fontSize - .5);
    const clipping = await button.evaluate((element) => {
      const label = element.querySelector<HTMLElement>(".editorial-button__label")!;
      const buttonBox = element.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const labelStyle = getComputedStyle(label);
      return {
        buttonTop: buttonBox.top,
        buttonBottom: buttonBox.bottom,
        labelTop: labelBox.top,
        labelBottom: labelBox.bottom,
        labelHeight: labelBox.height,
        lineHeight: Number.parseFloat(labelStyle.lineHeight),
        overflow: labelStyle.overflow,
      };
    });
    expect(clipping.labelTop).toBeGreaterThanOrEqual(clipping.buttonTop);
    expect(clipping.labelBottom).toBeLessThanOrEqual(clipping.buttonBottom);
    expect(clipping.labelHeight).toBeGreaterThanOrEqual(clipping.lineHeight);
    expect(["hidden", "clip"]).toContain(clipping.overflow);
  }
  const footerNewsletter = page.getByRole("contentinfo").getByRole("form", { name: "Εγγραφή στο newsletter" });
  await expect(footerNewsletter.getByRole("button", { name: "Newsletter" })).toBeVisible();
  const footerLinks = page.locator("[data-site-footer] .publication-footer__link");
  await expect(footerLinks).toHaveCount(10);
  await expect(footerLinks.first()).toHaveCSS("border-top-width", "0px");
  if ((page.viewportSize()?.width ?? 1280) > 760 && test.info().project.name !== "reduced-motion") {
    const heroButton = page.locator(".latest-hero .editorial-button");
    await expect(heroButton).toHaveCSS("color", "rgb(17, 22, 18)");
    await heroButton.hover();
    await expect(heroButton.locator(".editorial-button__fill")).toHaveCSS("clip-path", "inset(0px round 10px)");
    await expect(heroButton.locator(".editorial-button__arrow")).toHaveCSS("background-color", "rgb(17, 22, 18)");
    await expect(heroButton.locator(".editorial-button__arrow")).toHaveCSS("color", "rgb(200, 255, 61)");
    const quickLink = page.locator("[data-site-footer] .publication-footer__links .editorial-button").first();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(quickLink).toBeVisible();
    await quickLink.scrollIntoViewIfNeeded();
    await quickLink.hover();
    await expect(quickLink.locator(".editorial-button__fill")).toHaveCSS("clip-path", "inset(0px round 10px)");
    await expect(quickLink).toHaveCSS("border-left-width", "0px");
  }
});

test("does not overflow the viewport", async ({ page }) => {
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test("exposes keyboard navigation and meaningful artwork labels", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Μετάβαση στο κύριο περιεχόμενο" })).toBeFocused();
  const leadArtwork = page.locator(".latest-hero img").first();
  await leadArtwork.scrollIntoViewIfNeeded();
  await expect(leadArtwork).toBeVisible();
  await expect(leadArtwork).not.toHaveAttribute("alt", "");
});

test("places a motion-safe editorial marquee below the hero", async ({ page }) => {
  test.skip(test.info().project.name !== "reduced-motion", "Reduced-motion project only");
  await page.goto("/");
  const hero = page.locator(".latest-hero");
  const marquee = page.locator(".editorial-marquee");
  await expect(marquee).toBeVisible();
  await expect(marquee.locator(".editorial-marquee__track")).toHaveCSS("animation-name", "none");
  expect(await hero.evaluate((element) => element.compareDocumentPosition(document.querySelector(".editorial-marquee")!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
});

test("renders the simplified fixed publication header", async ({ page }) => {
  await page.goto("/");
  const header = page.getByTestId("publication-header");
  await expect(header).toHaveCount(1);
  await expect(header).toHaveCSS("position", "fixed");
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const topGlass = await header.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return { background: style.backgroundColor, clipPath: style.clipPath };
  });
  expect(topGlass.background).toBe("rgba(250, 249, 245, 0.8)");
  expect(topGlass.clipPath).toContain("100%");
  const searchButton = page.locator(".header-tool--search");
  await expect(searchButton).toHaveCSS("background-color", "rgb(200, 255, 61)");
  await expect(searchButton).toHaveCSS("color", "rgb(17, 22, 18)");
  if ((page.viewportSize()?.width ?? 1280) > 760 && test.info().project.name !== "reduced-motion") {
    await searchButton.hover();
    await expect(searchButton).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(searchButton).toHaveCSS("color", "rgb(17, 22, 18)");
  }
  await expect(page.getByRole("link", { name: "Ακαδημίες, αρχική σελίδα" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Επιλογή γλώσσας" })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "GR" })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "EN" })).toHaveCount(0);
  await expect(page.getByLabel("Header preview")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 60));
  await expect.poll(() => header.getAttribute("data-scrolled")).toBe("");
  await page.evaluate(() => window.scrollTo(0, 180));
  await expect.poll(() => header.getAttribute("data-hidden")).toBe("");
  await expect.poll(() => header.evaluate((element) => getComputedStyle(element, "::before").backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => header.evaluate((element) => getComputedStyle(element, "::before").clipPath)).not.toContain("100%");
  await page.evaluate(() => window.scrollTo(0, 90));
  await expect.poll(() => header.getAttribute("data-hidden")).toBeNull();
});

test("opens the accessible full-screen header menu", async ({ page }) => {
  await page.goto("/");
  const menuButton = page.locator(".header-tool--menu");
  await expect(menuButton).toHaveAccessibleName("Μενού");
  await expect(menuButton.locator(":scope > span")).toBeVisible();
  await expect(menuButton.locator(":scope > span")).toHaveCSS("white-space", "nowrap");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(menuButton).toHaveAccessibleName("Κλείσιμο");
  await expect(page.getByTestId("publication-header")).toHaveAttribute("data-menu-open", "");
  const navigation = page.getByRole("navigation", { name: "Πλοήγηση μενού" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(7);
  await expect(navigation.getByRole("link", { name: "Επικοινωνία" })).toHaveAttribute("href", "/contact");
  await expect(navigation.getByRole("link", { name: "Αναζήτηση" })).toHaveCount(0);
  await expect(page.locator(".mobile-menu-panel__word")).toHaveCount(0);
  const closeButton = page.getByRole("button", { name: "Κλείσιμο μενού" });
  await expect(closeButton).toBeVisible();
  const firstMenuLink = navigation.getByRole("link").first();
  await expect(firstMenuLink.locator(".mobile-menu-panel__preview")).toHaveCount(1);
  if ((page.viewportSize()?.width ?? 1280) > 760) {
    await firstMenuLink.hover();
    await expect(firstMenuLink.locator(".mobile-menu-panel__row-fill")).toHaveCSS("background-color", "rgba(128, 128, 128, 0.25)");
    await expect(firstMenuLink.locator(".mobile-menu-panel__row-fill")).toHaveCSS("clip-path", "inset(0px round 10px)");
    await expect(firstMenuLink.locator(".mobile-menu-panel__preview")).toHaveCSS("clip-path", "inset(0px round 10px)");
  }
  const menuPanel = page.locator(".mobile-menu-panel");
  await expect(menuPanel).toHaveAttribute("data-state", "open");
  await expect(menuPanel).toHaveCSS("pointer-events", "auto");
  await expect(menuPanel).toHaveCSS("z-index", "1000");
  await expect(menuPanel).toHaveCSS("clip-path", "inset(0px round 10px)");
  await expect(menuPanel).toHaveCSS("border-radius", "10px");
  await expect(menuPanel).toHaveCSS("overflow-y", "scroll");
  await expect(page.locator("html")).not.toHaveCSS("overflow-y", "hidden");
  const panelBox = await menuPanel.boundingBox();
  expect(panelBox?.height).toBeGreaterThanOrEqual((page.viewportSize()?.height ?? 0) - 1);
  await expect(menuPanel).toHaveCSS("background-color", "rgb(250, 249, 245)");
  await expect(page.getByText("Θεσσαλονίκη · Ελλάδα")).toBeVisible();
  await closeButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("publication-header")).not.toHaveAttribute("data-menu-open", "");
  await expect(menuPanel).toHaveAttribute("data-state", "closed");
  await expect(menuPanel).toHaveCSS("pointer-events", "none");
});

test("exposes an accessible editorial contact proposal form", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: "ΕΠΙΚΟΙΝΩΝΗΣΕ ΜΑΖΙ ΜΑΣ" })).toBeVisible();
  const messageForm = page.getByRole("form", { name: "Απλή φόρμα επικοινωνίας" });
  const proposalForm = page.getByRole("form", { name: "Φόρμα πρότασης άρθρου" });
  await expect(messageForm.getByLabel(/ΤΟ ΟΝΟΜΑ ΜΟΥ ΕΙΝΑΙ/)).toBeVisible();
  await expect(messageForm.getByLabel(/ΤΟ ΜΗΝΥΜΑ ΜΟΥ/)).toBeVisible();
  await expect(messageForm.getByRole("button", { name: "ΣΤΕΙΛΕ ΜΗΝΥΜΑ" })).toBeVisible();
  await expect(proposalForm.getByRole("button", { name: /ΕΠΙΛΕΞΕ ΚΑΤΗΓΟΡΙΑ/ })).toHaveAttribute("aria-haspopup", "listbox");
  await expect(proposalForm.getByLabel(/ΠΡΟΤΕΙΝΟΜΕΝΟΣ ΤΙΤΛΟΣ/)).toBeVisible();
  await expect(proposalForm.getByLabel(/ΠΕΣ ΜΑΣ ΤΗΝ ΙΣΤΟΡΙΑ/)).toBeVisible();
  await expect(proposalForm.getByRole("button", { name: "ΣΤΕΙΛΕ ΤΗΝ ΠΡΟΤΑΣΗ" })).toBeVisible();
});

test("opens a focused live-search modal and suggests public categories", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Αναζήτηση", exact: true });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const dialog = page.getByRole("dialog", { name: "Τι ψάχνεις;" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("searchbox", { name: "Ζωντανή αναζήτηση" });
  await input.waitFor({ state: "visible" });
  await input.focus();
  await expect(input).toBeFocused();
  await input.fill("προ");
  await expect(dialog.getByRole("status")).toBeEmpty();
  await input.fill("προπο");
  await expect(dialog.getByRole("link", { name: /Προπονητική/ })).toBeVisible();
  expect(await dialog.getByRole("listitem").count()).toBeLessThanOrEqual(5);
  await dialog.getByRole("button", { name: "Κλείσιμο αναζήτησης" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("renders every active database-backed article template", async ({ page }) => {
  for (const key of ["longform", "gallery", "interview", "cinematic", "sidebar"]) {
    await page.goto(`/article-preview?template=${key}`);
    await expect(page.locator("article")).toHaveAttribute("data-article-template", key);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Το παιχνίδι");
  }
});

test("protects the admin workspace and exposes an accessible login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Καλώς ήρθατε" })).toBeVisible();
  await expect(page.getByLabel("Όνομα χρήστη")).toHaveAttribute("autocomplete", "username");
  await expect(page.locator('input[name="email"]')).toHaveCount(0);
  await expect(page.getByLabel("Κωδικός πρόσβασης")).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
  await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "password");
  await expect(page.locator("[data-admin-login-motion]")).toBeVisible();
  await expect(page.getByText("Προστατευμένο περιβάλλον")).toBeVisible();
  await expect(page.locator(".admin-login-field")).toHaveCount(2);
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  if (viewportWidth <= 700) {
    await expect(page.locator(".admin-login-intro")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Σύνδεση συντακτικής ομάδας" })).toBeHidden();
  } else {
    await expect(page.locator(".admin-login-intro")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Σύνδεση συντακτικής ομάδας" })).toBeVisible();
  }
});

test("protects nested editorial CRUD routes before database access", async ({ page }) => {
  await page.goto("/admin/articles");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Καλώς ήρθατε" })).toBeVisible();
  await page.goto("/admin/articles/new?template=interview");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/articles/2019?sort=za&page=2");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/articles/00000000-0000-0000-0000-000000000000/preview");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/analytics");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/content-health");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/publication-queue");
  await expect(page).toHaveURL(/\/admin\/login/);
  const mediaSearch = await page.request.get("/api/admin/media/search?q=academies");
  expect(mediaSearch.status()).toBe(401);
  const mediaUpload = await page.request.post("/api/admin/media/upload", { multipart: { alt: "Protected upload" } });
  expect(mediaUpload.status()).toBe(401);
  expect(mediaUpload.headers()["cache-control"]).toContain("no-store");
  const scheduledPublisher = await page.request.post("/api/internal/publish-scheduled");
  expect([401, 503]).toContain(scheduledPublisher.status());
  expect(scheduledPublisher.headers()["cache-control"]).toContain("no-store");
});

test("navigates public routes and restores focus without hydration errors or transition overlays", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|hydrated/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  await page.goto("/");
  await expect(page.locator("[data-public-route]")).toBeVisible();
  await expect(page.locator("[data-route-transition-overlay]")).toHaveCount(0);
  await expect(page.locator("[data-page-view-transition]")).toBeVisible();
  await expect(page.locator("[data-animated-headline]").first()).toBeVisible();
  const heroArticleLink = page.locator(".latest-hero").getByRole("link", { name: "Διάβασε περισσότερα" });
  const heroArticleHref = await heroArticleLink.getAttribute("href");
  expect(heroArticleHref).toMatch(/^\/(?:article-preview\?template=longform|posts\/[^/?#]+)/);
  // The first desktop project is also the first process to visit an article in
  // Next dev. Warm that exact server route so this contract measures the
  // animated client navigation rather than Turbopack's one-time compilation.
  const warmedArticle = await page.request.get(heroArticleHref!);
  expect(warmedArticle.ok()).toBe(true);
  await heroArticleLink.click();
  await expect(page).toHaveURL(/\/(?:article-preview\?template=longform|posts\/[^/?#]+)/, { timeout: 10_000 });
  await expect(page.locator("main h1")).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("[data-page-view-transition]")).toBeVisible();
  const parallaxCoverage = await page.locator(".editorial-art__parallax").evaluateAll((frames) => frames.flatMap((frame) => {
    const image = frame.querySelector("img");
    const frameRect = frame.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    if (frameRect.width <= 0 || frameRect.height <= 0) return [];
    return [Boolean(imageRect && imageRect.top <= frameRect.top + 1 && imageRect.bottom >= frameRect.bottom - 1)];
  }));
  expect(parallaxCoverage.length).toBeGreaterThan(0);
  expect(parallaxCoverage.every(Boolean)).toBe(true);
  expect(hydrationErrors).toEqual([]);
});

test("operates the latest-five editorial hero within its viewport budget", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Οι πέντε τελευταίες ιστορίες" });
  await expect(hero).toBeVisible();
  await expect(hero.getByText("01 / 05")).toBeVisible();
  const initialTitle = await hero.getByRole("heading", { level: 1 }).getAttribute("aria-label")
    ?? await hero.getByRole("heading", { level: 1 }).textContent();
  await hero.focus();
  await hero.press("ArrowRight");
  await expect(hero.getByText("02 / 05")).toBeVisible();
  await expect.poll(async () => await hero.getByRole("heading", { level: 1 }).getAttribute("aria-label")
    ?? await hero.getByRole("heading", { level: 1 }).textContent()).not.toBe(initialTitle);
  const height = await hero.evaluate((element) => element.getBoundingClientRect().height);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(height).toBeGreaterThanOrEqual(viewportHeight * 0.8 - 1);
  expect(height).toBeLessThanOrEqual(viewportHeight * 0.8 + 1);
});

test("reveals story-card overlays for keyboard users without hiding base copy", async ({ page }) => {
  await page.goto("/");
  const latest = page.locator("#most-read");
  const card = latest.locator(".story-card").first();
  const title = (await card.getByRole("heading").first().textContent())?.trim() ?? "";
  expect(title.length).toBeGreaterThan(0);
  await card.getByRole("link").first().focus();
  await expect(card).toHaveAttribute("data-card-design", "cover");
  await expect(card).toHaveAttribute("data-overlay-state", "disabled");
  await expect(card.getByRole("heading", { name: title })).toBeVisible();
  await expect(card.locator(".story-card__cover")).toBeVisible();
});

test("renders SEO category archives and swaps twelve-story pages without a document reload", async ({ page }) => {
  await page.goto("/category/proponitiki");
  await expect(page).toHaveTitle(/Προπονητική/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://acadimies.gr/category/proponitiki");
  await expect(page.getByTestId("publication-header")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Προπονητική" })).toBeVisible();
  await expect(page.locator(".category-archive")).toHaveClass(/category-archive--vintage/);
  const sort = page.locator(".category-sort");
  await sort.getByRole("button", { name: "Σχετικά" }).click();
  await sort.getByRole("option", { name: "Παλαιότερα" }).click();
  await expect(page).toHaveURL(/sort=oldest/);
  await expect(sort.getByRole("button", { name: "Παλαιότερα" })).toBeVisible();
  const categoryHero = page.locator(".category-archive-hero");
  await expect(categoryHero.locator("[data-parallax-media] img")).toHaveAttribute("src", /(?:(?:\/|%2F)(?:webp|images)(?:\/|%2F))/i);
  await expect(categoryHero.locator("[data-category-hero-title]")).toBeVisible();
  await expect(categoryHero.locator("[data-category-hero-summary]")).toBeVisible();
  await expect(categoryHero.locator(".category-archive-hero__overlay")).toBeAttached();
  const grid = page.locator("[data-category-grid]");
  await expect(grid.locator(".story-card")).toHaveCount(12);
  const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columns).toBe((page.viewportSize()?.width ?? 1280) <= 760 ? 2 : 3);
  const firstCard = grid.locator(".story-card").first();
  await expect(firstCard).toHaveAttribute("data-card-design", "shaped");
  await expect(grid.locator(".story-card").nth(2)).toHaveAttribute("data-card-design", "cover");
  await expect(firstCard.getByLabel(/Κατηγορία:/)).toBeVisible();
  const cardBackground = await firstCard.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(cardBackground).not.toBe("rgba(0, 0, 0, 0)");
  await firstCard.getByRole("link").focus();
  await expect.poll(() => firstCard.evaluate((element) => getComputedStyle(element, "::before").clipPath)).toContain("inset(0px");
  const initialHref = await grid.locator(".story-card a").first().getAttribute("href");
  await page.evaluate(() => { (window as typeof window & { __categoryPaginationMarker?: boolean }).__categoryPaginationMarker = true; });
  const pagination = page.getByRole("navigation", { name: "Σελιδοποίηση άρθρων" });
  await expect(pagination.locator(".category-pagination__pages [aria-current='page']")).toHaveText("1");
  await pagination.getByRole("link", { name: "Επόμενη" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".category-pagination__status")).toContainText("Σελίδα 2");
  await expect(pagination.locator(".category-pagination__pages [aria-current='page']")).toHaveText("2");
  await expect(grid.locator(".story-card")).toHaveCount(12);
  await expect.poll(() => grid.locator(".story-card a").first().getAttribute("href")).not.toBe(initialHref);
  expect(await page.evaluate(() => (window as typeof window & { __categoryPaginationMarker?: boolean }).__categoryPaginationMarker)).toBe(true);
  await pagination.getByRole("link", { name: "Προηγούμενη" }).click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.locator(".category-pagination__status")).toContainText("Σελίδα 1");
  await expect(page.locator("[data-site-footer]")).toBeAttached();
});

test("exposes explicit newsletter consent and protects campaign administration", async ({ page }) => {
  await page.goto("/");
  const form = page.getByRole("region", { name: "Μείνε κοντά στο παιχνίδι" })
    .getByRole("form", { name: "Εγγραφή στο newsletter" });
  await expect(form.getByLabel("Το email σου")).toHaveAttribute("type", "email");
  await expect(form.getByRole("checkbox")).toHaveAttribute("required", "");
  await expect(form.getByText(/ενεργοποιείται μόνο μετά την επιβεβαίωση/)).toBeVisible();
  await page.goto("/admin/newsletter");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Καλώς ήρθατε" })).toBeVisible();
});

test("shows privacy-safe newsletter confirmation outcomes", async ({ page }) => {
  await page.goto("/?newsletter=confirmed#newsletter");
  await expect(page.locator("#newsletter .newsletter-cta__status")).toContainText("Η εγγραφή επιβεβαιώθηκε");
  await page.goto("/?newsletter=unsubscribed#newsletter");
  await expect(page.locator("#newsletter .newsletter-cta__status")).toContainText("Η διαγραφή από το Newsletter ολοκληρώθηκε");
  await page.goto("/?newsletter=invalid#newsletter");
  const status = page.locator("#newsletter .newsletter-cta__status");
  await expect(status).toHaveAttribute("role", "alert");
  await expect(status).toContainText("δεν είναι έγκυρος ή έχει λήξει");
  await expect(page.locator("body")).not.toContainText(/token=/i);
});

test("publishes crawl directives and the public editorial sitemap", async ({ page }) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /admin");
  expect(robotsText).toContain("Sitemap: https://acadimies.gr/sitemap.xml");
  expect(robotsText).toContain("Sitemap: https://acadimies.gr/news-sitemap.xml");

  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("https://acadimies.gr/category/proponitiki");
  expect(sitemapText).not.toContain("/admin");
  expect(sitemapText).not.toContain("/article-preview");

  const unpublishedLegacy = await page.request.get("/legacy-preview-only", { maxRedirects: 0 });
  expect(unpublishedLegacy.status()).toBe(404);
});

test("publishes safe RSS and Google News discovery documents", async ({ page }) => {
  const feed = await page.request.get("/feed.xml");
  expect(feed.ok()).toBe(true);
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  const feedXml = await feed.text();
  expect(feedXml).toContain('<rss version="2.0"');
  expect(feedXml).toContain("https://acadimies.gr/feed.xml");

  const news = await page.request.get("/news-sitemap.xml");
  expect(news.ok()).toBe(true);
  expect(news.headers()["content-type"]).toContain("application/xml");
  const newsXml = await news.text();
  expect(newsXml).toContain("www.google.com/schemas/sitemap-news/0.9");
  expect(newsXml).not.toContain("demo-27o-golden-cup");
});

test("hardens public responses with release security headers", async ({ page }) => {
  const response = await page.request.get("/");
  expect(response.ok()).toBe(true);
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
  expect(headers["x-permitted-cross-domain-policies"]).toBe("none");
});

test("searches only the public editorial archive with accessible URL filters", async ({ page }) => {
  await page.goto("/search?q=%CF%80%CE%B1%CE%B9%CE%B4%CE%AF");
  await expect(page).toHaveTitle(/Αναζήτηση/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const search = page.getByRole("search");
  await expect(search.getByLabel("Λέξεις αναζήτησης")).toHaveValue("παιδί");
  await expect(search.getByLabel("Θεματική ενότητα")).toHaveValue("");
  await expect(page.getByRole("heading", { level: 2, name: "Αποτελέσματα για «παιδί»" })).toBeVisible();
  await expect(page.locator("[data-search-results] .story-card").first()).toBeVisible();

  await page.goto("/search?q=x&category=..%2F..%2Fadmin&page=-2");
  await expect(search.getByLabel("Θεματική ενότητα")).toHaveValue("");
  await expect(page.locator(".search-results").getByRole("status")).toContainText("τουλάχιστον δύο");
});

test("protects the WordPress staging review before database access", async ({ page }) => {
  await page.goto("/admin/imports");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Καλώς ήρθατε" })).toBeVisible();
  await page.goto("/admin/imports/00000000-0000-4000-8000-000000000001");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Καλώς ήρθατε" })).toBeVisible();
});
