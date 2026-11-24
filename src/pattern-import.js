import { parseInstructions, weights } from "./project.js";
const sections = {
  materials: "materials",
  supplies: "materials",
  "other supplies": "materials",
  notes: "notes",
  assumptions: "notes",
  "before you begin": "notes",
  "pattern details": "details",
  details: "details",
  instructions: "instructions",
  "pattern instructions": "instructions",
  rounds: "instructions",
  rows: "instructions",
  finishing: "finish",
  assembly: "finish",
  "finishing instructions": "finish",
};
export const patternReplyRequest = ({
  idea,
  level,
  terminology,
  photo = false,
}) =>
  `Help draft an original crochet pattern for: ${idea}. Target level: ${level}. Use ${terminology} crochet terminology. ${photo ? "I will attach a reference picture. Interpret it as crochet rather than claiming exact reconstruction. " : ""}Use the actual pattern name as the first heading. Return the whole reply using these section headings so I can import it into my crochet app:\n# Pattern name\n## Pattern details\nCategory: Plushies, Clothing, Home, Accessories, or Other\nDifficulty: Beginner, Confident beginner, Intermediate, or Advanced\nTerminology: ${terminology}\nHook size: specify mm\nYarn weight: specify standard category number and name\nWork in: rounds or rows\n## Materials\nList every color on its own line like Main color: 80 yards, plus other supplies. Use an estimated TOTAL yardage for each color, not yards per inch.\n## Notes\nState size, gauge, assumptions, and that this is an untested draft.\n## Instructions\nOnly crochet rows/rounds in this section. Put each on its own line, labeled Round 1: or Row 1:. Check stitch counts. Expand repeats where practical.\n## Finishing\nGive assembly and finishing instructions. Do not put materials, notes, or finishing steps into the numbered crochet rounds.`;
export function importPatternReply(raw) {
  const buckets = {
      materials: [],
      notes: [],
      instructions: [],
      finish: [],
      details: [],
    },
    meta = {};
  let section = "notes",
    title = "";
  for (const original of raw.replace(/\r/g, "").split("\n")) {
    const line = original.trim();
    if (!line || /^```/.test(line)) continue;
    const clean = line
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/, "")
      .trim();
    const heading = clean.replace(/:$/, "").trim().toLowerCase();
    if (sections[heading]) {
      section = sections[heading];
      continue;
    }
    if (/^#\s+/.test(line) && !title) {
      title = clean;
      continue;
    }
    const label = clean
      .replace(/^[-*]\s*/, "")
      .match(
        /^(pattern name|name|category|difficulty|level|terminology|hook(?: size)?|yarn weight|work in)\s*:\s*(.+)$/i,
      );
    if (label) {
      meta[label[1].toLowerCase()] = label[2].trim();
      continue;
    }
    if (/^(?:[-*]\s*)?(?:rounds?|rows?|rnds?)\s*\d/i.test(clean)) {
      section = "instructions";
    }
    buckets[section].push(original.trim());
  }
  if (!buckets.instructions.length)
    throw Error(
      "I could not find an Instructions section or labeled rows/rounds. Keep your reply and add a heading “## Instructions” above the crochet steps.",
    );
  const text = buckets.instructions.join("\n");
  const instructions = parseInstructions(text);
  if (!instructions.length)
    throw Error(
      "Add at least one crochet row or round in the Instructions section.",
    );
  const patch = {};
  if (meta["pattern name"] || meta.name || title)
    patch.name = meta["pattern name"] || meta.name || title;
  const category = meta.category;
  if (
    ["Plushies", "Clothing", "Home", "Accessories", "Other"].includes(category)
  )
    patch.category = category;
  const level = meta.difficulty || meta.level;
  if (
    ["Beginner", "Confident beginner", "Intermediate", "Advanced"].includes(
      level,
    )
  )
    patch.level = level;
  if (/UK|British/i.test(meta.terminology || "")) patch.terminology = "UK";
  else if (/US|American/i.test(meta.terminology || ""))
    patch.terminology = "US";
  if (meta["hook size"] || meta.hook)
    patch.hook = meta["hook size"] || meta.hook;
  const weight = meta["yarn weight"] || "";
  const number = weight.match(/\b([0-7])\b/);
  if (number) patch.weight = weights[Number(number[1])];
  else {
    const match = weights.find((w) =>
      weight.toLowerCase().includes(w.split(" · ")[1].toLowerCase()),
    );
    if (match) patch.weight = match;
  }
  patch.unit =
    /rows?/i.test(meta["work in"] || "") || /^\s*row\s*\d/im.test(text)
      ? "row"
      : "round";
  patch.setup = [
    buckets.materials.length
      ? "Materials:\n" + buckets.materials.join("\n")
      : "",
    buckets.notes.join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
  patch.finish = buckets.finish.join("\n");
  const requirements = [];
  for (const line of buckets.materials) {
    const match = line
      .replace(/^[-*]\s*/, "")
      .match(/^([^:]{1,80}):.*?\b(\d+)\s*(?:yards?|yds?)\b/i);
    if (match && Number(match[2]) > 0)
      requirements.push({
        role: match[1].trim(),
        yards: Number(match[2]),
        weight: patch.weight || "4 · Medium",
      });
  }
  if (requirements.length) {
    patch.requirements = requirements;
    patch.yards = requirements.reduce((n, r) => n + r.yards, 0);
  }
  return {
    patch,
    text,
    instructions,
    summary: `Organized ${instructions.length} ${patch.unit}s${requirements.length ? `, ${requirements.length} yarn colors` : ""}; materials and notes are kept outside the numbered instructions.`,
  };
}
