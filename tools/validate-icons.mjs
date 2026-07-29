import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const inventory = JSON.parse(
  await readFile(join(projectRoot, "stix-2.1-icon-inventory.json"), "utf8"),
);
const colorScheme = JSON.parse(
  await readFile(join(projectRoot, "design", "color-scheme.json"), "utf8"),
);

const assetGroups = {
  entities: inventory.entities,
  marking_variants: inventory.marking_variants,
  modern_tlp_variants: inventory.modern_tlp_variants,
  predefined_object_extensions: inventory.predefined_object_extensions,
  extension_objects: inventory.extension_objects,
  marking_extensions: inventory.marking_extensions,
  state_badges: inventory.state_badges,
  fallback_icons: inventory.fallback_icons,
  compatibility_aliases: inventory.compatibility_aliases,
};

const expectedPaths = new Set(
  Object.values(assetGroups).flat().map((entry) => entry.path),
);
const filledVariant = inventory.presentation_variants.filled_icons;
const labeledVariant = inventory.presentation_variants.labeled_tiles;
const presentationCategoryDirectory = {
  SDO: "sdo",
  SCO: "sco",
  SRO: "sro",
  SMO: "smo",
  Bundle: "bundle",
};
const markingEntries = [
  ...inventory.marking_variants,
  ...inventory.modern_tlp_variants,
];
const expectedFilledPaths = new Set([
  ...inventory.entities.map((entry) =>
    `${filledVariant.output_directory}/`
    + `${presentationCategoryDirectory[entry.category]}/${entry.type}.svg`
  ),
  ...markingEntries.map((entry) =>
    `${filledVariant.output_directory}/marking/${entry.key}.svg`
  ),
]);
const expectedLabeledPaths = new Set([
  ...inventory.entities.map((entry) =>
    `${labeledVariant.output_directory}/`
    + `${presentationCategoryDirectory[entry.category]}/${entry.type}.svg`
  ),
  ...markingEntries.map((entry) =>
    `${labeledVariant.output_directory}/marking/${entry.key}.svg`
  ),
]);

const findSvgPaths = async (directory) => {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...await findSvgPaths(path));
    } else if (entry.isFile() && entry.name.endsWith(".svg")) {
      paths.push(relative(projectRoot, path));
    }
  }
  return paths;
};

const allSvgPaths = await findSvgPaths(join(projectRoot, "icons"));
const actualPaths = new Set(
  allSvgPaths.filter((path) =>
    !path.startsWith(`${labeledVariant.output_directory}/`)
    && !path.startsWith(`${filledVariant.output_directory}/`)
  ),
);
const actualFilledPaths = new Set(
  allSvgPaths.filter((path) =>
    path.startsWith(`${filledVariant.output_directory}/`)
  ),
);
const actualLabeledPaths = new Set(
  allSvgPaths.filter((path) =>
    path.startsWith(`${labeledVariant.output_directory}/`)
  ),
);
const errors = [];

for (const path of expectedPaths) {
  if (!actualPaths.has(path)) errors.push(`Missing icon: ${path}`);
}

for (const path of actualPaths) {
  if (!expectedPaths.has(path)) errors.push(`Unexpected icon: ${path}`);
}

for (const path of expectedFilledPaths) {
  if (!actualFilledPaths.has(path)) {
    errors.push(`Missing filled icon: ${path}`);
  }
}

for (const path of actualFilledPaths) {
  if (!expectedFilledPaths.has(path)) {
    errors.push(`Unexpected filled icon: ${path}`);
  }
}

for (const path of expectedLabeledPaths) {
  if (!actualLabeledPaths.has(path)) {
    errors.push(`Missing labeled tile: ${path}`);
  }
}

for (const path of actualLabeledPaths) {
  if (!expectedLabeledPaths.has(path)) {
    errors.push(`Unexpected labeled tile: ${path}`);
  }
}

if (
  inventory.entities.length !== filledVariant.entity_count
  || markingEntries.length !== filledVariant.marking_count
) {
  errors.push("Filled icon inventory counts do not match their source groups");
}

if (
  inventory.entities.length !== labeledVariant.entity_count
  || markingEntries.length !== labeledVariant.marking_count
) {
  errors.push("Labeled tile inventory counts do not match their source groups");
}

const tlpPaths = new Map(
  [
    ...inventory.marking_variants,
    ...inventory.modern_tlp_variants,
  ]
    .filter((entry) => entry.key.startsWith("tlp-"))
    .map((entry) => [entry.path, entry.key]),
);

