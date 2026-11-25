import { libraryIds } from "./stitch-library.js";
import { validPurchase } from "./purchases.js";
import { patterns as builtins, stitches } from "./data.js";
import { weights } from "./yarn.js";
import { validYarnPhoto } from "./yarn-photo.js";
export { weights };
export const levels = [
  "Beginner",
  "Confident beginner",
  "Intermediate",
  "Advanced",
];
export const allPatterns = (s) => [...builtins, ...(s.customPatterns || [])];
export const projectPattern = (s, p) =>
  p.pattern || allPatterns(s).find((x) => x.id === p.patternId);
export const materialsFor = (p) =>
  p.materials || [
    { id: "main", role: "Main color", yarnId: p.yarnId, yards: p.yards },
  ];
export function parseInstructions(raw) {
  const result = [];
  for (const line of raw.split(/\r?\n/)) {
    let text = line
      .trim()
      .replace(/^[-*]\s*(?:\[[ xX]\]\s*)?/, "")
      .replace(/^\d+[.)]\s+/, "");
    if (!text) continue;
    if (/^#{1,6}\s/.test(text) && !/^#{1,6}\s*(?:round|row|rnd)/i.test(text))
      continue;
    text = text.replace(/^#{1,6}\s*/, "");
    const range = text.match(
      /^(?:rounds?|rows?|rnds?)\s*(\d+)\s*[-–]\s*(\d+)\s*[:.)-]?\s*(.+)$/i,
    );
    const count = text.match(
      /(?:\(|\[)(\d+)\s*(?:st(?:itch)?(?:es)?s?)?(?:\)|\])\s*$/i,
    );
    const clean = text.replace(/^(?:round|row|rnd)\s*\d+\s*[:.)-]?\s*/i, "");
    if (range) {
      const n = Number(range[2]) - Number(range[1]) + 1;
      if (n < 1 || n > 500)
        throw Error("A repeated range must contain 1–500 rows or rounds.");
      for (let i = 0; i < n; i++)
        result.push({ text: range[3], count: count ? Number(count[1]) : null });
    } else result.push({ text: clean, count: count ? Number(count[1]) : null });
    if (result.length > 2000)
      throw Error(
        "Please split patterns longer than 2,000 rows or rounds into separate projects.",
      );
  }
  return result;
}
export const instructionsText = (p) =>
  p.instructions
    .map((r, i) => `${p.unit === "row" ? "Row" : "Round"} ${i + 1}: ${r.text}`)
    .join("\n");
const usToUk = {
  "single crochet": "double crochet",
  "half double crochet": "half treble crochet",
  "double crochet": "treble crochet",
  "treble crochet": "double treble crochet",
  sc: "dc",
  hdc: "htr",
  dc: "tr",
  tr: "dtr",
};
const ukToUs = Object.fromEntries(
  Object.entries(usToUk).map(([a, b]) => [b, a]),
);
export function translateTerms(text, from = "US", to = "US") {
  if (from === to) return text;
  const map = from === "US" ? usToUk : ukToUs;
  const re = new RegExp(
    "\\b(" +
      Object.keys(map)
        .sort((a, b) => b.length - a.length)
        .join("|") +
      ")\\b",
    "gi",
  );
  return text.replace(re, (x) => {
    const v = map[x.toLowerCase()];
    return /^[A-Z]/.test(x) ? v[0].toUpperCase() + v.slice(1) : v;
  });
}
export const stitchName = (s, term = "US") =>
  translateTerms(s.name, "US", term);
