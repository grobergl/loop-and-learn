import { test, expect } from "@playwright/test";
const go = async (page, name) =>
  page.getByRole("navigation").getByRole("button", { name }).click();
const snapshot = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("loop-and-learn.v1")));
test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:5173");
});
test("paste, organize and edit a multi-color project; require progress reset and preserve the library", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Paste my pattern/ }).click();
  await page
    .getByRole("textbox", { name: "Pattern name", exact: true })
    .fill("My little frog");
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Round 1: 6 sc into a magic ring. (6)\nRounds 2–3: sc around. (6)");
  await expect(
    page.getByText("3 checkable rounds", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await page
    .getByRole("textbox", { name: "Give your project a name" })
    .fill("Frog for a friend");
  await page
    .getByRole("spinbutton", { name: "Color 1 estimated yards" })
    .fill("30");
  await page
    .getByRole("combobox", { name: "Color 1 yarn", exact: true })
    .selectOption("y1");
  await page.getByRole("button", { name: "Add another color" }).click();
  await page.getByRole("textbox", { name: "Color 2 role" }).fill("Belly");
  await page
    .getByRole("spinbutton", { name: "Color 2 estimated yards" })
    .fill("40");
  await page
    .getByRole("combobox", { name: "Color 2 yarn", exact: true })
    .selectOption("y3");
  await page.getByRole("button", { name: "Start my project" }).click();
  await expect(
    page.getByRole("heading", { name: "Frog for a friend", exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await page.reload();
  await go(page, "My projects");
  await page.getByRole("button", { name: /Frog for a friend/ }).click();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.getByRole("button", { name: "Edit project" }).click();
  await page
    .getByText("Edit this project’s pattern instructions", { exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Round 1: 6 sc.\nRound 2: Increase.");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Confirm resetting checked",
  );
  await page
    .getByRole("checkbox", {
      name: "Reset checked rows or rounds for these revised instructions",
    })
    .check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const s = await snapshot(page),
    p = s.projects.find((p) => p.name === "Frog for a friend");
  expect(p.pattern.instructions).toHaveLength(2);
  expect(p.done).toHaveLength(0);
  expect(s.customPatterns[0].instructions).toHaveLength(3);
  expect(p.materials.map((m) => m.yarnId)).toEqual(["y1", "y3"]);
  for (const c of await page.getByRole("checkbox").all()) await c.check();
  await page.getByRole("button", { name: "Finish project" }).click();
  await page.getByRole("spinbutton").nth(0).fill("25");
  await page.getByRole("spinbutton").nth(1).fill("35");
  await page.getByRole("button", { name: "Confirm and finish" }).click();
  const done = await snapshot(page);
  expect(done.yarn.find((y) => y.id === "y1").yards).toBe(135);
  expect(done.yarn.find((y) => y.id === "y3").yards).toBe(85);
});
test("profile accepts unfinished-project habits, optional supplies and UK-first terms", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Set up my crochet profile" }).click();
  await page
    .getByRole("textbox", { name: "Your name or studio name" })
    .fill("Morgan");
  await page
    .getByRole("checkbox", {
      name: "I’ve started a few things and haven’t finished yet",
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "I start or make one or more projects most weeks",
    })
    .check();
  await page
    .getByRole("combobox", { name: "What have you explored so far?" })
    .selectOption("complex");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: /Explore texture and advanced stitches/ })
    .click();
  for (const select of await page
    .getByRole("dialog")
    .getByRole("combobox")
    .all())
    await select.selectOption("Mastered");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByText("Suggested starting level: Advanced", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Show terminology first" })
    .selectOption("UK");
  await page.getByRole("checkbox", { name: "Plushies", exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Skip supplies for now" }).click();
  const s = await snapshot(page);
  expect(s.profile.habits).toHaveLength(2);
  expect(s.profile.level).toBe("Advanced");
  expect(s.profile.hooks).toEqual([]);
  expect(s.profile.terminology).toBe("UK");
  await go(page, "My projects");
  await page.getByRole("button", { name: /Coasters for my corner/ }).click();
  await expect(page.locator(".round-text").first()).toContainText(
    "6 dc into a magic ring.",
  );
  await expect(page.locator(".source-terms").first()).toContainText(
    "US original: 6 sc",
  );
});
test("picture reference can become an editable project without claiming AI is connected", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Start from a picture/ }).click();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Reference picture", { exact: false })
    .setInputFiles({ name: "frog.png", mimeType: "image/png", buffer: png });
  await page
    .getByRole("textbox", { name: "Describe your project" })
    .fill("A small green frog");
  await expect(
    page.getByRole("button", { name: "Generate an AI draft" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Continue with my own instructions" })
    .click();
  await page
    .getByRole("textbox", { name: "Pattern name", exact: true })
    .fill("Photo frog");
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Round 1: 6 sc into a ring.");
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await page.getByRole("button", { name: "Start my project" }).click();
  const s = await snapshot(page),
    p = s.projects.find((p) => p.name === "Photo frog");
  expect(p.referenceImage).toContain("data:image/png;base64,");
  expect(p.idea).toBe("A small green frog");
  expect(p.pattern.source).toBe("photo");
  await expect(
    page.getByRole("img", { name: "Reference for Photo frog" }),
  ).toBeVisible();
});
test("idea path, inline new yarn and assignment change update the linked stock record", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Describe an idea/ }).click();
  await page
    .getByRole("textbox", { name: "Describe your project" })
    .fill("A striped mug cozy");
  await page
    .getByRole("button", { name: "Continue with my own instructions" })
    .click();
  await page
    .getByRole("textbox", { name: "Pattern name", exact: true })
    .fill("Mug cozy");
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Row 1: Sc across.\nRow 2: Sc across.");
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await page.getByRole("button", { name: "Add new yarn here" }).click();
  await page
    .getByRole("textbox", { name: "New yarn name", exact: true })
    .fill("New cotton");
  await page
    .getByRole("textbox", { name: "New yarn color", exact: true })
    .fill("Sky blue");
  await page.getByRole("button", { name: "Add yarn and select it" }).click();
  await page.getByRole("button", { name: "Start my project" }).click();
  let s = await snapshot(page);
  const y = s.yarn.find((y) => y.color === "Sky blue");
  expect(s.projects.at(-1).materials[0].yarnId).toBe(y.id);
  await page.getByRole("button", { name: "Edit project" }).click();
  await page
    .getByRole("combobox", { name: "Color 1 yarn", exact: true })
    .selectOption("y3");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  s = await snapshot(page);
  expect(s.projects.at(-1).materials[0].yarnId).toBe("y3");
  expect(s.yarn.find((x) => x.id === y.id).yards).toBe(100);
});
test("mobile creation and setup fit without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "New project", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Paste my pattern/ }).click();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Set up my crochet profile" }).click();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
});
test("connected drafting UI uses the server response and preserves input on a failed request (mock server)", async ({
  page,
}) => {
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { aiReady: true } }),
  );
  let calls = 0;
  await page.route("**/api/generate", (r) => {
    calls++;
    return calls === 1
      ? r.fulfill({
          status: 502,
          json: { error: "Draft service unavailable; try again." },
        })
      : r.fulfill({
          json: {
            pattern: {
              name: "A drafted owl",
              category: "Plushies",
              level: "Intermediate",
              yards: 75,
              weight: "4 · Medium",
              hook: "3.5 mm",
              unit: "round",
              terminology: "US",
              setup: "Untested draft.",
              finish: "Close the opening.",
              stitches: ["sc"],
              instructions: [{ text: "6 sc into a ring.", count: 6 }],
            },
          },
        });
  });
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Describe an idea/ }).click();
  await page
    .getByRole("textbox", { name: "Describe your project" })
    .fill("An owl");
  await expect(
    page.getByRole("button", { name: "Generate an AI draft" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Generate an AI draft" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Draft service unavailable",
  );
  await expect(
    page.getByRole("textbox", { name: "Describe your project" }),
  ).toHaveValue("An owl");
  await page.getByRole("button", { name: "Generate an AI draft" }).click();
  await expect(
    page.getByRole("textbox", { name: "Pattern name", exact: true }),
  ).toHaveValue("A drafted owl");
  await expect(
    page.getByRole("textbox", { name: "Pattern instructions", exact: true }),
  ).toHaveValue("6 sc into a ring.");
  await expect(
    page.getByText("AI draft: not test-crocheted.", { exact: false }),
  ).toBeVisible();
});
test("old backup restoration keeps the existing projects and upgrades the saved format", async ({
  page,
}) => {
  const old = await snapshot(page);
  old.version = 1;
  delete old.profile;
  delete old.customPatterns;
  old.maker = "Returning Maker";
  await page
    .getByRole("button", { name: "Studio settings", exact: true })
    .click();
  await page.locator(".backup-import input[type=file]").setInputFiles({
    name: "old-studio.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(old)),
  });
  await page
    .getByRole("button", { name: "Replace studio with this backup" })
    .click();
  const restored = await snapshot(page);
  expect(restored.version).toBe(2);
  expect(restored.maker).toBe("Returning Maker");
  expect(restored.projects).toEqual(old.projects);
  expect(restored.yarn).toEqual(old.yarn);
});
test("project list, open project, and pattern library all offer project creation", async ({
  page,
}) => {
  await go(page, "My projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: /Paste my pattern/ }).click();
  await page
    .getByRole("textbox", { name: "Pattern name", exact: true })
    .fill("Created from projects");
  await page
    .getByRole("textbox", { name: "Pattern instructions", exact: true })
    .fill("Round 1: 6 sc in a ring.");
  await page
    .getByRole("button", { name: "Choose colors and materials" })
    .click();
  await page.getByRole("button", { name: "Start my project" }).click();
  await expect(
    page.getByRole("heading", { name: "Created from projects", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  for (const name of [
    /Choose a pattern/,
    /Paste my pattern/,
    /Describe an idea/,
    /Start from a picture/,
  ])
    await expect(
      page.getByRole("dialog").getByRole("button", { name }),
    ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await go(page, "Patterns");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /Paste my pattern/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await go(page, "My projects");
  await page.getByRole("button", { name: /Created from projects/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Start from a picture/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
