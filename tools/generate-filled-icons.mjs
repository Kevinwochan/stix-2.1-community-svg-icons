#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const variant = inventory.presentation_variants.filled_icons;

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
  source.match(/<title>(.*?)<\/title>/s)?.[1] ?? fallback;

const makeFilledIcon = ({
  accessibleName,
  background,
  body,
  preserveSemanticColor = false,
}) => {
  const glyph = preserveSemanticColor
    ? body
    : body.replaceAll("currentColor", "#FFFFFF");

  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 64 64"
     role="img"
     aria-label="${escapeXml(accessibleName)}"
     focusable="false"
     fill="none"
     stroke="${preserveSemanticColor ? "none" : "#FFFFFF"}"
     color="#FFFFFF"
     stroke-width="3"
     stroke-linecap="round"
     stroke-linejoin="round">
  <title>${escapeXml(accessibleName)}</title>
  <circle cx="32" cy="32" r="31" fill="${background}" stroke="none"/>
  ${glyph}
</svg>
`;
};

const generated = [];

for (const entity of inventory.entities) {
  const directory = categoryDirectory[entity.category];
  const source = await readFile(join(projectRoot, entity.path), "utf8");
  const token = profile.types[entity.type];
  const path = join(
    projectRoot,
    variant.output_directory,
    directory,
    `${entity.type}.svg`,
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    makeFilledIcon({
      accessibleName: `${titleFromSource(source, entity.type)} filled icon`,
      background: profile.tokens[token].light,
      body: iconBody(source),
    }),
    "utf8",
  );
  generated.push(path);
}

const markingEntries = [
  ...inventory.marking_variants,
  ...inventory.modern_tlp_variants,
];

for (const entry of markingEntries) {
  const source = await readFile(join(projectRoot, entry.path), "utf8");
  const isTlp = entry.key.startsWith("tlp-");
  const path = join(
    projectRoot,
    variant.output_directory,
    "marking",
    `${entry.key}.svg`,
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    makeFilledIcon({
      accessibleName: `${titleFromSource(source, entry.key)} filled icon`,
      background: isTlp ? "#000000" : variant.marking_background,
      body: iconBody(source),
      preserveSemanticColor: isTlp,
    }),
    "utf8",
  );
  generated.push(path);
}

process.stdout.write(
  `Generated ${generated.length} compact filled icons in `
  + `${variant.output_directory}.\n`,
);
