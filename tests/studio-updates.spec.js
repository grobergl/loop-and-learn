import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
});
test("the sidebar profile fits short desktop windows and the main content scrolls", async ({
  page,
}) => {
  for (const height of [768, 600, 500, 400]) {
    await page.setViewportSize({ width: 1280, height });
    await expect(page.locator(".sidebar .profile")).toBeInViewport({
      ratio: 1,
    });
    const fits = await page
      .locator(".sidebar")
      .evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
    expect(fits).toBe(true);
    await page.locator(".sidebar .profile").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close dialog" }).click();
  }
  await page.mouse.wheel(0, 700);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await expect(page.locator(".sidebar .profile")).toBeInViewport({ ratio: 1 });
});
test("category icons update immediately and are consistent on the saved project and library", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Paste my pattern/ }).click();
  const preview = page.locator(".category-icon-preview [data-project-icon]");
  for (const [category, icon] of [
    ["Plushies", "Rabbit"],
    ["Clothing", "Shirt"],
    ["Home", "House"],
    ["Accessories", "ShoppingBag"],
    ["Other", "Shapes"],
  ]) {
    await page
      .getByRole("combobox", { name: "Category", exact: true })
      .selectOption(category);
    await expect(preview).toHaveAttribute("data-project-icon", icon);
  }
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Clothing");
  await page
    .getByRole("textbox", { name: "Pattern name", exact: true })
    .fill("A winter hat");
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Round 1: 6 sc in a ring.");
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await page.getByRole("button", { name: "Start my project" }).click();
  await expect(
    page.locator(".summary-art [data-project-icon]"),
  ).toHaveAttribute("data-project-icon", "Shirt");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Patterns", exact: true })
    .click();
  await expect(
    page
      .locator(".pattern-card")
      .filter({
        has: page.getByRole("button", { name: "A winter hat", exact: true }),
      })
      .locator("[data-project-icon]"),
  ).toHaveAttribute("data-project-icon", "Shirt");
});
test("a shell/bobble project grows the library and lets the maker choose learning or known", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Paste my pattern/ }).click();
  await page
    .getByRole("textbox", { name: "Pattern name", exact: true })
    .fill("Texture sampler");
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Row 1: Work bobble stitches.\nRow 2: Work shell stitches.");
  await expect(
    page.getByRole("checkbox", { name: /Bobble stitch/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /Shell stitch/ }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A new stitch to try?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start my project" }).click();
  await page
    .getByRole("button", { name: "Learn Bobble stitch", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Learning", exact: true }),
  ).toHaveClass("active");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "I know Shell stitch", exact: true })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Stitch library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bobble stitch", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Shell stitch", exact: true }),
  ).toBeVisible();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("loop-and-learn.v1")),
  );
  expect(s.skills.bobble).toBe("Learning");
  expect(s.skills.shell).toBe("Mastered");
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Stitch library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Shell stitch", exact: true }),
  ).toBeVisible();
});
test("a whole AI reply goes into separate fields instead of turning supplies into rounds", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Paste my pattern/ }).click();
  await page
    .getByText("Paste a full AI reply or written pattern", { exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Full pattern reply", exact: true })
    .fill(
      "# Tiny hat\n## Pattern details\nCategory: Clothing\nTerminology: US\nDifficulty: Intermediate\nHook size: 5 mm\nYarn weight: 4 Medium\n## Materials\nBody: 60 yards\nTrim: 20 yards\n## Notes\nUntested draft.\n## Instructions\nRound 1: 6 sc in a ring.\nRounds 2–3: Sc around.\n## Finishing\nWeave in ends.",
    );
  await page
    .getByRole("button", { name: "Organize reply into fields" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Pattern name", exact: true }),
  ).toHaveValue("Tiny hat");
  await expect(
    page.getByRole("textbox", { name: "Before you begin", exact: true }),
  ).toContainText("");
  expect(
    await page
      .getByRole("textbox", { name: "Before you begin", exact: true })
      .inputValue(),
  ).toContain("Body: 60 yards");
  await expect(
    page.getByRole("textbox", { name: "Finishing instructions", exact: true }),
  ).toHaveValue("Weave in ends.");
  await expect(
    page.getByText("3 checkable rounds", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await expect(
    page.getByRole("spinbutton", { name: "Color 1 estimated yards" }),
  ).toHaveValue("60");
  await expect(
    page.getByRole("spinbutton", { name: "Color 2 estimated yards" }),
  ).toHaveValue("20");
  await page.getByRole("button", { name: "Start my project" }).click();
  const p = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("loop-and-learn.v1")).projects.at(-1),
  );
  expect(p.pattern.instructions).toHaveLength(3);
  expect(p.pattern.setup).toContain("Body: 60 yards");
  expect(p.pattern.finish).toBe("Weave in ends.");
  expect(p.materials).toHaveLength(2);
});
