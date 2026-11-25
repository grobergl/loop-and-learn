// Purchase rules run in the browser. They are not a shared-stock security boundary.
import { validNewYarn } from "./yarn.js";

export function purchaseQuantity({
  unit,
  yards,
  skeins = null,
  yardsPerSkein,
}) {
  if (!["yards", "skeins"].includes(unit))
    throw Error("Choose yards or skeins for your purchase.");
  if (unit === "skeins") {
    if (
      !Number.isSafeInteger(skeins) ||
      skeins <= 0 ||
      !Number.isSafeInteger(yardsPerSkein) ||
      yardsPerSkein <= 0 ||
      !Number.isSafeInteger(skeins * yardsPerSkein)
    )
      throw Error(
        "Enter a positive whole skein count and yards per skein from the label.",
      );
    return {
      yards: skeins * yardsPerSkein,
      skeins,
      yardsPerSkein,
      quantityUnit: "skeins",
    };
  }
  if (
    !Number.isSafeInteger(yards) ||
    yards <= 0 ||
    (skeins !== null && (!Number.isSafeInteger(skeins) || skeins <= 0))
  )
    throw Error(
      "Enter positive whole yards and, if provided, a positive whole skein count.",
    );
  return { yards, skeins, yardsPerSkein: null, quantityUnit: "yards" };
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function nextDay(day) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function validPurchase(p, yarn) {
  return !!(
    p &&
    typeof p.id === "string" &&
    p.id.trim() &&
    yarn.some((y) => y.id === p.yarnId) &&
    Number.isSafeInteger(p.yards) &&
    p.yards > 0 &&
    ["awaiting", "received"].includes(p.status) &&
    validDay(p.purchasedOn) &&
    (p.expectedOn === null ||
      (validDay(p.expectedOn) && p.expectedOn >= p.purchasedOn)) &&
    (p.remindAfter === null || validDay(p.remindAfter)) &&
    (p.status === "received"
      ? validDay(p.receivedOn) && p.receivedOn >= p.purchasedOn
      : p.receivedOn === null) &&
    (p.skeins === null || (Number.isSafeInteger(p.skeins) && p.skeins > 0)) &&
    (p.quantityUnit === undefined ||
      ["yards", "skeins"].includes(p.quantityUnit)) &&
    (p.yardsPerSkein === undefined ||
      p.yardsPerSkein === null ||
      (Number.isSafeInteger(p.yardsPerSkein) && p.yardsPerSkein > 0)) &&
    (p.quantityUnit !== "skeins" ||
      (Number.isSafeInteger(p.skeins) &&
        Number.isSafeInteger(p.yardsPerSkein) &&
        p.yardsPerSkein > 0 &&
        p.skeins * p.yardsPerSkein === p.yards)) &&
    typeof p.store === "string" &&
    p.store.length <= 120 &&
    typeof p.notes === "string" &&
    p.notes.length <= 2000
  );
}
export function pendingYards(state, yarnId) {
  return (state.purchases || [])
    .filter((p) => p.status === "awaiting" && (!yarnId || p.yarnId === yarnId))
    .reduce((sum, p) => sum + p.yards, 0);
}
export function deliveryDue(p, today = localDay()) {
  return (
    p.status === "awaiting" &&
    !!p.expectedOn &&
    p.expectedOn <= today &&
    (!p.remindAfter || p.remindAfter <= today)
  );
}
export function recordPurchase(
  state,
  purchase,
  today = localDay(),
  newYarn = null,
) {
  const purchases = state.purchases || [];
  // Replaying the same command must not add the same purchase to stock again.
  if (purchases.some((p) => p.id === purchase?.id)) return state;
  if (newYarn !== null) {
    if (
      !validNewYarn(newYarn) ||
      newYarn.id !== purchase?.yarnId ||
      state.yarn.some((y) => y.id === newYarn.id)
    )
      throw Error(
        "Enter the new yarn’s name, color, and weight before recording the purchase.",
      );
    // Build both records together; failed validation must leave no empty yarn behind.
    state = { ...state, yarn: [...state.yarn, { ...newYarn }] };
  }
  if (!validPurchase(purchase, state.yarn))
    throw Error(
      "Choose a yarn, enter positive whole yards, and check the purchase and delivery dates.",
    );
  if (
    purchase.purchasedOn > today ||
    (purchase.receivedOn && purchase.receivedOn > today)
  )
    throw Error("Purchase and receipt dates cannot be in the future.");
  const stock = state.yarn.find((y) => y.id === purchase.yarnId).yards;
  if (!Number.isSafeInteger(stock + purchase.yards))
    throw Error("That quantity is too large to record accurately.");
  return {
    ...state,
    purchases: [...purchases, { ...purchase }],
    yarn: state.yarn.map((y) =>
      y.id === purchase.yarnId && purchase.status === "received"
        ? { ...y, yards: y.yards + purchase.yards }
        : y,
    ),
  };
}
export function receivePurchase(
  state,
  id,
  receivedOn = localDay(),
  today = localDay(),
) {
  const purchase = (state.purchases || []).find((p) => p.id === id);
  if (!purchase) throw Error("That purchase could not be found.");
  if (purchase.status === "received") return state;
  if (
    !validDay(receivedOn) ||
    receivedOn < purchase.purchasedOn ||
    receivedOn > today
  )
    throw Error("Choose a receipt date between the purchase date and today.");
  const yarn = state.yarn.find((y) => y.id === purchase.yarnId);
  if (!yarn || !Number.isSafeInteger(yarn.yards + purchase.yards))
    throw Error("The linked yarn is missing or the quantity is too large.");
  return {
    ...state,
    purchases: state.purchases.map((p) =>
      p.id === id
        ? { ...p, status: "received", receivedOn, remindAfter: null }
        : p,
    ),
    yarn: state.yarn.map((y) =>
      y.id === yarn.id ? { ...y, yards: y.yards + purchase.yards } : y,
    ),
  };
}
export function updateDelivery(state, id, expectedOn, remindAfter = null) {
  const purchase = (state.purchases || []).find((p) => p.id === id);
  if (!purchase || purchase.status !== "awaiting")
    throw Error("Only awaiting deliveries can be updated.");
  if (
    (expectedOn !== null &&
      (!validDay(expectedOn) || expectedOn < purchase.purchasedOn)) ||
    (remindAfter !== null && !validDay(remindAfter))
  )
    throw Error(
      "Choose an expected arrival date on or after the purchase date.",
    );
  return {
    ...state,
    purchases: state.purchases.map((p) =>
      p.id === id ? { ...p, expectedOn, remindAfter } : p,
    ),
  };
}
