import { expect, test } from "@playwright/test";

test.describe("browse editorial redesign", () => {
  test("default state renders the editorial heading and no onboarding sidebar", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Things worth doing." }),
    ).toBeVisible();

    await expect(page.getByText("How Sodoit works")).toHaveCount(0);
    await expect(page.getByText("Start your life list")).toHaveCount(0);
  });

  test("featured experience, when present, links to a real experience", async ({
    page,
  }) => {
    await page.goto("/");

    const featuredBadge = page.getByText("Today's pick", { exact: true });

    if ((await featuredBadge.count()) === 0) {
      test.skip();
      return;
    }

    const featureLink = page
      .locator("section", { has: featuredBadge })
      .getByRole("link")
      .first();

    await expect(featureLink).toHaveAttribute(
      "href",
      /^\/experiences\/[^/]+$/,
    );

    const accessibleName = await featureLink.getAttribute("aria-label");
    expect(accessibleName?.length ?? 0).toBeGreaterThan(0);
  });

  test("search updates the URL and results", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("searchbox").fill("a");
    await expect(page).toHaveURL(/[?&]q=a/, { timeout: 5000 });
  });

  test("category filter updates the URL and suppresses the editorial hero", async ({
    page,
  }) => {
    await page.goto("/");

    const categoryGroup = page.getByRole("group", { name: "Categories" });
    await categoryGroup.getByRole("button", { name: "Adventure" }).click();

    await expect(page).toHaveURL(/[?&]category=adventure/);
    await expect(page.getByText("Today's pick", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByText(/result/)).toBeVisible();
  });

  test("clearing filters returns to the default editorial view", async ({
    page,
  }) => {
    await page.goto("/?category=adventure");

    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: "Things worth doing." }),
    ).toBeVisible();
  });

  test("list view URL param combines with other filter state", async ({
    page,
  }) => {
    await page.goto("/?category=adventure&view=list");

    await expect(page).toHaveURL(/[?&]view=list/);
    await expect(page).toHaveURL(/[?&]category=adventure/);
    await expect(page.getByText("Today's pick", { exact: true })).toHaveCount(
      0,
    );
  });

  test("marking an experience complete toggles its state", async ({ page }) => {
    await page.goto("/?category=adventure&view=list");

    const firstToggle = page.getByRole("checkbox").first();
    await expect(firstToggle).toBeVisible();

    const wasChecked =
      (await firstToggle.getAttribute("aria-checked")) === "true";

    await firstToggle.click();

    await expect(firstToggle).toHaveAttribute(
      "aria-checked",
      wasChecked ? "false" : "true",
    );

    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute(
      "aria-checked",
      wasChecked ? "true" : "false",
    );
  });

  test("empty results show correct empty state", async ({ page }) => {
    await page.goto("/?q=zzzznonexistentzzz");

    await expect(page.getByText("Nothing matches")).toBeVisible();
  });

  test("save toggles from the Feature and from a Standard card", async ({
    page,
  }) => {
    await page.goto("/");

    const featuredBadge = page.getByText("Today's pick", { exact: true });

    if ((await featuredBadge.count()) > 0) {
      const featureToggle = page
        .locator("section", { has: featuredBadge })
        .getByRole("checkbox");

      await expect(featureToggle).toBeVisible();

      const before = await featureToggle.getAttribute("aria-checked");
      await featureToggle.click();
      await expect(featureToggle).not.toHaveAttribute(
        "aria-checked",
        before ?? "",
      );

      await featureToggle.click();
      await expect(featureToggle).toHaveAttribute(
        "aria-checked",
        before ?? "false",
      );
    }

    const exploreSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Explore experiences" }),
    });

    const standardCard = exploreSection.locator("li").first();
    const listStateButton = standardCard.getByRole("button", {
      name: /(Add .+ to My List|Remove .+ from My List)$/,
    });

    await expect(listStateButton).toBeVisible();
    const initialName = await listStateButton.getAttribute("aria-label");
    const wasUnsaved = initialName?.startsWith("Add ") ?? true;

    await listStateButton.click();

    const toggledButton = standardCard.getByRole("button", {
      name: wasUnsaved ? /^Remove .+ from My List$/ : /^Add .+ to My List$/,
    });
    await expect(toggledButton).toBeVisible();

    await toggledButton.click();
    await expect(
      standardCard.getByRole("button", {
        name: wasUnsaved ? /^Add .+ to My List$/ : /^Remove .+ from My List$/,
      }),
    ).toBeVisible();
  });

  test("list mode never renders the Featured hero or wide/standard sections", async ({
    page,
  }) => {
    await page.goto("/?view=list");

    await expect(page.getByText("Today's pick", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.locator("main ul.grid")).toHaveCount(0);
  });

  test("filtered results use the Standard card, not editorial sections", async ({
    page,
  }) => {
    await page.goto("/?category=adventure");

    await expect(page.getByText("Today's pick", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.locator("main section h2")).toHaveCount(0);
  });

  test("difficulty filter supports all four levels and round-trips via the URL", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Filters", exact: true }).click();

    const intensityGroup = page.getByRole("group", { name: "Intensity" });

    await expect(
      intensityGroup.getByRole("button", { name: "Easy" }),
    ).toBeVisible();
    await expect(
      intensityGroup.getByRole("button", { name: "Medium" }),
    ).toBeVisible();
    await expect(
      intensityGroup.getByRole("button", { name: "Hard" }),
    ).toBeVisible();
    await expect(
      intensityGroup.getByRole("button", { name: "Extreme" }),
    ).toBeVisible();

    await intensityGroup.getByRole("button", { name: "Extreme" }).click();

    await expect(page).toHaveURL(/[?&]difficulty=Extreme/);

    await page.reload();
    await page.getByRole("button", { name: /^Filters/ }).click();
    await expect(
      page
        .getByRole("group", { name: "Intensity" })
        .getByRole("button", { name: "Extreme", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("difficulty indicator always exposes a readable text label", async ({
    page,
  }) => {
    await page.goto("/?category=adventure");

    const firstCard = page.locator("main ul li").first();
    await expect(
      firstCard.getByText(/^(Easy|Medium|Hard|Extreme)$/),
    ).toBeVisible();
  });
});
