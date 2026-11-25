import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/data.js";
import { upgradeState, validateBackup } from "../src/project.js";
import { reserved, shortages } from "../src/model.js";
import {
  recordPurchase,
  receivePurchase,
  updateDelivery,
  pendingYards,
  deliveryDue,
  validDay,
  nextDay,
  purchaseQuantity,
} from "../src/purchases.js";

const today = "2026-11-25";
const purchase = (overrides = {}) => ({
  id: "buy-1",
  yarnId: "y2",
  yards: 100,
  status: "awaiting",
  purchasedOn: "2026-11-20",
  expectedOn: today,
  receivedOn: null,
  remindAfter: null,
  skeins: 1,
  store: "Local yarn shop",
  notes: "Order 42",
  ...overrides,
});

const newYarn = () => ({
  id: "new-yarn",
  name: "Mountain merino",
  color: "Forest green",
  fiber: "Wool",
  weight: "4 · Medium",
  hex: "#31593e",
  yards: 0,
});

const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";

test("yarn photos survive old-studio upgrade, new purchases, and backup restore without changing stock", () => {
  const old = initialState();
  old.yarn[0].photo = photo;
  const restored = upgradeState(JSON.parse(JSON.stringify(old)));
  assert.equal(validateBackup(restored), true);
  assert.equal(restored.yarn[0].photo, photo);
  assert.equal(restored.yarn[0].yards, 160);
  const yarn = { ...newYarn(), photo };
  const saved = recordPurchase(
    restored,
    purchase({ yarnId: yarn.id }),
    today,
    yarn,
  );
  assert.equal(saved.yarn.at(-1).photo, photo);
  assert.equal(saved.yarn.at(-1).yards, 0);
  const received = receivePurchase(saved, "buy-1", today, today);
  assert.equal(received.yarn.at(-1).photo, photo);
  assert.equal(received.yarn.at(-1).yards, 100);
  assert.equal(validateBackup(JSON.parse(JSON.stringify(received))), true);
});

test("unsupported or oversized photo data cannot enter yarn purchases or backups", () => {
  const original = initialState();
  for (const invalid of [
    "https://example.com/yarn.jpg",
    "data:image/svg+xml;base64,AAAA",
    "data:image/png;base64,@@@",
    "data:image/png;base64," + "A".repeat(900000),
    {},
  ]) {
    const s = structuredClone(original);
    s.yarn[0].photo = invalid;
    assert.equal(validateBackup(s), false);
    assert.throws(() =>
      recordPurchase(original, purchase({ yarnId: "new-yarn" }), today, {
        ...newYarn(),
        photo: invalid,
      }),
    );
  }
  assert.equal(original.yarn.length, 4);
});

test("new yarn and purchase save together, received or awaiting, without duplicate stock", () => {
  const original = initialState();
  for (const status of ["received", "awaiting"]) {
    const yarn = newYarn();
    const p = purchase({
      yarnId: yarn.id,
      status,
      receivedOn: status === "received" ? today : null,
    });
    const saved = recordPurchase(original, p, today, yarn);
    assert.equal(saved.yarn.length, original.yarn.length + 1);
    assert.equal(saved.yarn.at(-1).yards, status === "received" ? 100 : 0);
    assert.equal(saved.purchases[0].yarnId, yarn.id);
    assert.equal(validateBackup(saved), true);
    assert.strictEqual(recordPurchase(saved, p, today, yarn), saved);
    const done = receivePurchase(saved, p.id, today, today);
    assert.equal(done.yarn.at(-1).yards, 100);
    assert.equal(done.yarn.length, saved.yarn.length);
  }
  assert.equal(original.yarn.length, 4);
  assert.equal(original.purchases, undefined);
});

test("invalid purchase or new yarn cannot leave an orphan yarn record", () => {
  const original = initialState();
  const before = structuredClone(original);
  for (const fields of [
    { name: " " },
    { color: "" },
    { weight: "unknown" },
    { yards: 50 },
    { id: "y1" },
  ]) {
    const yarn = { ...newYarn(), ...fields };
    assert.throws(() =>
      recordPurchase(original, purchase({ yarnId: yarn.id }), today, yarn),
    );
  }
  assert.throws(() =>
    recordPurchase(
      original,
      purchase({ yarnId: "new-yarn", yards: -1 }),
      today,
      newYarn(),
    ),
  );
  assert.deepEqual(original, before);
});

test("skein purchases require label yardage, convert exactly, and preserve old history", () => {
  const quantity = purchaseQuantity({
    unit: "skeins",
    skeins: 3,
    yardsPerSkein: 120,
  });
  assert.equal(quantity.yards, 360);
  const saved = recordPurchase(
    initialState(),
    purchase({ ...quantity, status: "received", receivedOn: today }),
    today,
  );
  assert.equal(saved.yarn[1].yards, 640);
  assert.equal(validateBackup(saved), true);
  assert.deepEqual(
    upgradeState(JSON.parse(JSON.stringify(saved))),
    upgradeState(saved),
  );
  assert.equal(validateBackup({ ...saved, purchases: [purchase()] }), true);
  assert.equal(
    validateBackup({
      ...saved,
      purchases: [{ ...saved.purchases[0], yards: 359 }],
    }),
    false,
  );
  assert.equal(purchaseQuantity({ unit: "yards", yards: 50 }).yards, 50);
  for (const fields of [
    { skeins: 0 },
    { yardsPerSkein: 0 },
    { yardsPerSkein: NaN },
    { skeins: 1.5 },
    { yardsPerSkein: Number.MAX_SAFE_INTEGER },
  ])
    assert.throws(() =>
      purchaseQuantity({
        unit: "skeins",
        skeins: 3,
        yardsPerSkein: 120,
        ...fields,
      }),
    );
});

