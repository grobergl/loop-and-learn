import test from "node:test";
import assert from "node:assert/strict";
import { initialState, patterns } from "../src/data.js";
import {
  reserved,
  available,
  shortages,
  canMake,
  finishProject,
} from "../src/model.js";
test("active projects reserve yarn once; shortages aggregate by yarn", () => {
  const s = initialState();
  assert.equal(reserved(s, "y2"), 350);
  assert.equal(available(s, "y2"), -70);
  assert.equal(shortages(s)[0].short, 70);
  s.projects.push({ ...s.projects[1], id: "p3", yards: 100 });
  assert.equal(shortages(s)[0].short, 170);
  assert.equal(shortages(s).length, 1);
});
test("ready patterns require enough unreserved yarn of matching weight", () => {
  const s = initialState();
  assert.equal(canMake(s, patterns[0]), true);
  assert.equal(canMake(s, patterns[1]), false);
  s.yarn = s.yarn.map((y) => ({ ...y, weight: "3 · Light" }));
  assert.equal(canMake(s, patterns[0]), false);
});
test("finishing deducts actual usage and releases estimate without changing input", () => {
  const s = initialState(),
    next = finishProject(s, "p1", 25);
  assert.equal(next.yarn[0].yards, 135);
  assert.equal(reserved(next, "y1"), 0);
  assert.equal(available(next, "y1"), 135);
  assert.equal(next.projects[0].actualYards, 25);
  assert.equal(next.projects[0].status, "completed");
  assert.equal(s.yarn[0].yards, 160);
  assert.throws(() => finishProject(next, "p1", 25));
});
test("finish rejects invalid usage and cannot spend stock twice", () => {
  for (const n of [-1, NaN, Infinity, 161])
    assert.throws(() => finishProject(initialState(), "p1", n));
});
test("canceling releases reservation without consuming yarn", () => {
  const s = initialState();
  s.projects = s.projects.filter((p) => p.id !== "p2");
  assert.equal(shortages(s).length, 0);
  assert.equal(available(s, "y2"), 280);
});
test("remaining projects can become short after actual use exceeds estimate", () => {
  const s = initialState();
  s.projects.push({ ...s.projects[0], id: "p3", yards: 120 });
  const next = finishProject(s, "p1", 50);
  assert.equal(reserved(next, "y1"), 120);
  assert.equal(shortages(next).find((y) => y.id === "y1").short, 10);
});
