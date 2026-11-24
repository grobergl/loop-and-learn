import { stitches } from "./data.js";
export const starterStitches = stitches.slice(0, 9).map((s) => s.id);
export const libraryIds = (state) => [
  ...new Set([
    ...(state.skillLibraryIds || starterStitches),
    ...Object.keys(state.skills || {}),
    ...(state.customPatterns || []).flatMap((p) => p.stitches || []),
    ...state.projects.flatMap((p) => p.pattern?.stitches || []),
  ]),
];
export function detectStitches(text, terminology = "US") {
  const extra = {
    bobble: ["bobble", "bo"],
    shell: ["shell"],
    puff: ["puff"],
    popcorn: ["popcorn", "pc"],
    cluster: ["dc cl", "double crochet cluster"],
    fpdc: ["FPdc", "front post double crochet"],
    bpdc: ["BPdc", "back post double crochet"],
    picot: ["picot"],
    crab: ["crab stitch", "reverse single crochet", "rsc"],
    waistcoat: ["waistcoat", "wc"],
    spike: ["spike stitch", "spike sc"],
    vstitch: ["v-st", "v stitch"],
    moss: ["moss stitch", "linen stitch", "granite stitch"],
    granny: ["granny cluster", "granny cl"],
  };
  const abbrevUS = {
      ch: "ch",
      sc: "sc",
      sl: "sl st",
      hdc: "hdc",
      dc: "dc",
      tr: "tr",
      mr: "MR",
      inc: "inc",
      dec: "inv dec",
      blo: "BLO",
    },
    abbrevUK = { ...abbrevUS, sc: "dc", hdc: "htr", dc: "tr", tr: "dtr" };
  return stitches
    .filter((s) => {
      const aliases = extra[s.id] || [
        (terminology === "UK" ? abbrevUK : abbrevUS)[s.id],
        ...(terminology === "US" ? [s.name] : []),
      ];
      return aliases
        .filter(Boolean)
        .some((a) =>
          new RegExp(
            "(^|[^A-Za-z])" +
              a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
              "(?=$|[^A-Za-z])",
            "i",
          ).test(text),
        );
    })
    .map((s) => s.id);
}
