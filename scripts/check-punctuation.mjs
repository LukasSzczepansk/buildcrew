import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src", "scripts"];
const ROOT_FILES = [
  "package.json",
  "next.config.ts",
  "drizzle.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "vercel.json",
];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".md", ".txt", ".html", ".svg"]);
const forbidden = "\u2014";
const matches = [];

function inspectFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.has(extension) && !ROOT_FILES.includes(filePath)) return;

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes(forbidden)) matches.push(`${filePath}:${index + 1}`);
  });
}

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else inspectFile(fullPath);
  }
}

ROOTS.forEach(walk);
ROOT_FILES.filter((filePath) => fs.existsSync(filePath)).forEach(inspectFile);

if (matches.length > 0) {
  console.error("Znaleziono niedozwolony znak U+2014. Uzyj zwyklego myslnika '-'.");
  matches.forEach((match) => console.error(`- ${match}`));
  process.exit(1);
}

console.log("Punctuation check: OK");
