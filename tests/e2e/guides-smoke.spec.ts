import { expect, test, type Page } from "@playwright/test";

async function allGuideHrefs(page: Page): Promise<string[]> {
  await page.goto("/discovery");
  const links = page.locator('a[href^="/guides/"]');
  const count = await links.count();
  const hrefs: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href");
    if (href) hrefs.push(href);
  }

  return [...new Set(hrefs)];
}

async function firstGuideLinkMatching(
  page: Page,
  labelPattern: RegExp,
): Promise<string | null> {
  const hrefs = await allGuideHrefs(page);

  for (const href of hrefs) {
    await page.goto(href);
    const eyebrow = page.getByText(/Discovery ·/);
    if (
      (await eyebrow.count()) > 0 &&
      labelPattern.test(await eyebrow.first().innerText())
    ) {
      return href;
    }
  }

  return null;
}

async function anyGuideLink(page: Page): Promise<string | null> {
  await page.goto("/discovery");
  const links = page.locator('a[href^="/guides/"]');
  if ((await links.count()) === 0) return null;
  return links.first().getAttribute("href");
}

test.describe("Discovery -> Guide smoke", () => {
  test("Discovery links to a public Guide that renders with a type label", async ({
    page,
  }) => {
    const href = await anyGuideLink(page);
    test.skip(!href, "no seeded public guides");

    await page.goto(href!);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Discovery ·/)).toBeVisible();
  });

  test("itinerary Guide: Spots render, expand/collapse works, route CTA present when routable", async ({
    page,
  }) => {
    const href = await firstGuideLinkMatching(page, /Itinerary/i);
    test.skip(!href, "no seeded itinerary guide");

    await page.goto(href!);

    await expect(page.getByText("Discovery · Itinerary")).toBeVisible();

    const spotButtons = page.locator("li button[aria-expanded]");
    const spotCount = await spotButtons.count();
    test.skip(spotCount === 0, "itinerary guide has no spots");

    const firstSpot = spotButtons.first();
    await expect(firstSpot).toHaveAttribute("aria-expanded", "false");

    const mapsLinkBeforeExpand = firstSpot
      .locator("..")
      .getByRole("link", { name: /Open in Google Maps/i });
    await expect(mapsLinkBeforeExpand).toHaveCount(0);

    await firstSpot.click();
    await expect(firstSpot).toHaveAttribute("aria-expanded", "true");

    const mapsLink = firstSpot
      .locator("..")
      .getByRole("link", { name: /Open in Google Maps/i });

    if (await mapsLink.count()) {
      const href = await mapsLink.getAttribute("href");
      expect(href).toMatch(/^https:\/\//);
      await expect(mapsLink).toHaveAttribute("target", "_blank");
      await expect(mapsLink).toHaveAttribute("rel", /noopener/);
    }

    await firstSpot.click();
    await expect(firstSpot).toHaveAttribute("aria-expanded", "false");

    const routeCta = page.getByRole("link", { name: /Open route/i });
    if (await routeCta.count()) {
      const routeHref = await routeCta.first().getAttribute("href");
      expect(routeHref).toMatch(/^https:\/\/www\.google\.com\/maps/);
      await expect(routeCta.first()).toHaveAttribute("rel", /noopener/);
    }
  });

  test("collection Guide: Spots render with no route CTA", async ({ page }) => {
    const href = await firstGuideLinkMatching(
      page,
      /Hidden Gems|Food & Drink|Local Favorites/i,
    );
    test.skip(!href, "no seeded collection guide");

    await page.goto(href!);

    const spotButtons = page.locator("li button[aria-expanded]");
    const spotCount = await spotButtons.count();
    test.skip(spotCount === 0, "collection guide has no spots");

    await expect(page.getByRole("link", { name: /Open route/i })).toHaveCount(
      0,
    );

    const firstSpot = spotButtons.first();
    await firstSpot.click();
    await expect(firstSpot).toHaveAttribute("aria-expanded", "true");
  });

  test("comparison Guide: Skip / Instead / Why render", async ({ page }) => {
    const href = await firstGuideLinkMatching(page, /Worth It or Skip It/i);
    test.skip(!href, "no seeded worth_it_or_skip_it guide");

    await page.goto(href!);

    await expect(page.getByText("Skip", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Instead", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Open route/i })).toHaveCount(
      0,
    );
  });

  test("mobile viewport has no horizontal overflow on a Guide page", async ({
    page,
  }) => {
    const href = await anyGuideLink(page);
    test.skip(!href, "no seeded public guides");

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(href!);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });

  test("authenticated user can Save a Guide", async ({ page }) => {
    const href = await anyGuideLink(page);
    test.skip(!href, "no seeded public guides");

    await page.goto(href!);

    const saveButton = page.getByRole("button", { name: /^Save guide$/i });
    test.skip((await saveButton.count()) === 0, "no Save button on this guide");

    await saveButton.click();
    await expect(page.getByRole("button", { name: /^Saved$/i })).toBeVisible();
  });
});

test.describe("Discovery -> Guide smoke (guest)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("guest Save redirects to login preserving next", async ({ page }) => {
    const href = await anyGuideLink(page);
    test.skip(!href, "no seeded public guides");

    await page.goto(href!);

    const saveLink = page.getByRole("link", { name: /^Save guide$/i });
    test.skip(
      (await saveLink.count()) === 0,
      "no guest Save link on this guide",
    );

    await saveLink.click();

    await expect(page).toHaveURL(/\/login\?next=/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe(href);
  });
});
