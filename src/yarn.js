import { validYarnPhoto } from "./yarn-photo.js";
export const weights = [
  "0 · Lace",
  "1 · Super fine",
  "2 · Fine",
  "3 · Light",
  "4 · Medium",
  "5 · Bulky",
  "6 · Super bulky",
  "7 · Jumbo",
];

export function validNewYarn(yarn) {
  return !!(
    yarn &&
    typeof yarn.id === "string" &&
    yarn.id.trim() &&
    ["name", "color", "fiber"].every(
      (key) =>
        typeof yarn[key] === "string" &&
        yarn[key].trim() &&
        yarn[key].length <= 120,
    ) &&
    weights.includes(yarn.weight) &&
    /^#[0-9a-f]{6}$/i.test(yarn.hex) &&
    validYarnPhoto(yarn.photo) &&
    yarn.yards === 0
  );
}
