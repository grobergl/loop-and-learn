import test from "node:test";
import assert from "node:assert/strict";
import { initialState, patterns } from "../src/data.js";
import {
  reserved,
  available,
  shortages,
  finishProject,
  canMake,
} from "../src/model.js";
import {
  parseInstructions,
  translateTerms,
  upgradeState,
  validateBackup,
  projectPattern,
  suggestedLevel,
} from "../src/project.js";
import { generatePattern } from "../src/ai-service.js";
const multi = () => {
  const s = initialState();
  s.projects = [
    {
      ...s.projects[0],
      materials: [
        { id: "a", role: "Body", yarnId: "y1", yards: 70 },
        { id: "b", role: "Wings", yarnId: "y1", yards: 80 },
      ],
    },
  ];
  return s;
};
test("multiple color roles sharing yarn aggregate reservations and actual use", () => {
  const s = multi();
  assert.equal(reserved(s, "y1"), 150);
  assert.equal(available(s, "y1"), 10);
  assert.throws(() => finishProject(s, "p1", { a: 100, b: 100 }));
  assert.equal(s.yarn[0].yards, 160);
  const next = finishProject(s, "p1", { a: 50, b: 60 });
  assert.equal(next.yarn[0].yards, 50);
  assert.equal(reserved(next, "y1"), 0);
  assert.equal(next.projects[0].actualYards, 110);
});
test("unassigned colors become shopping needs and cannot consume missing stock", () => {
  const s = multi();
  s.projects[0].materials.push({
    id: "c",
    role: "Trim",
    yarnId: null,
    yards: 20,
  });
  assert.equal(shortages(s)[0].short, 20);
  assert.throws(() => finishProject(s, "p1", { a: 1, b: 1, c: 5 }));
});
test("parser handles markdown, labels, repeated ranges, and does not invent stitch counts", () => {
  const rows = parseInstructions(
    "# My pattern\n- [ ] Round 1: 6 sc (6)\nRounds 2–4: sc around\n\n5. fasten off",
  );
  assert.equal(rows.length, 5);
  assert.equal(rows[0].count, 6);
  assert.equal(rows[1].count, null);
  assert.equal(rows[4].text, "fasten off");
  assert.throws(() => parseInstructions("Rounds 1-600: sc around"));
});
test("US and UK conversion replaces whole terms once and preserves other words", () => {
  assert.equal(
    translateTerms(
      "sc, hdc, dc; single crochet and half double crochet.",
      "US",
      "UK",
    ),
    "dc, htr, tr; double crochet and half treble crochet.",
  );
  assert.equal(translateTerms("dc, htr, tr", "UK", "US"), "sc, hdc, dc");
  assert.equal(
    translateTerms("scissors and scarf", "US", "UK"),
    "scissors and scarf",
  );
});
test("old backups upgrade without losing data; revised instructions belong to one project", () => {
  const s = initialState();
  assert.equal(validateBackup(s), true);
  const n = upgradeState(s);
  assert.equal(n.version, 2);
  assert.deepEqual(n.projects, s.projects);
  n.projects[0] = {
    ...n.projects[0],
    pattern: {
      ...patterns[0],
      instructions: [{ text: "Custom instruction", count: null }],
    },
    done: [],
  };
  assert.equal(validateBackup(n), true);
  assert.equal(projectPattern(n, n.projects[0]).instructions.length, 1);
  assert.equal(patterns[0].instructions.length, 8);
});
test("frequency and years alone do not assign an advanced skill level", () => {
  assert.equal(
    suggestedLevel(
      { background: "complex", habits: ["every day"], experience: "20 years" },
      {},
    ),
    "Beginner",
  );
  const skills = Object.fromEntries(
    [
      "ch",
      "sc",
      "sl",
      "hdc",
      "dc",
      "mr",
      "inc",
      "dec",
      "blo",
      "bobble",
      "shell",
    ].map((s) => [s, "Mastered"]),
  );
  assert.equal(suggestedLevel({ background: "complex" }, skills), "Advanced");
});
test("multi-color pattern readiness does not spend the same stock twice", () => {
  const s = initialState();
  s.yarn = [{ ...s.yarn[0], yards: 100 }];
  s.projects = [];
  assert.equal(
    canMake(s, {
      weight: "4 · Medium",
      requirements: [{ yards: 60 }, { yards: 60 }],
    }),
    false,
  );
});
test("AI service reports missing connection without calling a provider", async () => {
  await assert.rejects(
    () =>
      generatePattern(
        { idea: "frog" },
        {
          fetchImpl: () => {
            throw Error("must not run");
          },
        },
      ),
    /not connected/,
  );
});
test("AI adapter sends a reference image and validates a structured draft (mock provider)", async () => {
  let sent;
  const draft = { ...patterns[0], terminology: "US" };
  const result = await generatePattern(
    {
      idea: "a round coaster",
      image: "data:image/png;base64,aGVsbG8=",
      terminology: "US",
    },
    {
      apiKey: "test-only",
      fetchImpl: async (url, opts) => {
        sent = JSON.parse(opts.body);
        assert.equal(url, "https://api.openai.com/v1/responses");
        return {
          ok: true,
          json: async () => ({
            output: [
              {
                content: [{ type: "output_text", text: JSON.stringify(draft) }],
              },
            ],
          }),
        };
      },
    },
  );
  assert.equal(sent.input[0].content[1].type, "input_image");
  assert.equal(sent.text.format.strict, true);
  assert.equal(result.name, draft.name);
});
