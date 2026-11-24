import { mkdir, copyFile, writeFile } from "node:fs/promises";
await mkdir("docs", { recursive: true });
await copyFile("standalone/index.html", "docs/index.html");
await writeFile("docs/.nojekyll", "");
console.log("GitHub Pages files prepared in docs/.");
