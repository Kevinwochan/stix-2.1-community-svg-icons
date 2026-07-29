#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const inventory = JSON.parse(
  await readFile(join(projectRoot, "stix-2.1-icon-inventory.json"), "utf8"),
);
const colorScheme = JSON.parse(
  await readFile(join(projectRoot, "design", "color-scheme.json"), "utf8"),
);
const profile = colorScheme.profiles.oasis_visualizer_compatible;
const variant = inventory.presentation_variants.labeled_tiles;

const categoryDirectory = {
  SDO: "sdo",
  SCO: "sco",
  SRO: "sro",
  SMO: "smo",
  Bundle: "bundle",
};

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const iconBody = (source) =>
  source
    .slice(source.indexOf(">") + 1, source.lastIndexOf("</svg>"))
    .replace(/<title>.*?<\/title>/s, "")
    .trim();

const titleFromSource = (source, fallback) =>
  source.match(/<title>(.*?)<\/title>/s)?.[1]?.replace(/^STIX\s+/, "")
  ?? fallback;

const vectorGlyphs = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00001", "00001", "00001", "00001", "10001", "10001", "01110"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

const vectorLabel = (label) => {
  const normalized = label.toUpperCase();
  let lines = [normalized];
  if (normalized.length > 15 && normalized.includes(" ")) {
    const words = normalized.split(" ");
    let best;
    for (let index = 1; index < words.length; index += 1) {
      const candidate = [
        words.slice(0, index).join(" "),
        words.slice(index).join(" "),
      ];
      const imbalance = Math.abs(candidate[0].length - candidate[1].length);
      if (!best || imbalance < best.imbalance) {
        best = { imbalance, lines: candidate };
      }
    }
    lines = best.lines;
  }
  const baseWidths = lines.map((line) => line.length * 6 - 1);
  const scale = Math.min(
    lines.length === 1 ? 1.35 : 1.15,
    84 / Math.max(...baseWidths),
  );
  const lineHeight = 7 * scale;
  const gap = lines.length === 1 ? 0 : 2;
  const totalHeight = lines.length * lineHeight + gap;
  const firstY = 73 + (21 - totalHeight) / 2;
  const commands = [];

  for (const [lineIndex, line] of lines.entries()) {
    const width = baseWidths[lineIndex] * scale;
    const startX = (96 - width) / 2;
    const startY = firstY + lineIndex * (lineHeight + gap);
    for (const [characterIndex, character] of [...line].entries()) {
      const glyph = vectorGlyphs[character];
      if (!glyph) {
        throw new Error(`Unsupported labeled-tile character: ${character}`);
      }
      for (const [row, pixels] of glyph.entries()) {
        for (const [column, pixel] of [...pixels].entries()) {
          if (pixel !== "1") continue;
          const x = startX + (characterIndex * 6 + column) * scale;
          const y = startY + row * scale;
          commands.push(
            `M${x.toFixed(3)} ${y.toFixed(3)}h${scale.toFixed(3)}`
            + `v${scale.toFixed(3)}h-${scale.toFixed(3)}z`,
          );
        }
      }
    }
  }

  return `<path data-label="${escapeXml(label)}" fill="#152033"
        stroke="none" d="${commands.join("")}"/>`;
};

const makeTile = ({
  accessibleName,
  background,
  body,
  label,
  preserveSemanticColor = false,
}) => {
  const glyph = preserveSemanticColor
    ? `<g transform="translate(16 2)">${body}</g>`
    : `<g transform="translate(20 8) scale(.875)"
       fill="none" stroke="#FFFFFF" color="#FFFFFF"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    ${body}
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 96 96"
     role="img"
     aria-label="${escapeXml(accessibleName)}"
     focusable="false">
  <title>${escapeXml(accessibleName)}</title>
  <rect x="1" y="1" width="94" height="94" rx="15"
        fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <rect x="4" y="4" width="88" height="66" rx="12"
        fill="${background}"/>
  ${glyph}
  ${vectorLabel(label)}
</svg>
`;
};

