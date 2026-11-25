import { test, expect } from "@playwright/test";

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
async function picture(page, color = "#31593e") {
  const data = await page.evaluate((color) => {
    const c = document.createElement("canvas");
    c.width = 2400;
    c.height = 1600;
    const ctx = c.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#fff9ed";
    ctx.fillRect(350, 500, 1700, 600);
    ctx.fillStyle = "#31593e";
    ctx.font = "90px sans-serif";
    ctx.fillText("Sample yarn label", 480, 700);
    ctx.font = "60px sans-serif";
    ctx.fillText("Forest green / wool / 120 yards", 480, 900);
    return c.toDataURL("image/png");
  }, color);
  return {
    name: "yarn-screenshot.png",
    mimeType: "image/png",
    buffer: Buffer.from(data.split(",")[1], "base64"),
  };
}
test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
});

test("a purchased yarn photo is resized locally, shown on the card, and retained in backups", async ({
  page,
}) => {
  await stash(page);
  await page
    .getByRole("button", { name: "Record a purchase", exact: true })
    .click();
  await page.getByLabel("Yarn purchased", { exact: true }).fill("Photo wool");
  await page.getByLabel("Color name", { exact: true }).fill("Forest green");
  await page
    .getByLabel("Yarn weight", { exact: true })
    .selectOption("4 · Medium");
  await page
    .getByLabel("Upload yarn photo or screenshot", { exact: true })
    .setInputFiles(await picture(page));
  await expect(
    page.getByRole("img", { name: "Selected yarn photo", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Yards purchased", { exact: true }).fill("120");
  await page
    .getByLabel("Purchase status", { exact: true })
    .selectOption("awaiting");
  await page
    .getByRole("button", { name: "Record purchase", exact: true })
    .click();
  const yarn = (await snapshot(page)).yarn.at(-1);
  expect(yarn.photo).toMatch(/^data:image\/jpeg;base64,/);
  expect(yarn.photo.length).toBeLessThanOrEqual(900000);
  expect(yarn.yards).toBe(0);
  const image = card(page, "Forest green").getByRole("img", {
    name: "Photo wool — Forest green",
    exact: true,
  });
  await expect(image).toBeVisible();
  expect(await image.evaluate((img) => img.naturalWidth)).toBe(1200);
  await page.reload();
  await stash(page);
  await expect(
    card(page, "Forest green").getByRole("img", {
      name: "Photo wool — Forest green",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Studio settings", exact: true })
    .click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export studio backup" }).click();
  const downloaded = await event;
  let json = "";
  for await (const chunk of await downloaded.createReadStream()) json += chunk;
  expect(JSON.parse(json).yarn.at(-1).photo).toBe(yarn.photo);
  await page.getByLabel("Restore a backup", { exact: true }).setInputFiles({
    name: "photos.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await page
    .getByRole("button", { name: "Replace studio with this backup" })
    .click();
  expect((await snapshot(page)).yarn.at(-1).photo).toBe(yarn.photo);
  expect((await snapshot(page)).yarn.at(-1).yards).toBe(0);
});

test("existing yarn photos can be replaced or removed without altering stock; invalid images preserve them", async ({
  page,
}) => {
  await stash(page);
  await page
    .getByRole("button", { name: "Edit Sage meadow", exact: true })
    .click();
  await expect(
    page.getByLabel("Take a yarn photo", { exact: true }),
  ).toHaveAttribute("capture", "environment");
  await page
    .getByLabel("Take a yarn photo", { exact: true })
    .setInputFiles(await picture(page));
  await expect(
    page.getByRole("img", { name: "Selected yarn photo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const original = (await snapshot(page)).yarn.find((y) => y.id === "y2");
  expect(original.yards).toBe(280);
  await page
    .getByRole("button", { name: "Shopping list", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("img", { name: "Soft & cozy — Sage meadow", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Edit Sage meadow", exact: true })
    .click();
  await page
    .getByLabel("Upload yarn photo or screenshot", { exact: true })
    .setInputFiles({
      name: "bad.png",
      mimeType: "image/png",
      buffer: Buffer.from("not a picture"),
    });
  await expect(page.getByRole("alert")).toContainText("could not be opened");
  await expect(
    page.getByRole("img", { name: "Selected yarn photo", exact: true }),
  ).toHaveAttribute("src", original.photo);
  await page
    .getByLabel("Upload yarn photo or screenshot", { exact: true })
    .setInputFiles(await picture(page, "#bd7859"));
  await expect(
    page.getByRole("img", { name: "Selected yarn photo", exact: true }),
  ).not.toHaveAttribute("src", original.photo);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const changed = (await snapshot(page)).yarn.find((y) => y.id === "y2");
  expect(changed.yards).toBe(280);
  expect(changed.photo).not.toBe(original.photo);
  await page
    .getByRole("button", { name: "Edit Sage meadow", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  expect((await snapshot(page)).yarn.find((y) => y.id === "y2").photo).toBe(
    changed.photo,
  );
  await page
    .getByRole("button", { name: "Edit Sage meadow", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    card(page, "Sage meadow").getByRole("img", {
      name: "Soft & cozy — Sage meadow",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await snapshot(page)).yarn.find((y) => y.id === "y2").yards).toBe(
    280,
  );
});

test("adding owned yarn supports a screenshot and fits on mobile", async ({
  page,
}) => {
  await stash(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Add yarn", exact: true })
    .first()
    .click();
  await page.getByLabel("Yarn name", { exact: true }).fill("Cotton photo");
  await page.getByLabel("Color name", { exact: true }).fill("Green label");
  await page.getByLabel("Fiber", { exact: true }).fill("Cotton");
  await page
    .getByLabel("Upload yarn photo or screenshot", { exact: true })
    .setInputFiles(await picture(page));
  await expect(
    page.getByRole("img", { name: "Selected yarn photo", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((d) => d.scrollWidth <= d.clientWidth),
  ).toBe(true);
  await page.getByRole("dialog").evaluate((d) => {
    d.scrollTop = 0;
  });
  await page
    .getByRole("dialog")
    .screenshot({ path: test.info().outputPath("mobile-yarn-photo.png") });
  await page
    .getByRole("button", { name: "Add yarn", exact: true })
    .last()
    .click();
  await expect(
    card(page, "Green label").getByRole("img", {
      name: "Cotton photo — Green label",
      exact: true,
    }),
  ).toBeVisible();
});