const officialTlpColors = {
  "tlp-white": "#FFFFFF",
  "tlp-green": "#33FF00",
  "tlp-amber": "#FFC000",
  "tlp-red": "#FF2B2B",
  "tlp-clear": "#FFFFFF",
  "tlp-amber-strict": "#FFC000",
};

const relativeLuminance = (hex) => {
  const channels = hex.match(/[0-9a-f]{2}/gi)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1]
    + 0.0722 * channels[2];
};

const contrastRatio = (first, second) => {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
};

const geometryBodies = new Map();

for (const path of [...actualPaths].sort()) {
  const source = await readFile(join(projectRoot, path), "utf8");
  const isEntity = inventory.entities.some((entry) => entry.path === path);
  const tlpKey = tlpPaths.get(path);

  const requiredPatterns = [
    ["an SVG root element", /^<svg\s/],
    ["the 64 × 64 viewBox", /viewBox="0 0 64 64"/],
    ["an accessible image role", /role="img"/],
    ["an aria-label", /aria-label="[^"]+"/],
    ["a title", /<title>[^<]+<\/title>/],
    ["the standard stroke width", /stroke-width="3"/],
    ["rounded line caps", /stroke-linecap="round"/],
    ["rounded line joins", /stroke-linejoin="round"/],
    [
      "vector geometry",
      /<(?:path|circle|rect|line|polyline|polygon|ellipse)\b/,
    ],
  ];

  if (!tlpKey) requiredPatterns.push(["currentColor", /currentColor/]);
  if (isEntity) {
    requiredPatterns.push(
      ["a STIX-prefixed accessible title", /<title>STIX [^<]+<\/title>/],
      ["a STIX-prefixed aria-label", /aria-label="STIX [^"]+"/],
    );
  }

  for (const [description, pattern] of requiredPatterns) {
    if (!pattern.test(source)) errors.push(`${path}: missing ${description}`);
  }

  const forbiddenPatterns = [
    ["scripts", /<script\b/i],
    ["embedded or external images", /<image\b/i],
    ["foreign objects", /<foreignObject\b/i],
    ["style blocks", /<style\b/i],
    ["text geometry", /<text\b/i],
    ["external references", /\b(?:href|xlink:href)=/i],
    ["URL references", /url\s*\(/i],
    ["transform-dependent geometry", /\btransform=/i],
    ["embedded fonts", /<font\b|font-family\s*=/i],
  ];

  for (const [description, pattern] of forbiddenPatterns) {
    if (pattern.test(source)) errors.push(`${path}: contains ${description}`);
  }

  const title = source.match(/<title>([^<]+)<\/title>/)?.[1];
  const ariaLabel = source.match(/aria-label="([^"]+)"/)?.[1];
  if (title && ariaLabel && title !== ariaLabel) {
    errors.push(`${path}: title and aria-label do not match`);
  }

  if (tlpKey) {
    const color = officialTlpColors[tlpKey];
    if (!source.includes(color)) {
      errors.push(`${path}: missing official ${tlpKey} color ${color}`);
    }
    if (
      !source.includes('d="M7 16h28l21 16-21 16H7z"')
      || !source.includes('stroke="#111827"')
    ) {
      errors.push(`${path}: missing the colored STIX marking tag treatment`);
    }
    const pictogramContrast = contrastRatio("#111827", color);
    if (pictogramContrast < colorScheme.accessibility.minimum_contrast_ratio) {
      errors.push(
        `${path}: ${pictogramContrast.toFixed(2)}:1 pictogram contrast is below `
        + `${colorScheme.accessibility.minimum_contrast_ratio}:1`,
      );
    }
  }

  const body = source
    .slice(source.indexOf(">") + 1, source.lastIndexOf("</svg>"))
    .replace(/<title>.*?<\/title>/s, "")
    .replace(/\s+/g, " ")
    .trim();

  if (geometryBodies.has(body)) {
    errors.push(`${path}: duplicates geometry from ${geometryBodies.get(body)}`);
  } else {
    geometryBodies.set(body, path);
  }
}

