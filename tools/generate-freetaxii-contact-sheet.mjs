import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const upstream = process.argv[2] ?? resolve(root, "../stix2-graphics");
const pngRoot = resolve(
  upstream,
  "icons/stix2.1-svg/exports/freetaxii-300dpi",
);
const outputRoot = resolve(root, "preview/pr-screenshots");
const items = [
  ["artifact", "Artifact"],
  ["directory", "Directory"],
  ["file", "File"],
  ["mutex", "Mutex"],
  ["process", "Process"],
  ["software", "Software"],
  ["user-account", "User Account"],
  ["windows-registry-key", "Windows Registry Key"],
  ["x509-certificate", "X.509 Certificate"],
];

const cards = [];
for (const [slug, label] of items) {
  const bytes = await readFile(resolve(pngRoot, `${slug}-300-dpi.png`));
  cards.push({ label, uri: `data:image/png;base64,${bytes.toString("base64")}` });
}

const cardMarkup = cards.map(({ label, uri }, index) => {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const x = 72 + col * 512;
  const y = 154 + row * 480;
  return `
  <g transform="translate(${x} ${y})">
    <rect width="464" height="432" rx="22" fill="#fff" stroke="#d0d7de" stroke-width="2"/>
    <image href="${uri}" x="62" y="20" width="340" height="340"/>
    <text x="232" y="397" text-anchor="middle" fill="#1f2328"
          font-family="system-ui, sans-serif" font-size="23" font-weight="650">${label}</text>
  </g>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="1628" viewBox="0 0 1680 1628">
  <title>FreeTAXII presentation-ready STIX exports</title>
  <rect width="1680" height="1628" fill="#f6f8fa"/>
  <text x="72" y="70" fill="#1f2328" font-family="system-ui, sans-serif"
        font-size="38" font-weight="700">Nine presentation-ready STIX observable exports</text>
  <text x="72" y="112" fill="#59636e" font-family="system-ui, sans-serif" font-size="22">
    Each PNG is 1200 × 1200 with explicit 300-DPI metadata and a persistent vector-derived label.
  </text>
${cardMarkup}
</svg>`;

await writeFile(resolve(outputRoot, "freetaxii-exports.svg"), svg);