const generated = [];
const entityTiles = [];

for (const entity of inventory.entities) {
  const directory = categoryDirectory[entity.category];
  const source = await readFile(join(projectRoot, entity.path), "utf8");
  const label = titleFromSource(source, entity.type);
  const token = profile.types[entity.type];
  const path = join(
    projectRoot,
    variant.output_directory,
    directory,
    `${entity.type}.svg`,
  );
  await mkdir(dirname(path), { recursive: true });
  const tileSource = makeTile({
    accessibleName: `STIX ${label} labeled tile`,
    background: profile.tokens[token].light,
    body: iconBody(source),
    label,
  });
  await writeFile(path, tileSource, "utf8");
  generated.push(path);
  entityTiles.push({
    ...entity,
    directory,
    tileBody: iconBody(tileSource),
  });
}

const markingEntries = [
  ...inventory.marking_variants,
  ...inventory.modern_tlp_variants,
];

for (const entry of markingEntries) {
  const source = await readFile(join(projectRoot, entry.path), "utf8");
  const label = entry.key === "statement-marking"
    ? "Statement"
    : `TLP:${entry.key.slice(4).toUpperCase().replace("-STRICT", "+STRICT")}`;
  const path = join(
    projectRoot,
    variant.output_directory,
    "marking",
    `${entry.key}.svg`,
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    makeTile({
      accessibleName: `${label} labeled tile`,
      background: entry.key.startsWith("tlp-") ? "#000000" : "#475569",
      body: iconBody(source),
      label,
      preserveSemanticColor: entry.key.startsWith("tlp-"),
    }),
    "utf8",
  );
  generated.push(path);
}

const columns = 5;
const cardWidth = 150;
const cardHeight = 140;
const gap = 14;
const padding = 38;
const header = 118;
const rows = Math.ceil(inventory.entities.length / columns);
const width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
const height = header + rows * cardHeight + (rows - 1) * gap + 38;

const catalogCards = entityTiles.map((entity, index) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = padding + column * (cardWidth + gap);
  const y = header + row * (cardHeight + gap);
  return `  <g>
    <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}"
          rx="14" fill="#FFFFFF" stroke="#D9E0E9"/>
    <g transform="translate(${x + 27} ${y + 16})">
      ${entity.tileBody}
    </g>
    <text x="${x + 75}" y="${y + 128}" text-anchor="middle"
          fill="#526078" font-family="monospace"
          font-size="8.5">${escapeXml(entity.type)}</text>
  </g>`;
}).join("\n");

const catalog = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width} ${height}"
     role="img"
     aria-label="Catalog of 43 labeled STIX 2.1 entity tiles">
  <title>STIX 2.1 labeled icon tiles</title>
  <rect width="${width}" height="${height}" fill="#EEF2F6"/>
  <text x="${padding}" y="54" fill="#152033"
        font-family="system-ui, sans-serif" font-size="34"
        font-weight="750">Labeled presentation tiles</text>
  <text x="${padding}" y="86" fill="#526078"
        font-family="system-ui, sans-serif" font-size="15">
    Filled backgrounds and persistent labels for standalone documentation, gallery, and export use
  </text>
${catalogCards}
</svg>
`;

const previewSvg = join(projectRoot, "preview", "catalog-labeled.svg");
const previewPng = join(projectRoot, "preview", "catalog-labeled.png");
await writeFile(previewSvg, catalog, "utf8");

const render = spawnSync(
  "rsvg-convert",
  ["--width", String(width), previewSvg],
  { encoding: null },
);
if (render.status !== 0) {
  throw new Error(
    `Failed to render labeled catalog: ${render.stderr?.toString() ?? ""}`,
  );
}
await writeFile(previewPng, render.stdout);

console.log(
  `Generated ${generated.length} labeled tiles and the labeled catalog preview.`,
);
