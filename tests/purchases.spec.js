import { test, expect } from "@playwright/test";

test.use({ timezoneId: "America/Denver" });
const snapshot = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("loop-and-learn.v1")));
const stash = (page) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name: "Yarn stash" })
    .click();
const card = (page, color) =>
  page
    .locator(".yarn-card")
    .filter({ has: page.getByRole("heading", { name: color, exact: true }) });
test.beforeEach(async ({ page }) => {
  // Denver is still Nov 25 while UTC has crossed into Nov 26.
  await page.clock.install({ time: new Date("2026-11-26T01:00:00Z") });
  await page.goto("http://127.0.0.1:5173");
});

test("an empty stash can purchase a new yarn in skeins without a separate Add yarn step", async ({
  page,
}) => {
  const empty = await snapshot(page);
  empty.yarn = [];
  empty.projects = [];
  empty.purchases = [];
  await page.evaluate(
    (s) => localStorage.setItem("loop-and-learn.v1", JSON.stringify(s)),
    empty,
  );
  await page.reload();
  await stash(page);
  await page
    .getByRole("button", { name: "Record a purchase", exact: true })
    .click();
  await page
    .getByLabel("Yarn purchased", { exact: true })
    .fill("Mountain merino");
  await page.getByRole("button", { name: "Close dialog" }).click();
  expect((await snapshot(page)).yarn).toHaveLength(0);
  await page
    .getByRole("button", { name: "Record a purchase", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel("Yarn purchased", { exact: true })
    .fill("Mountain merino");
  await page.getByLabel("Color name", { exact: true }).fill("Forest green");
  await page.getByLabel("Fiber (optional)", { exact: true }).fill("Wool");
  await page
    .getByLabel("Yarn weight", { exact: true })
    .selectOption("4 · Medium");
  await page
    .getByLabel("Measure purchase in", { exact: true })
    .selectOption("skeins");
  await page.getByLabel("Skeins purchased", { exact: true }).fill("3");
  await page.getByLabel("Yards per skein", { exact: true }).fill("120");
  await expect(
    page.getByText("3 × 120 = 360 yards purchased", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Date received", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Expected delivery (optional)", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Purchase status", { exact: true })
    .selectOption("awaiting");
  await expect(page.getByLabel("Date received", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Expected delivery (optional)", { exact: true })
    .fill("2026-11-30");
  await page.getByRole("dialog").evaluate((d) => {
    d.scrollTop = 0;
  });
  await page
    .getByRole("dialog")
    .screenshot({
      path: test.info().outputPath("new-yarn-purchase-mobile.png"),
    });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((d) => d.scrollWidth <= d.clientWidth),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  const saved = await snapshot(page);
  expect(saved.yarn).toHaveLength(1);
  expect(saved.yarn[0]).toMatchObject({
    name: "Mountain merino",
    color: "Forest green",
    yards: 0,
  });
  expect(saved.purchases[0]).toMatchObject({
    yarnId: saved.yarn[0].id,
    status: "awaiting",
    yards: 360,
    skeins: 3,
    yardsPerSkein: 120,
  });
  await page
    .getByRole("button", {
      name: "Purchase history for Forest green",
      exact: true,
    })
    .click();
  await expect(page.locator(".purchase-entry")).toContainText(
    "120 yd per skein",
  );
  await page
    .getByRole("button", { name: "Mark received", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm receipt and add stock", exact: true })
    .click();
  expect((await snapshot(page)).yarn[0].yards).toBe(360);
  await page.reload();
  expect((await snapshot(page)).yarn[0].yards).toBe(360);
});

test("typing can select an existing yarn without creating a duplicate", async ({
  page,
}) => {
  await stash(page);
  await page
    .getByRole("button", { name: "Record a purchase", exact: true })
    .click();
  await page.getByLabel("Yarn purchased", { exact: true }).fill("Sage");
  await page.getByRole("button", { name: /Soft & cozy — Sage meadow/ }).click();
  await expect(page.getByText("New yarn details", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText(/Currently on hand: 280 yd/)).toBeVisible();
  await page.getByLabel("Yards purchased", { exact: true }).fill("50");
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  const saved = await snapshot(page);
  expect(saved.yarn).toHaveLength(4);
  expect(saved.yarn.find((y) => y.id === "y2").yards).toBe(330);
  expect(saved.purchases[0].yarnId).toBe("y2");
});

test("received purchase updates linked yarn and shortage; history and backup survive refresh", async ({
  page,
}) => {
  await stash(page);
  await page
    .getByRole("button", {
      name: "Record purchase for Sage meadow",
      exact: true,
    })
    .click();
  await page
    .getByRole("spinbutton", { name: "Yards purchased", exact: true })
    .fill("100");
  await page
    .getByRole("spinbutton", {
      name: "Skeins purchased (optional)",
      exact: true,
    })
    .fill("2");
  await page
    .getByRole("textbox", { name: "Store (optional)", exact: true })
    .fill("Neighborhood yarn shop");
  await page
    .getByRole("textbox", { name: "Purchase notes (optional)", exact: true })
    .fill("Dye lot 42");
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card(page, "Sage meadow")).toContainText("380 yd");
  await expect(card(page, "Sage meadow")).toContainText("350 yd");
  await expect(card(page, "Sage meadow")).not.toContainText("Needs a top-up");
  const recorded = await snapshot(page);
  expect(recorded.purchases).toHaveLength(1);
  expect(recorded.purchases[0]).toMatchObject({
    yarnId: "y2",
    status: "received",
    yards: 100,
    receivedOn: "2026-11-25",
    skeins: 2,
  });
  await page.reload();
  await stash(page);
  await page
    .getByRole("button", {
      name: "Purchase history for Sage meadow",
      exact: true,
    })
    .click();
  await expect(page.locator(".purchase-entry")).toContainText(
    "Neighborhood yarn shop",
  );
  await expect(page.locator(".purchase-entry")).toContainText("Dye lot 42");
  await expect(page.locator(".purchase-entry")).toContainText(
    "100 yd · 2 skeins",
  );
  await expect(
    page.getByRole("button", { name: "Mark received", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Studio settings", exact: true })
    .click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export studio backup" }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  let json = "";
  for await (const chunk of stream) json += chunk;
  expect(JSON.parse(json).purchases).toEqual(recorded.purchases);
  await page.getByLabel("Restore a backup", { exact: true }).setInputFiles({
    name: "purchases.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await page
    .getByRole("button", { name: "Replace studio with this backup" })
    .click();
  expect((await snapshot(page)).yarn.find((y) => y.id === "y2").yards).toBe(
    380,
  );
});

test("awaiting orders stay out of stock; reminders snooze, reschedule, and receive once", async ({
  page,
}) => {
  await stash(page);
  await page
    .getByRole("button", {
      name: "Record purchase for Sage meadow",
      exact: true,
    })
    .click();
  await page
    .getByRole("spinbutton", { name: "Yards purchased", exact: true })
    .fill("100");
  await page.getByLabel("Purchase date", { exact: true }).fill("2026-11-20");
  await page
    .getByRole("combobox", { name: "Purchase status", exact: true })
    .selectOption("awaiting");
  await page
    .getByLabel("Expected delivery (optional)", { exact: true })
    .fill("2026-11-25");
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  await expect(card(page, "Sage meadow")).toContainText("280 yd");
  await expect(card(page, "Sage meadow")).toContainText("70 yd short");
  await expect(card(page, "Sage meadow")).toContainText(
    "100 yd purchased, awaiting delivery",
  );
  await page
    .getByRole("button", { name: "Shopping list", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "100 yd already purchased, awaiting delivery",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  const reminders = page.getByRole("region", { name: "Delivery reminders" });
  await expect(reminders).toBeVisible();
  await reminders
    .getByRole("button", { name: "Still waiting", exact: true })
    .click();
  await expect(reminders).toHaveCount(0);
  await page.reload();
  await expect(reminders).toHaveCount(0);
  await stash(page);
  await page
    .getByRole("button", { name: "Purchase history", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Change expected delivery", exact: true })
    .click();
  await page
    .getByLabel("Expected delivery (optional)", { exact: true })
    .fill("2026-11-27");
  await page.getByRole("button", { name: "Save expected delivery" }).click();
  expect((await snapshot(page)).purchases[0]).toMatchObject({
    expectedOn: "2026-11-27",
    remindAfter: null,
  });
  await page.reload();
  await expect(reminders).toHaveCount(0);
  await page.clock.fastForward("48:00:00");
  await expect(reminders).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("delivery-reminder.png"),
    fullPage: true,
  });
  await reminders
    .getByRole("button", { name: "Mark received", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm receipt and add stock", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(reminders).toHaveCount(0);
  const done = await snapshot(page);
  expect(done.yarn.find((y) => y.id === "y2").yards).toBe(380);
  expect(done.purchases[0]).toMatchObject({
    status: "received",
    receivedOn: "2026-11-27",
  });
  await page.reload();
  expect((await snapshot(page)).yarn.find((y) => y.id === "y2").yards).toBe(
    380,
  );
});

test("optional dates, history protection, browser-check bypass, and mobile purchase screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await stash(page);
  await page
    .getByRole("button", {
      name: "Record purchase for Dusty rose",
      exact: true,
    })
    .click();
  await page
    .getByRole("spinbutton", { name: "Yards purchased", exact: true })
    .fill("-5");
  await page.locator("dialog form").evaluate((form) => {
    form.noValidate = true;
  });
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("positive whole yards");
  expect((await snapshot(page)).purchases).toHaveLength(0);
  await page
    .getByRole("spinbutton", { name: "Yards purchased", exact: true })
    .fill("75");
  await page
    .getByRole("combobox", { name: "Purchase status", exact: true })
    .selectOption("awaiting");
  await page.screenshot({
    path: test.info().outputPath("mobile-purchase.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit Dusty rose", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(/linked to project or purchase history/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", {
      name: "Purchase history for Dusty rose",
      exact: true,
    })
    .click();
  await expect(page.locator(".purchase-entry")).toContainText("Not set");
  await page
    .getByRole("combobox", { name: "Show purchases", exact: true })
    .selectOption("received");
  await expect(
    page.getByText("No received purchases recorded for this yarn."),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Show purchases", exact: true })
    .selectOption("all");
  await page.screenshot({
    path: test.info().outputPath("mobile-history.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Delivery reminders" }),
  ).toHaveCount(0);
  expect((await snapshot(page)).yarn.find((y) => y.id === "y4").yards).toBe(
    210,
  );
});
