import { materialsFor } from "./project.js";
export const activeProjects = (state) =>
  state.projects.filter((p) => p.status === "active");
export const reserved = (state, yarnId, excludeId) =>
  activeProjects(state)
    .filter((p) => p.id !== excludeId)
    .flatMap(materialsFor)
    .filter((m) => m.yarnId === yarnId)
    .reduce((n, m) => n + m.yards, 0);
export const available = (state, yarnId, excludeId) =>
  (state.yarn.find((y) => y.id === yarnId)?.yards ?? 0) -
  reserved(state, yarnId, excludeId);
export const shortages = (state) => [
  ...state.yarn
    .map((y) => ({
      ...y,
      reserved: reserved(state, y.id),
      short: Math.max(0, -available(state, y.id)),
    }))
    .filter((y) => y.short > 0),
  ...activeProjects(state).flatMap((p) =>
    materialsFor(p)
      .filter((m) => !m.yarnId)
      .map((m) => ({
        id: p.id + "-" + m.id,
        name: p.name,
        color: m.role || "Unassigned color",
        hex: m.hex || "#ddd2b9",
        fiber: m.fiber || "Check pattern",
        weight: m.weight || p.pattern?.weight || "4 · Medium",
        yards: 0,
        reserved: m.yards,
        short: m.yards,
        unassigned: true,
      })),
  ),
];
export const canMake = (state, pattern) => {
  const used = {};
  return (
    pattern.requirements || [{ weight: pattern.weight, yards: pattern.yards }]
  ).every((r) => {
    const y = state.yarn.find(
      (y) =>
        y.weight === (r.weight || pattern.weight) &&
        available(state, y.id) - (used[y.id] || 0) >= r.yards,
    );
    if (!y) return false;
    used[y.id] = (used[y.id] || 0) + r.yards;
    return true;
  });
};
export function finishProject(state, id, used) {
  const p = state.projects.find((p) => p.id === id);
  if (!p || p.status !== "active")
    throw Error("This project is no longer active.");
  const mats = materialsFor(p);
  const values =
    typeof used === "number"
      ? Object.fromEntries(mats.map((m, i) => [m.id, i === 0 ? used : 0]))
      : used;
  const byYarn = {};
  let total = 0;
  for (const m of mats) {
    const n = values?.[m.id];
    if (!Number.isInteger(n) || n < 0)
      throw Error(
        "Enter actual usage of 0 or more whole yards for every color.",
      );
    if (!m.yarnId && n > 0)
      throw Error(
        "Assign purchased yarn in Edit project before recording its use.",
      );
    if (m.yarnId) byYarn[m.yarnId] = (byYarn[m.yarnId] || 0) + n;
    total += n;
  }
  for (const [id, n] of Object.entries(byYarn)) {
    const y = state.yarn.find((y) => y.id === id);
    if (!y || n > y.yards)
      throw Error(
        "Actual yarn used must be between 0 and the amount in your stash, including combined uses of the same yarn.",
      );
  }
  return {
    ...state,
    yarn: state.yarn.map((y) => ({
      ...y,
      yards: y.yards - (byYarn[y.id] || 0),
    })),
    projects: state.projects.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "completed",
            actualYards: total,
            actualByMaterial: values,
            completed: new Date().toISOString(),
          }
        : x,
    ),
  };
}
