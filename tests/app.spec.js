import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
});
test("dashboard, patterns, project, stitch status and persistence", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "A little progress, a lot of joy." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find your next project" }).click();
  await page
    .getByRole("textbox", { name: "Search patterns, occasions, or ideas…" })
    .fill("baby shower");
  await expect(
    page.getByRole("button", { name: "View Little cotton washcloth" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Sunday scarf" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "View Little cotton washcloth" })
    .click();
  await page.getByRole("button", { name: "Make this project" }).click();
  await page
    .getByRole("textbox", { name: "Give your project a name" })
    .fill("My first washcloth");
  await page.getByRole("button", { name: "Start my project" }).click();
  await expect(
    page.getByRole("heading", { name: "My first washcloth" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Project notes" })
    .pressSequentially("Keep this note.");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Single crochet/ }).click();
  await page.getByRole("button", { name: "Learning", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My projects" })
    .click();
  await page.getByRole("button", { name: /My first washcloth/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Project notes" }),
  ).toHaveValue("Keep this note.");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.getByRole("button", { name: /Single crochet/ }).click();
  await expect(
    page.getByRole("button", { name: "Learning", exact: true }),
  ).toHaveClass("active");
});
test("editing stash updates shortages; cancellation releases reservation", async ({
  page,
}) => {
  await page.getByRole("button", { name: "View shopping list" }).click();
  await expect(page.getByText("70 yd", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Yarn stash" })
    .click();
  await page.getByRole("button", { name: "Edit Sage meadow" }).click();
  await page
    .getByRole("spinbutton", { name: "Total yards remaining" })
    .fill("400");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("50 yd", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My projects" })
    .click();
  await page.getByRole("button", { name: /A cozy gift for Mom/ }).click();
  await page.getByRole("button", { name: "Edit project" }).click();
  await page
    .getByRole("button", { name: "Cancel project", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm cancellation and release yarn" })
    .click();
  await expect(
    page.getByRole("button", { name: /A cozy gift for Mom/ }),
  ).toHaveCount(0);
});
test("finishing uses actual yarn; master skill retains guide", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Coasters for my corner/ }).click();
  await expect(
    page.getByRole("button", { name: "Finish project" }),
  ).toBeDisabled();
  for (const c of await page.getByRole("checkbox").all()) await c.check();
  await page.getByRole("button", { name: "Finish project" }).click();
  await page.getByRole("spinbutton").fill("25");
  await page.getByRole("button", { name: "Confirm and finish" }).click();
  await expect(
    page.getByText("25 yd used · Yarn deducted from stash"),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Yarn stash" })
    .click();
  await expect(page.getByText("135 yd", { exact: true })).toHaveCount(2);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Stitch library" })
    .click();
  await page
    .locator(".stitch-card")
    .filter({
      has: page.getByRole("heading", { name: "Magic ring", exact: true }),
    })
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mastered", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Find a video tutorial" }),
  ).toBeVisible();
});
test("new yarn can be added and mobile pages fit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Yarn stash" })
    .click();
  await page
    .getByRole("button", { name: "Add yarn", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Yarn name", exact: true })
    .fill("Test cotton");
  await page.getByRole("textbox", { name: "Color name" }).fill("Ocean");
  await page
    .getByRole("textbox", { name: "Fiber", exact: true })
    .fill("Cotton");
  await page
    .getByRole("button", { name: "Add yarn", exact: true })
    .last()
    .click();
  await expect(page.getByRole("heading", { name: "Ocean" })).toBeVisible();
  for (const name of [
    "Dashboard",
    "Patterns",
    "My projects",
    "Stitch library",
  ]) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("navigation").getByRole("button", { name }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
