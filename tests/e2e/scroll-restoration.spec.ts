import { expect, test, type Page } from "@playwright/test";

async function experienceCards(page: Page) {
  return page.locator('a[data-experience-link="true"]');
}

async function scrollDeep(page: Page, minCards: number) {
  const cards = await experienceCards(page);

  for (let attempt = 0; attempt < 30; attempt++) {
    if ((await cards.count()) >= minCards) break;
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(150);
  }
}

test.describe("Browse scroll and history restoration", () => {
  test("A: deep-scroll Browse -> Experience -> Back restores the exact previous scroll position", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = await experienceCards(page);
    await scrollDeep(page, 40);

    const cardCount = await cards.count();
    test.skip(
      cardCount < 40,
      "not enough seeded experiences to page past batch 1",
    );

    const target = cards.nth(39);
    await target.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    test.skip(scrollBefore < 500, "page too short to prove replay is needed");

    await target.click({ force: true });
    await expect(page).toHaveURL(/\/experiences\//);

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL("/");

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(scrollBefore * 0.9);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(200);
  });

  test("B: a fresh Experience navigation always starts at the top", async ({
    page,
  }) => {
    await page.goto("/");
    await scrollDeep(page, 10);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(150);

    const cards = await experienceCards(page);
    await cards.first().click();
    await expect(page).toHaveURL(/\/experiences\//);

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("C: explicit header Browse navigation is a fresh entry, not a restore", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = await experienceCards(page);
    await scrollDeep(page, 10);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    test.skip(scrollBefore < 200, "page too short to establish a deep scroll");

    await cards.first().click();
    await expect(page).toHaveURL(/\/experiences\//);

    await page.getByRole("link", { name: "Browse", exact: true }).click();
    await expect(page).toHaveURL("/");

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBeLessThan(50);
  });

  test("D: query/filter state and scroll both survive the round trip", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("a");
    await expect(page).toHaveURL(/[?&]q=a/, { timeout: 5000 });

    const cards = await experienceCards(page);
    const cardCount = await cards.count();
    test.skip(cardCount === 0, "search query returned no results");

    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(150);
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await cards.first().click();
    await expect(page).toHaveURL(/\/experiences\//);

    await page.goBack();
    await expect(page).toHaveURL(/[?&]q=a/);

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThanOrEqual(0);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(200);
  });

  test("E: reloading Browse does not force restoration from a stale snapshot", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = await experienceCards(page);
    await scrollDeep(page, 5);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    test.skip(scrollBefore < 100, "page too short for this check");

    await cards.first().click({ force: true });
    await expect(page).toHaveURL(/\/experiences\//);

    await page.goBack();
    await expect(page).toHaveURL("/");

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(0);

    await page.reload();

    const scrollAfterReload = await page.evaluate(() => window.scrollY);
    expect(scrollAfterReload).toBe(0);
  });

  test("F: replay past the first page loads enough items before the final scroll", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = await experienceCards(page);
    await scrollDeep(page, 30);

    const cardCount = await cards.count();
    test.skip(
      cardCount < 30,
      "not enough seeded experiences to page past batch 1",
    );

    const target = cards.nth(29);
    await target.scrollIntoViewIfNeeded();
    const targetHref = await target.getAttribute("href");

    await target.click({ force: true });
    await expect(page).toHaveURL(/\/experiences\//);

    await page.goBack();
    await expect(page).toHaveURL("/");

    await expect(page.locator(`a[href="${targetHref}"]`).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("G: Back restores cached items and scroll with zero pagination requests, then continues from the cached cursor", async ({
    page,
  }) => {
    async function uniqueHrefCount() {
      const cards = await experienceCards(page);
      const hrefs = await cards.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href")),
      );
      return new Set(hrefs).size;
    }

    await page.goto("/");

    const cards = await experienceCards(page);
    await scrollDeep(page, 30);

    const restoredUniqueCount = await uniqueHrefCount();
    test.skip(
      restoredUniqueCount < 15,
      "not enough seeded experiences to page past batch 1",
    );

    const target = cards.nth(Math.floor((await cards.count()) / 2));
    await target.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    test.skip(scrollBefore < 500, "page too short for this check");

    await target.click({ force: true });
    await expect(page).toHaveURL(/\/experiences\//);

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    let actionRequestCount = 0;
    page.on("request", (request) => {
      if (request.headers()["next-action"]) actionRequestCount += 1;
    });

    await page.goBack();
    await expect(page).toHaveURL("/");

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(scrollBefore * 0.9);

    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore),
    ).toBeLessThan(200);
    expect(await uniqueHrefCount()).toBeGreaterThanOrEqual(
      restoredUniqueCount,
    );
    expect(actionRequestCount).toBe(0);

    for (let attempt = 0; attempt < 20; attempt++) {
      if (actionRequestCount > 0) break;
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(150);
    }

    test.skip(actionRequestCount === 0, "already at the end of the result set");

    await expect
      .poll(() => uniqueHrefCount(), { timeout: 5000 })
      .toBeGreaterThan(restoredUniqueCount);
  });

  test("no cross-page collision between Browse and My List scroll snapshots", async ({
    page,
  }) => {
    await page.goto("/");
    const browseCards = await experienceCards(page);
    await scrollDeep(page, 5);
    const browseScroll = await page.evaluate(() => window.scrollY);
    test.skip(browseScroll < 100, "browse page too short for this check");

    await browseCards.first().click();
    await expect(page).toHaveURL(/\/experiences\//);
    await page.goBack();
    await expect(page).toHaveURL("/");

    await page.goto("/list");
    await page.evaluate(() => window.scrollTo(0, 0));

    const listCards = page.locator('a[href^="/experiences/"]');
    const listCardCount = await listCards.count();
    test.skip(listCardCount === 0, "no seeded items in My List");

    await listCards.first().click();
    await expect(page).toHaveURL(/\/experiences\//);
    await page.goBack();
    await expect(page).toHaveURL("/list");

    const listScrollAfter = await page.evaluate(() => window.scrollY);
    expect(listScrollAfter).toBeLessThan(100);
  });

  test("Discovery -> Guide -> Back restores scroll position", async ({
    page,
  }) => {
    await page.goto("/discovery");

    const guideLinks = page.locator('a[href^="/guides/"]');
    const guideCount = await guideLinks.count();
    test.skip(guideCount === 0, "no seeded public guides");

    await page.mouse.wheel(0, 800);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    test.skip(scrollBefore === 0, "discovery page too short for this check");

    await guideLinks.first().click();
    await expect(page).toHaveURL(/\/guides\//);

    await page.goBack();
    await expect(page).toHaveURL("/discovery");

    await page.waitForFunction(
      (expected) => Math.abs(window.scrollY - expected) < 400,
      scrollBefore,
      { timeout: 5000 },
    );
  });

  test("mobile viewport: Browse -> Experience -> Back does not reset to the top of the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const cards = await experienceCards(page);
    await scrollDeep(page, 10);
    const cardCount = await cards.count();
    test.skip(cardCount < 10, "not enough seeded experiences for this check");

    const target = cards.nth(cardCount - 1);
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const scrollAtClick = await page.evaluate(() => window.scrollY);
    test.skip(scrollAtClick < 150, "mobile page too short for this check");

    await target.click({ force: true });
    await expect(page).toHaveURL(/\/experiences\//);

    await page.goBack();
    await expect(page).toHaveURL("/");

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(scrollAtClick * 0.5);
  });

  test("tablet viewport: Browse -> Experience -> Back restores scroll position", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");

    const cards = await experienceCards(page);
    await scrollDeep(page, 10);
    const cardCount = await cards.count();
    test.skip(cardCount < 10, "not enough seeded experiences for this check");

    const target = cards.nth(cardCount - 1);
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const scrollAtClick = await page.evaluate(() => window.scrollY);
    test.skip(scrollAtClick < 150, "tablet page too short for this check");

    await target.click({ force: true });
    await expect(page).toHaveURL(/\/experiences\//);

    await page.goBack();
    await expect(page).toHaveURL("/");

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(scrollAtClick * 0.5);
  });
});