for (const path of [...actualFilledPaths].sort()) {
  const source = await readFile(join(projectRoot, path), "utf8");
  const requiredPatterns = [
    ["an SVG root element", /^<svg\s/],
    ["the compact filled viewBox", /viewBox="0 0 64 64"/],
    ["an accessible image role", /role="img"/],
    ["an aria-label", /aria-label="[^"]+ filled icon"/],
    ["a matching accessible title", /<title>[^<]+ filled icon<\/title>/],
    [
      "a circular filled background",
      /<circle cx="32" cy="32" r="31" fill="#[0-9A-F]{6}" stroke="none"\/>/,
    ],
    [
      "vector geometry",
      /<(?:path|circle|rect|line|polyline|polygon|ellipse)\b/,
    ],
  ];
  for (const [description, pattern] of requiredPatterns) {
    if (!pattern.test(source)) {
      errors.push(`${path}: missing ${description}`);
    }
  }
  const forbiddenPatterns = [
    ["scripts", /<script\b/i],
    ["embedded or external images", /<image\b/i],
    ["foreign objects", /<foreignObject\b/i],
    ["style blocks", /<style\b/i],
    ["text geometry", /<text\b/i],
    ["external references", /\b(?:href|xlink:href)=/i],
    ["URL references", /url\s*\(/i],
    ["transform-dependent geometry", /\btransform=/i],
    ["font dependencies", /<font\b|font-family\s*=/i],
    ["inherited currentColor", /currentColor/],
  ];
  for (const [description, pattern] of forbiddenPatterns) {
    if (pattern.test(source)) {
      errors.push(`${path}: contains ${description}`);
    }
  }
  const title = source.match(/<title>([^<]+)<\/title>/)?.[1];
  const ariaLabel = source.match(/aria-label="([^"]+)"/)?.[1];
  if (title && ariaLabel && title !== ariaLabel) {
    errors.push(`${path}: title and aria-label do not match`);
  }
}

for (const path of [...actualLabeledPaths].sort()) {
  const source = await readFile(join(projectRoot, path), "utf8");
  const requiredPatterns = [
    ["an SVG root element", /^<svg\s/],
    ["the labeled tile viewBox", /viewBox="0 0 96 96"/],
    ["an accessible image role", /role="img"/],
    ["an aria-label", /aria-label="[^"]+ labeled tile"/],
    ["a matching accessible title", /<title>[^<]+ labeled tile<\/title>/],
    ["a filled tile background", /<rect[^>]+fill="#[0-9A-F]{6}"/s],
    ["a persistent path-drawn label", /<path data-label="[^"]+"/],
  ];
  for (const [description, pattern] of requiredPatterns) {
    if (!pattern.test(source)) {
      errors.push(`${path}: missing ${description}`);
    }
  }
  const forbiddenPatterns = [
    ["scripts", /<script\b/i],
    ["embedded or external images", /<image\b/i],
    ["foreign objects", /<foreignObject\b/i],
    ["external references", /\b(?:href|xlink:href)=/i],
    ["URL references", /url\s*\(/i],
    ["font dependencies", /<text\b|font-family\s*=/i],
  ];
  for (const [description, pattern] of forbiddenPatterns) {
    if (pattern.test(source)) {
      errors.push(`${path}: contains ${description}`);
    }
  }
  const title = source.match(/<title>([^<]+)<\/title>/)?.[1];
  const ariaLabel = source.match(/aria-label="([^"]+)"/)?.[1];
  if (title && ariaLabel && title !== ariaLabel) {
    errors.push(`${path}: title and aria-label do not match`);
  }
}

const compatibilityProfile = colorScheme.profiles.oasis_visualizer_compatible;
const inventoryTypes = new Set(inventory.entities.map((entity) => entity.type));
const mappedTypes = new Set(Object.keys(compatibilityProfile.types));

for (const type of inventoryTypes) {
  if (!mappedTypes.has(type)) {
    errors.push(`Compatibility color is missing for ${type}`);
  }
}

for (const type of mappedTypes) {
  if (!inventoryTypes.has(type)) {
    errors.push(`Compatibility color has an unexpected type: ${type}`);
  }
}

for (const [type, tokenName] of Object.entries(compatibilityProfile.types)) {
  if (!compatibilityProfile.tokens[tokenName]) {
    errors.push(`${type}: unknown compatibility color token ${tokenName}`);
  }
}

for (const entity of inventory.entities) {
  const directory = presentationCategoryDirectory[entity.category];
  const path = `${filledVariant.output_directory}/${directory}/`
    + `${entity.type}.svg`;
  const source = await readFile(join(projectRoot, path), "utf8");
  const token = compatibilityProfile.types[entity.type];
  const background = compatibilityProfile.tokens[token].light;
  if (!source.includes(`fill="${background}"`)) {
    errors.push(`${path}: missing declared ${entity.type} background ${background}`);
  }
  if (
    !source.includes('stroke="#FFFFFF"')
    || !source.includes('color="#FFFFFF"')
  ) {
    errors.push(`${path}: missing self-contained white glyph treatment`);
  }
  const ratio = contrastRatio(filledVariant.foreground, background);
  if (ratio < colorScheme.accessibility.minimum_contrast_ratio) {
    errors.push(
      `${path}: ${ratio.toFixed(2)}:1 white-on-background contrast is below `
      + `${colorScheme.accessibility.minimum_contrast_ratio}:1`,
    );
  }
}