export function suggestedLevel(profile, skills) {
  const mastered = stitches
    .filter((s) => skills[s.id] === "Mastered")
    .map((s) => s.id);
  if (
    mastered.length >= 10 &&
    mastered.filter((id) => !stitches.slice(0, 9).some((s) => s.id === id))
      .length >= 2 &&
    profile.background === "complex"
  )
    return "Advanced";
  if (
    mastered.length >= 6 &&
    mastered.includes("inc") &&
    mastered.includes("dec")
  )
    return "Intermediate";
  if (mastered.length >= 4) return "Confident beginner";
  return "Beginner";
}
export function recommendations(state) {
  const profile = state.profile || {},
    level = profile.level || suggestedLevel(profile, state.skills),
    rank = levels.indexOf(level),
    interests = profile.interests || [];
  return allPatterns(state)
    .map((p) => ({
      p,
      score:
        (interests.includes(p.category) ? 5 : 0) -
        p.stitches.filter((id) => state.skills[id] !== "Mastered").length +
        (profile.mood === "challenge"
          ? levels.indexOf(p.level) > rank
            ? 4
            : 0
          : levels.indexOf(p.level) <= rank
            ? 3
            : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}
export function upgradeState(s) {
  return {
    ...s,
    version: 2,
    customPatterns: s.customPatterns || [],
    purchases: s.purchases || [],
    skillLibraryIds: libraryIds(s),
    profile: s.profile || {
      onboarded: false,
      terminology: "US",
      habits: [],
      interests: [],
      hooks: [],
      supplies: [],
    },
  };
}
export function validatePattern(p) {
  return (
    p &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    p.name.trim() &&
    ["row", "round"].includes(p.unit) &&
    ["US", "UK"].includes(p.terminology || "US") &&
    weights.includes(p.weight) &&
    Number.isInteger(p.yards) &&
    p.yards > 0 &&
    Array.isArray(p.instructions) &&
    p.instructions.length > 0 &&
    p.instructions.length <= 2000 &&
    p.instructions.every(
      (r) =>
        typeof r.text === "string" &&
        r.text.trim() &&
        r.text.length < 10000 &&
        (r.count == null || (Number.isInteger(r.count) && r.count >= 0)),
    ) &&
    Array.isArray(p.stitches) &&
    p.stitches.every((id) => stitches.some((s) => s.id === id)) &&
    [
      "subtitle",
      "category",
      "level",
      "hook",
      "setup",
      "finish",
      "art",
      "color",
    ].every((k) => typeof p[k] === "string")
  );
}
export function validateBackup(s) {
  if (
    s?.skillLibraryIds &&
    (!Array.isArray(s.skillLibraryIds) ||
      s.skillLibraryIds.some((id) => !stitches.some((x) => x.id === id)))
  )
    return false;
  if (
    !s ||
    ![1, 2].includes(s.version) ||
    typeof s.maker !== "string" ||
    !s.maker.trim() ||
    s.maker.length > 30 ||
    !Array.isArray(s.yarn) ||
    !Array.isArray(s.projects) ||
    !s.skills ||
    !Array.isArray(s.saved)
  )
    return false;
  if (
    Object.entries(s.skills).some(
      ([id, v]) =>
        !stitches.some((x) => x.id === id) ||
        !["Want to learn", "Learning", "Mastered"].includes(v),
    )
  )
    return false;
  if (
    s.customPatterns &&
    (!Array.isArray(s.customPatterns) ||
      !s.customPatterns.every(validatePattern) ||
      new Set(s.customPatterns.map((p) => p.id)).size !==
        s.customPatterns.length)
  )
    return false;
  if (
    new Set(s.yarn.map((y) => y.id)).size !== s.yarn.length ||
    s.yarn.some(
      (y) =>
        typeof y.id !== "string" ||
        !["name", "color", "fiber", "weight"].every(
          (k) => typeof y[k] === "string",
        ) ||
        !/^#[0-9a-f]{6}$/i.test(y.hex) ||
        !validYarnPhoto(y.photo) ||
        !weights.includes(y.weight) ||
        !Number.isInteger(y.yards) ||
        y.yards < 0,
    )
  )
    return false;
  if (
    s.purchases !== undefined &&
    (!Array.isArray(s.purchases) ||
      !s.purchases.every((p) => validPurchase(p, s.yarn)) ||
      new Set(s.purchases.map((p) => p.id)).size !== s.purchases.length)
  )
    return false;
  if (s.saved.some((id) => !allPatterns(s).some((p) => p.id === id)))
    return false;
  if (
    s.profile &&
    (typeof s.profile !== "object" ||
      !["US", "UK"].includes(s.profile.terminology) ||
      ["habits", "interests", "hooks", "supplies"].some(
        (k) =>
          !Array.isArray(s.profile[k]) ||
          s.profile[k].some((v) => typeof v !== "string"),
      ))
  )
    return false;
  return (
    new Set(s.projects.map((p) => p.id)).size === s.projects.length &&
    s.projects.every((p) => {
      const pat = projectPattern(s, p);
      const mats = materialsFor(p);
      return (
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.notes === "string" &&
        pat &&
        (!p.pattern || validatePattern(p.pattern)) &&
        ["active", "completed"].includes(p.status) &&
        Array.isArray(mats) &&
        mats.length > 0 &&
        new Set(mats.map((m) => m.id)).size === mats.length &&
        mats.every(
          (m) =>
            typeof m.id === "string" &&
            Number.isInteger(m.yards) &&
            m.yards > 0 &&
            (!m.yarnId || s.yarn.some((y) => y.id === m.yarnId)),
        ) &&
        Array.isArray(p.done) &&
        new Set(p.done).size === p.done.length &&
        p.done.every(
          (i) => Number.isInteger(i) && i >= 0 && i < pat.instructions.length,
        ) &&
        (p.status !== "completed" ||
          (Number.isFinite(p.actualYards) &&
            p.actualYards >= 0 &&
            p.done.length === pat.instructions.length))
      );
    })
  );
}