test("awaiting purchase preserves stock, reservations, and shortages; receipt updates once", () => {
  const old = initialState();
  const before = structuredClone(old);
  const waiting = recordPurchase(old, purchase(), today);
  assert.equal(waiting.yarn[1].yards, 280);
  assert.equal(reserved(waiting, "y2"), 350);
  assert.equal(shortages(waiting).find((y) => y.id === "y2").short, 70);
  assert.equal(pendingYards(waiting, "y2"), 100);
  const received = receivePurchase(waiting, "buy-1", today, today);
  assert.equal(received.yarn[1].yards, 380);
  assert.equal(received.yarn[0].yards, 160);
  assert.equal(reserved(received, "y2"), 350);
  assert.equal(shortages(received).length, 0);
  assert.equal(pendingYards(received, "y2"), 0);
  assert.equal(received.purchases[0].receivedOn, today);
  assert.strictEqual(
    receivePurchase(received, "buy-1", today, today),
    received,
  );
  assert.deepEqual(old, before);
});

test("already-received purchases add stock immediately; repeated commands never add twice", () => {
  const p = purchase({
    status: "received",
    receivedOn: today,
    expectedOn: null,
  });
  const next = recordPurchase(initialState(), p, today);
  assert.equal(next.yarn[1].yards, 380);
  assert.strictEqual(recordPurchase(next, p, today), next);
  assert.equal(next.purchases.length, 1);
  assert.equal(validateBackup(next), true);
});

test("purchase commands reject invalid quantities, linked yarn, dates, and overflow", () => {
  for (const value of [
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    "10",
    Number.MAX_SAFE_INTEGER,
  ]) {
    assert.throws(() =>
      recordPurchase(initialState(), purchase({ yards: value }), today),
    );
  }
  for (const fields of [
    { yarnId: "missing" },
    { purchasedOn: "2026-02-30" },
    { purchasedOn: "2026-11-26" },
    { expectedOn: "2026-11-19" },
    { status: "received", receivedOn: null },
    { status: "received", receivedOn: "2026-11-19" },
    { status: "received", receivedOn: "2026-11-26" },
    { skeins: 0 },
    { notes: "x".repeat(2001) },
  ])
    assert.throws(() =>
      recordPurchase(initialState(), purchase(fields), today),
    );
  const waiting = recordPurchase(initialState(), purchase(), today);
  assert.throws(() => receivePurchase(waiting, "missing", today, today));
  for (const date of ["2026-11-19", "2026-11-26", "2026-02-30"])
    assert.throws(() => receivePurchase(waiting, "buy-1", date, today));
  assert.equal(waiting.yarn[1].yards, 280);
  assert.equal(waiting.purchases[0].status, "awaiting");
});

test("arrival reminders use calendar dates and never receive purchases automatically", () => {
  const waiting = recordPurchase(initialState(), purchase(), today);
  assert.equal(deliveryDue(waiting.purchases[0], "2026-11-24"), false);
  assert.equal(deliveryDue(waiting.purchases[0], today), true);
  const snoozed = updateDelivery(waiting, "buy-1", today, nextDay(today));
  assert.equal(deliveryDue(snoozed.purchases[0], today), false);
  assert.equal(deliveryDue(snoozed.purchases[0], "2026-11-26"), true);
  const rescheduled = updateDelivery(snoozed, "buy-1", "2026-11-30");
  assert.equal(deliveryDue(rescheduled.purchases[0], "2026-11-26"), false);
  const undated = updateDelivery(rescheduled, "buy-1", null);
  assert.equal(deliveryDue(undated.purchases[0], "2027-01-01"), false);
  assert.equal(undated.yarn[1].yards, 280);
  assert.equal(undated.purchases[0].status, "awaiting");
  assert.throws(() => updateDelivery(waiting, "buy-1", "2026-11-19"));
  assert.equal(validDay("2024-02-29"), true);
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(nextDay("2026-12-31"), "2027-01-01");
});

test("old backups gain empty history, and purchase backups round-trip without crediting stock again", () => {
  const old = initialState();
  assert.equal(validateBackup(old), true);
  const upgraded = upgradeState(old);
  assert.deepEqual(upgraded.purchases, []);
  assert.deepEqual(upgraded.yarn, old.yarn);
  const waiting = recordPurchase(upgraded, purchase(), today);
  const received = receivePurchase(waiting, "buy-1", today, today);
  const restored = upgradeState(JSON.parse(JSON.stringify(received)));
  assert.equal(validateBackup(restored), true);
  assert.deepEqual(restored, received);
  assert.strictEqual(
    receivePurchase(restored, "buy-1", today, today),
    restored,
  );
  for (const purchases of [
    null,
    {},
    [purchase(), purchase()],
    [purchase({ yarnId: "gone" })],
    [purchase({ yards: -1 })],
  ]) {
    assert.equal(validateBackup({ ...upgraded, purchases }), false);
  }
});
