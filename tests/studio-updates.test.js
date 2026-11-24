import test from "node:test";
import assert from "node:assert/strict";
import { categoryVisual } from "../src/categories.js";
import { stitches, initialState } from "../src/data.js";
import { libraryIds, detectStitches } from "../src/stitch-library.js";
import {
  upgradeState,
  validateBackup,
  suggestedLevel,
} from "../src/project.js";
import {
  importPatternReply,
  patternReplyRequest,
} from "../src/pattern-import.js";
const reply =
  "# Tiny shell cushion\n## Pattern details\nCategory: Home\nDifficulty: Intermediate\nTerminology: US\nHook size: 4 mm\nYarn weight: 4 Medium\nWork in: rounds\n## Materials\n- Main color: 80 yards\n- Contrast: 20 yards\n- Stuffing\n## Notes\nUntested draft; check gauge.\n## Instructions\nRound 1: 6 sc in a ring. (6)\nRounds 2–3: Work a shell as described.\n## Finishing\nStuff and sew closed.";
test("five category icons are fixed and unknown categories use Other", () => {
  assert.equal(categoryVisual("Clothing").icon, "Shirt");
  assert.equal(categoryVisual("Plushies").icon, "Rabbit");
  assert.equal(categoryVisual("Unknown").icon, "Shapes");
});
test("catalogue includes textured techniques and a project expands the personal library without mastery", () => {
  assert.equal(stitches.length, 24);
  assert.ok(stitches.some((s) => s.id === "bobble"));
  const s = initialState();
  assert.equal(libraryIds(s).includes("shell"), false);
  s.projects.push({ pattern: { stitches: ["shell", "bobble"] } });
  assert.equal(libraryIds(s).includes("shell"), true);
  assert.equal(s.skills.shell, undefined);
});
test("text detection recognizes common stitches without matching parts of words", () => {
  assert.deepEqual(
    detectStitches("Make bobble stitches and a shell border. Use sc."),
    ["sc", "bobble", "shell"],
  );
  assert.equal(detectStitches("scissors and scarf").includes("sc"), false);
  assert.ok(detectStitches("htr in each stitch", "UK").includes("hdc"));
});
test("whole response import separates rounds from materials, notes and assembly", () => {
  const r = importPatternReply(reply);
  assert.equal(r.patch.name, "Tiny shell cushion");
  assert.equal(r.instructions.length, 3);
  assert.equal(r.patch.yards, 100);
  assert.equal(r.patch.requirements.length, 2);
  assert.ok(r.patch.setup.includes("Stuffing"));
  assert.ok(r.patch.setup.includes("Untested"));
  assert.equal(r.patch.finish, "Stuff and sew closed.");
  assert.equal(r.patch.hook, "4 mm");
  assert.equal(r.patch.weight, "4 · Medium");
  assert.ok(!r.text.includes("80 yards"));
  assert.ok(!r.text.includes("sew closed"));
});
test("failed whole-response import does not guess paragraphs are numbered instructions", () => {
  assert.throws(
    () => importPatternReply("Materials: yarn\nSome assumptions about size"),
    /could not find/,
  );
});
test("prompt and importer agree on section headings and total yardage", () => {
  const prompt = patternReplyRequest({
    idea: "owl",
    level: "Intermediate",
    terminology: "UK",
    photo: true,
  });
  for (const heading of ["## Materials", "## Instructions", "## Finishing"])
    assert.ok(prompt.includes(heading));
  assert.ok(prompt.includes("not yards per inch"));
});
test("upgrades preserve old personal records while expanding supported guide IDs", () => {
  const s = initialState();
  s.skills.bobble = "Learning";
  const next = upgradeState(s);
  assert.ok(next.skillLibraryIds.includes("bobble"));
  assert.ok(validateBackup(next));
  assert.deepEqual(next.projects, s.projects);
});
test("a suggested advanced level includes texture familiarity and can remain user-overridden", () => {
  const skills = Object.fromEntries(
    stitches.slice(0, 9).map((s) => [s.id, "Mastered"]),
  );
  assert.equal(
    suggestedLevel({ background: "complex" }, skills),
    "Intermediate",
  );
  skills.bobble = "Mastered";
  skills.shell = "Mastered";
  assert.equal(suggestedLevel({ background: "complex" }, skills), "Advanced");
});