for (const entry of markingEntries) {
  const path = `${filledVariant.output_directory}/marking/${entry.key}.svg`;
  const source = await readFile(join(projectRoot, path), "utf8");
  const isTlp = entry.key.startsWith("tlp-");
  const background = isTlp
    ? filledVariant.tlp_background
    : filledVariant.marking_background;
  if (!source.includes(`fill="${background}"`)) {
    errors.push(`${path}: missing declared marking background ${background}`);
  }
  if (isTlp) {
    const color = officialTlpColors[entry.key];
    if (!source.includes(color)) {
      errors.push(`${path}: missing official ${entry.key} color ${color}`);
    }
  } else if (!source.includes('stroke="#FFFFFF"')) {
    errors.push(`${path}: missing self-contained white marking glyph`);
  }
}

const contrastProfiles = {
  monochrome: {
    monochrome: colorScheme.profiles.monochrome,
  },
  oasis_visualizer_compatible: compatibilityProfile.tokens,
};

for (const [profileName, tokens] of Object.entries(contrastProfiles)) {
  for (const [tokenName, values] of Object.entries(tokens)) {
    for (const themeName of ["light", "dark"]) {
      const ratio = contrastRatio(
        values[themeName],
        colorScheme.themes[themeName].card,
      );
      if (ratio < colorScheme.accessibility.minimum_contrast_ratio) {
        errors.push(
          `${profileName}/${tokenName} ${themeName}: ${ratio.toFixed(2)}:1 `
          + `contrast is below `
          + `${colorScheme.accessibility.minimum_contrast_ratio}:1`,
        );
      }
    }
  }
}

for (const requiredKey of inventory.required_fallback_icons) {
  if (!inventory.fallback_icons.some((entry) => entry.key === requiredKey)) {
    errors.push(`Required fallback is missing from inventory: ${requiredKey}`);
  }
}

for (const alias of inventory.compatibility_aliases) {
  if (!actualPaths.has(alias.path)) {
    errors.push(`${alias.alias}: alias target path does not exist`);
  }
}

const exportProfile = inventory.export_profiles?.freetaxii_issue_4;
if (exportProfile) {
  const exportDirectory = join(projectRoot, exportProfile.output_directory);
  const expectedExports = new Set(
    exportProfile.types.map((type) => `${type}-300-dpi.png`),
  );
  const actualExports = new Set(
    (await readdir(exportDirectory)).filter((name) => name.endsWith(".png")),
  );
  const expectedPixelsPerMeter = Math.round(exportProfile.dpi / 0.0254);

  for (const name of expectedExports) {
    if (!actualExports.has(name)) errors.push(`Missing PNG export: ${name}`);
  }
  for (const name of actualExports) {
    if (!expectedExports.has(name)) {
      errors.push(`Unexpected PNG export: ${name}`);
    }
  }

  for (const name of actualExports) {
    const png = await readFile(join(exportDirectory, name));
    if (png.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
      errors.push(`${name}: invalid PNG signature`);
      continue;
    }
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width !== exportProfile.width || height !== exportProfile.height) {
      errors.push(
        `${name}: expected ${exportProfile.width} × ${exportProfile.height}, `
        + `found ${width} × ${height}`,
      );
    }
    let offset = 8;
    let physicalResolution;
    while (offset < png.length) {
      const length = png.readUInt32BE(offset);
      const type = png.toString("ascii", offset + 4, offset + 8);
      if (type === "pHYs") {
        physicalResolution = {
          x: png.readUInt32BE(offset + 8),
          y: png.readUInt32BE(offset + 12),
          unit: png[offset + 16],
        };
        break;
      }
      offset += 12 + length;
    }
    if (
      physicalResolution?.x !== expectedPixelsPerMeter
      || physicalResolution?.y !== expectedPixelsPerMeter
      || physicalResolution?.unit !== 1
    ) {
      errors.push(`${name}: missing ${exportProfile.dpi}-dpi metadata`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const summary = Object.entries(assetGroups)
    .map(([name, entries]) => `${name.replaceAll("_", " ")} ${entries.length}`)
    .join(", ");
  process.stdout.write(
    `Validated ${actualPaths.size} unique, dependency-free SVG assets, `
    + `${actualFilledPaths.size} filled icons, and `
    + `${actualLabeledPaths.size} labeled presentation tiles `
    + `(${summary}); entity theme colors exceed `
    + `${colorScheme.accessibility.minimum_contrast_ratio}:1 contrast; `
    + `${exportProfile?.types.length ?? 0} PNG exports passed dimension and `
    + `resolution checks.\n`,
  );
}
