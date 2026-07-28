import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const inventoryPath = join(projectRoot, "stix-2.1-icon-inventory.json");
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const colorScheme = JSON.parse(
  await readFile(join(projectRoot, "design", "color-scheme.json"), "utf8"),
);

const categoryDirectory = {
  SDO: "sdo",
  SCO: "sco",
  SRO: "sro",
  SMO: "smo",
  Bundle: "bundle",
};

const compatibilityProfile = colorScheme.profiles.oasis_visualizer_compatible;
const compatibilityColor = (type, themeName) => {
  const tokenName = compatibilityProfile.types[type];
  return compatibilityProfile.tokens[tokenName][themeName];
};

const xmlEscape = (value) =>
  value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const normalizeGeneratedText = (value) =>
  value.replace(/[ \t]+$/gm, "").replace(/\n+$/, "\n");

const icons = [];

for (const entity of inventory.entities) {
  const directory = categoryDirectory[entity.category];
  const relativePath = `icons/${directory}/${entity.type}.svg`;
  const absolutePath = join(projectRoot, relativePath);
  const source = await readFile(absolutePath, "utf8");
  const titleMatch = source.match(/<title>(.*?)<\/title>/s);
  const title = titleMatch?.[1]?.replace(/^STIX\s+/, "") ?? entity.type;
  const bodyStart = source.indexOf(">") + 1;
  const bodyEnd = source.lastIndexOf("</svg>");
  const body = source.slice(bodyStart, bodyEnd)
    .replace(/<title>.*?<\/title>/s, "")
    .trim();

  icons.push({
    ...entity,
    directory,
    relativePath,
    title,
    body,
  });
}

const columns = 5;
const cardWidth = 280;
const cardHeight = 150;
const gapX = 18;
const gapY = 18;
const pagePadding = 42;
const gridTop = 152;
const rows = Math.ceil(icons.length / columns);
const width = pagePadding * 2 + columns * cardWidth + (columns - 1) * gapX;
const height = gridTop + rows * cardHeight + (rows - 1) * gapY + 54;

const symbols = icons.map((icon) => `
    <symbol id="icon-${xmlEscape(icon.type)}" viewBox="0 0 64 64"
            fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round">
      ${icon.body}
    </symbol>`).join("");

const cards = icons.map((icon, index) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = pagePadding + column * (cardWidth + gapX);
  const y = gridTop + row * (cardHeight + gapY);
  const color = compatibilityColor(icon.type, "light");
  const titleSize = icon.title.length > 22 ? 14 : icon.title.length > 17 ? 16 : 18;

  return `
  <g transform="translate(${x} ${y})">
    <rect width="${cardWidth}" height="${cardHeight}" rx="15"
          fill="#ffffff" stroke="#d9e0e9"/>
    <rect width="${cardWidth}" height="5" rx="2.5" fill="${color}"/>
    <use x="20" y="41" width="72" height="72"
         href="#icon-${xmlEscape(icon.type)}"
         color="${color}"/>
    <text x="112" y="54" fill="${color}" font-family="system-ui, sans-serif"
          font-size="12" font-weight="800"
          letter-spacing="1.8">${xmlEscape(icon.category.toUpperCase())}</text>
    <text x="112" y="81" fill="#152033" font-family="system-ui, sans-serif"
          font-size="${titleSize}" font-weight="700">${xmlEscape(icon.title)}</text>
    <text x="112" y="107" fill="#67738a" font-family="monospace"
          font-size="12">${xmlEscape(icon.type)}</text>
  </g>`;
}).join("");

const catalog = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width} ${height}"
     role="img"
     aria-label="Complete catalog of 43 STIX 2.1 SVG entity icons">
  <title>Complete STIX 2.1 SVG icon catalog</title>
  <defs>${symbols}
  </defs>
  <rect width="${width}" height="${height}" fill="#eef2f6"/>
  <text x="${pagePadding}" y="62" fill="#152033"
        font-family="system-ui, sans-serif" font-size="40"
        font-weight="750">STIX 2.1 community SVG icons</text>
  <text x="${pagePadding}" y="99" fill="#526078"
        font-family="system-ui, sans-serif" font-size="17">
    43 canonical top-level entity types · original vector geometry · BSD 3-Clause
  </text>
  <text x="${width - pagePadding}" y="62" fill="#526078"
        font-family="system-ui, sans-serif" font-size="18"
        font-weight="700" text-anchor="end">19 SDO · 18 SCO · 2 SRO · 3 SMO · 1 Bundle</text>
  ${cards}
</svg>
`;

await writeFile(
  join(projectRoot, "preview", "catalog.svg"),
  normalizeGeneratedText(catalog),
);

const smallColumns = 5;
const smallCardWidth = 280;
const smallCardHeight = 82;
const smallGap = 14;
const smallRows = Math.ceil(icons.length / smallColumns);
const smallWidth = pagePadding * 2
  + smallColumns * smallCardWidth
  + (smallColumns - 1) * smallGap;
const smallHeight = 122
  + smallRows * smallCardHeight
  + (smallRows - 1) * smallGap
  + 44;

const smallCards = icons.map((icon, index) => {
  const column = index % smallColumns;
  const row = Math.floor(index / smallColumns);
  const x = pagePadding + column * (smallCardWidth + smallGap);
  const y = 122 + row * (smallCardHeight + smallGap);
  const color = compatibilityColor(icon.type, "light");
  const titleSize = icon.title.length > 22 ? 13 : 15;

  return `
  <g transform="translate(${x} ${y})">
    <rect width="${smallCardWidth}" height="${smallCardHeight}" rx="12"
          fill="#ffffff" stroke="#d9e0e9"/>
    <rect width="4" height="${smallCardHeight}" rx="2" fill="${color}"/>
    <use x="18" y="29" width="24" height="24"
         href="#icon-${xmlEscape(icon.type)}" color="${color}"/>
    <use x="54" y="25" width="32" height="32"
         href="#icon-${xmlEscape(icon.type)}" color="${color}"/>
    <text x="104" y="34" fill="#152033" font-family="system-ui, sans-serif"
          font-size="${titleSize}" font-weight="700">${xmlEscape(icon.title)}</text>
    <text x="104" y="56" fill="#67738a" font-family="monospace"
          font-size="10.5">${xmlEscape(icon.type)}</text>
  </g>`;
}).join("");

const smallCatalog = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${smallWidth} ${smallHeight}"
     role="img"
     aria-label="Small-size tests for all 43 STIX 2.1 SVG icons">
  <title>STIX 2.1 SVG icon small-size tests</title>
  <defs>${symbols}
  </defs>
  <rect width="${smallWidth}" height="${smallHeight}" fill="#eef2f6"/>
  <text x="${pagePadding}" y="54" fill="#152033"
        font-family="system-ui, sans-serif" font-size="34"
        font-weight="750">Small-size legibility</text>
  <text x="${pagePadding}" y="87" fill="#526078"
        font-family="system-ui, sans-serif" font-size="16">
    Every icon shown at 24 and 32 CSS pixels
  </text>
  ${smallCards}
</svg>
`;

await writeFile(
  join(projectRoot, "preview", "catalog-small.svg"),
  normalizeGeneratedText(smallCatalog),
);

const themePanel = (themeName, x) => {
  const theme = colorScheme.themes[themeName];
  const title = themeName === "light" ? "Light theme" : "Dark theme";
  const panelColumns = 2;
  const panelColumnWidth = 306;
  const panelRowHeight = 42;

  const rows = icons.map((icon, index) => {
    const column = index % panelColumns;
    const row = Math.floor(index / panelColumns);
    const itemX = 20 + column * panelColumnWidth;
    const y = 78 + row * panelRowHeight;
    const color = compatibilityColor(icon.type, themeName);
    const inverse = themeName === "light" ? theme.card : colorScheme.themes.dark.card;

    return `
      <g transform="translate(${itemX} ${y})">
        <rect width="294" height="34" rx="8" fill="${theme.card}"/>
        <rect x="6" y="4" width="26" height="26" rx="7" fill="${color}"/>
        <use x="10" y="8" width="18" height="18"
             href="#icon-${icon.type}" color="${inverse}"/>
        <use x="40" y="5" width="24" height="24"
             href="#icon-${icon.type}" color="${color}"/>
        <text x="72" y="22" fill="${theme.text}"
              font-family="system-ui, sans-serif" font-size="12.5"
              font-weight="650">${xmlEscape(icon.title)}</text>
        <text x="284" y="22" fill="${color}"
              font-family="monospace" font-size="10.5"
              text-anchor="end">${color}</text>
      </g>`;
  }).join("");

  return `
  <g transform="translate(${x} 138)">
    <rect width="644" height="1018" rx="20" fill="${theme.canvas}"/>
    <text x="24" y="48" fill="${theme.text}"
          font-family="system-ui, sans-serif" font-size="24"
          font-weight="750">${title}</text>
    <text x="620" y="47" fill="${theme.muted_text}"
          font-family="monospace" font-size="13"
          text-anchor="end">card ${theme.card}</text>
    ${rows}
  </g>`;
};

const colorPreview = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1400 1204"
     role="img"
     aria-label="OASIS visualizer-compatible STIX type colors for light and dark themes">
  <title>OASIS visualizer-compatible STIX type colors</title>
  <defs>${symbols}
  </defs>
  <rect width="1400" height="1204" fill="#ffffff"/>
  <text x="48" y="58" fill="#152033"
        font-family="system-ui, sans-serif" font-size="38"
        font-weight="750">STIX type-color compatibility theme</text>
  <text x="48" y="92" fill="#526078"
        font-family="system-ui, sans-serif" font-size="16">
    Non-normative OASIS visualizer cues, adapted for accessible currentColor rendering.
  </text>
  <text x="48" y="118" fill="#526078"
        font-family="system-ui, sans-serif" font-size="14">
    Each row shows colored-background and standalone variants; monochrome remains the default.
  </text>
  ${themePanel("light", 48)}
  ${themePanel("dark", 708)}
</svg>
`;

await writeFile(
  join(projectRoot, "preview", "color-scheme.svg"),
  normalizeGeneratedText(colorPreview),
);

const supportSections = [
  {
    name: "STIX 2.1 marking variants",
    entries: inventory.marking_variants,
  },
  {
    name: "TLP 2.0 compatibility",
    entries: inventory.modern_tlp_variants,
  },
  {
    name: "Predefined extension badges",
    entries: inventory.predefined_object_extensions,
  },
  {
    name: "OASIS candidate-extension objects",
    entries: inventory.extension_objects,
  },
  {
    name: "Marking-extension badges",
    entries: inventory.marking_extensions,
  },
  {
    name: "State and property indicators",
    entries: inventory.state_badges,
  },
  {
    name: "Fallbacks",
    entries: inventory.fallback_icons,
  },
  {
    name: "Legacy compatibility",
    entries: inventory.compatibility_aliases.filter((entry) => !entry.target),
  },
];

const supportIcons = [];
for (const section of supportSections) {
  for (const entry of section.entries) {
    const source = await readFile(join(projectRoot, entry.path), "utf8");
    const title = source.match(/<title>(.*?)<\/title>/s)?.[1]
      ?? entry.key
      ?? entry.type
      ?? entry.alias;
    const body = source
      .slice(source.indexOf(">") + 1, source.lastIndexOf("</svg>"))
      .replace(/<title>.*?<\/title>/s, "")
      .trim();
    supportIcons.push({
      ...entry,
      section: section.name,
      displayKey: entry.key ?? entry.type ?? entry.alias,
      title,
      body,
    });
  }
}

const supportColumns = 4;
const supportCardWidth = 330;
const supportCardHeight = 116;
const supportGap = 14;
const supportPadding = 42;
const supportHeader = 126;
const supportRows = Math.ceil(supportIcons.length / supportColumns);
const supportWidth = supportPadding * 2
  + supportColumns * supportCardWidth
  + (supportColumns - 1) * supportGap;
const supportHeight = supportHeader
  + supportRows * supportCardHeight
  + (supportRows - 1) * supportGap
  + 46;

const supportSymbols = supportIcons.map((icon, index) => `
    <symbol id="support-${index}" viewBox="0 0 64 64"
            fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round">
      ${icon.body}
    </symbol>`).join("");

const sectionColors = new Map([
  ["STIX 2.1 marking variants", "#7c3aed"],
  ["TLP 2.0 compatibility", "#b45309"],
  ["Predefined extension badges", "#0369a1"],
  ["OASIS candidate-extension objects", "#047857"],
  ["Marking-extension badges", "#6d28d9"],
  ["State and property indicators", "#be123c"],
  ["Fallbacks", "#475569"],
  ["Legacy compatibility", "#7c2d12"],
]);

const supportCards = supportIcons.map((icon, index) => {
  const column = index % supportColumns;
  const row = Math.floor(index / supportColumns);
  const x = supportPadding + column * (supportCardWidth + supportGap);
  const y = supportHeader + row * (supportCardHeight + supportGap);
  const accent = sectionColors.get(icon.section);
  const titleSize = icon.title.length > 31
    ? 11
    : icon.title.length > 26
    ? 12
    : 15;
  const sectionSize = icon.section.length > 30 ? 7.5 : 9.5;
  return `
  <g>
    <rect x="${x}" y="${y}" width="${supportCardWidth}"
          height="${supportCardHeight}" rx="13"
          fill="#ffffff" stroke="#d9e0e9"/>
    <rect x="${x}" y="${y}" width="5" height="${supportCardHeight}"
          rx="2.5" fill="${accent}"/>
    <use x="${x + 20}" y="${y + 22}" width="70" height="70"
         href="#support-${index}" color="${accent}"/>
    <text x="${x + 108}" y="${y + 30}" fill="${accent}"
          font-family="system-ui, sans-serif" font-size="${sectionSize}"
          font-weight="800" letter-spacing="0.7">${xmlEscape(icon.section.toUpperCase())}</text>
    <text x="${x + 108}" y="${y + 58}" fill="#152033"
          font-family="system-ui, sans-serif" font-size="${titleSize}"
          font-weight="700">${xmlEscape(icon.title)}</text>
    <text x="${x + 108}" y="${y + 82}" fill="#67738a"
          font-family="monospace" font-size="11">${xmlEscape(icon.displayKey)}</text>
  </g>`;
}).join("");

const supportCatalog = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${supportWidth} ${supportHeight}"
     role="img"
     aria-label="STIX marking, extension, state, fallback, and compatibility assets">
  <title>STIX semantic support asset catalog</title>
  <defs>${supportSymbols}
  </defs>
  <rect width="${supportWidth}" height="${supportHeight}" fill="#eef2f6"/>
  <text x="${supportPadding}" y="54" fill="#152033"
        font-family="system-ui, sans-serif" font-size="34"
        font-weight="750">STIX semantic support assets</text>
  <text x="${supportPadding}" y="86" fill="#526078"
        font-family="system-ui, sans-serif" font-size="16">
    Markings, extension badges and objects, state indicators, fallbacks, and legacy compatibility
  </text>
  ${supportCards}
</svg>
`;

await writeFile(
  join(projectRoot, "preview", "support-catalog.svg"),
  normalizeGeneratedText(supportCatalog),
);

const entitySymbol = (type, id) => {
  const icon = icons.find((candidate) => candidate.type === type);
  return `<symbol id="${id}" viewBox="0 0 64 64"
      fill="none" stroke="currentColor" stroke-width="3"
      stroke-linecap="round" stroke-linejoin="round">${icon.body}</symbol>`;
};
const supportSymbol = (key, id) => {
  const icon = supportIcons.find((candidate) => candidate.displayKey === key);
  return `<symbol id="${id}" viewBox="0 0 64 64"
      fill="none" stroke="currentColor" stroke-width="3"
      stroke-linecap="round" stroke-linejoin="round">${icon.body}</symbol>`;
};

const resolverPreview = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1200 440" role="img"
     aria-label="Examples of entity icons composed with semantic badges">
  <title>STIX semantic resolver composition examples</title>
  <defs>
    ${entitySymbol("file", "compose-file")}
    ${entitySymbol("artifact", "compose-artifact")}
    ${entitySymbol("indicator", "compose-indicator")}
    ${supportSymbol("archive-ext", "compose-archive")}
    ${supportSymbol("ntfs-ext", "compose-ntfs")}
    ${supportSymbol("defanged", "compose-defanged")}
    ${supportSymbol("revoked", "compose-revoked")}
    ${supportSymbol("tlp-red", "compose-tlp-red")}
  </defs>
  <rect width="1200" height="440" fill="#eef2f6"/>
  <text x="42" y="55" fill="#152033" font-family="system-ui, sans-serif"
        font-size="34" font-weight="750">Resolver composition examples</text>
  <text x="42" y="86" fill="#526078" font-family="system-ui, sans-serif"
        font-size="16">Base entity identity remains visible while semantic layers decorate it.</text>
  ${[
    {
      x: 42,
      title: "File with archive and NTFS",
      base: "compose-file",
      color: "#075985",
      badges: ["compose-archive", "compose-ntfs"],
    },
    {
      x: 332,
      title: "Defanged Artifact",
      base: "compose-artifact",
      color: "#4338ca",
      badges: ["compose-defanged"],
    },
    {
      x: 622,
      title: "Revoked Indicator",
      base: "compose-indicator",
      color: "#9f1239",
      badges: ["compose-revoked"],
    },
    {
      x: 912,
      title: "Indicator marked TLP:RED",
      base: "compose-indicator",
      color: "#374151",
      badges: ["compose-tlp-red"],
    },
  ].map((card) => `
  <g>
    <rect x="${card.x}" y="122" width="246" height="270" rx="18"
          fill="#ffffff" stroke="#d9e0e9"/>
    <circle cx="${card.x + 123}" cy="221" r="68" fill="#f8fafc"
            stroke="${card.color}" stroke-width="3"/>
    <use x="${card.x + 75}" y="173" width="96" height="96"
         href="#${card.base}" color="${card.color}"/>
    ${card.badges.map((badge, index) => `
    <circle cx="${card.x + 174 - index * 45}" cy="274" r="25"
            fill="#ffffff" stroke="#cbd5e1"/>
    <use x="${card.x + 156 - index * 45}" y="256" width="36" height="36"
         href="#${badge}" color="${card.color}"/>`).join("")}
    <text x="${card.x + 123}" y="338" text-anchor="middle"
          fill="#152033" font-family="system-ui, sans-serif"
          font-size="15" font-weight="700">${xmlEscape(card.title)}</text>
    <text x="${card.x + 123}" y="366" text-anchor="middle"
          fill="#67738a" font-family="system-ui, sans-serif"
          font-size="12">App supplies the accessible name</text>
  </g>`).join("")}
</svg>
`;

await writeFile(
  join(projectRoot, "preview", "resolver-composition.svg"),
  normalizeGeneratedText(resolverPreview),
);

const categoryCounts = Object.entries(
  icons.reduce((counts, icon) => {
    counts[icon.category] = (counts[icon.category] ?? 0) + 1;
    return counts;
  }, {}),
);

const coverageRows = icons.map((icon) =>
  `| \`${icon.type}\` | ${icon.category} | [${icon.relativePath}](${icon.relativePath}) | Complete |`
).join("\n");

const supportCoverageSections = supportSections.map((section) => {
  const rows = section.entries.map((entry) => {
    const key = entry.key ?? entry.type ?? entry.alias;
    return `| \`${key}\` | [${entry.path}](${entry.path}) | Complete |`;
  }).join("\n");
  return `## ${section.name}

| Semantic key | SVG | Status |
| --- | --- | --- |
${rows}`;
}).join("\n\n");

const exportProfile = inventory.export_profiles.freetaxii_issue_4;
const exportRows = exportProfile.types.map((type) => {
  const path = `${exportProfile.output_directory}/${type}-300-dpi.png`;
  return `| \`${type}\` | [${path}](${path}) | `
    + `${exportProfile.width} × ${exportProfile.height} | `
    + `${exportProfile.dpi} dpi |`;
}).join("\n");

const coverage = `# STIX 2.1 Icon Coverage

Generated from \`stix-2.1-icon-inventory.json\`.

- Standard top-level entity types: **${icons.length}**
- Completed canonical entity SVGs: **${icons.length}**
- Completed semantic support SVGs: **${supportIcons.length}**
- Unique SVG assets: **${new Set([
  ...icons.map((icon) => icon.relativePath),
  ...supportIcons.map((icon) => icon.path),
]).size}**
- Deterministic PNG exports: **${exportProfile.types.length}**
- Canonical entity coverage: **100%**
- Category split: ${categoryCounts.map(([name, count]) => `${name} ${count}`).join(", ")}

Markings, predefined extensions, extension-defined objects, state indicators,
fallbacks, and compatibility artwork are reported independently. They do not
change the canonical count of 43 top-level entity types.

## Canonical top-level entities

| STIX type | Category | SVG | Status |
| --- | --- | --- | --- |
${coverageRows}

${supportCoverageSections}

## FreeTAXII issue #4 PNG exports

| STIX type | PNG | Dimensions | Resolution metadata |
| --- | --- | --- | --- |
${exportRows}

## Compatibility aliases

Aliases reuse canonical or support assets unless they represent a preserved
legacy concept. Resolver behavior is tested by \`tools/resolve-icon.test.mjs\`.

| Alias | Target | SVG |
| --- | --- | --- |
${inventory.compatibility_aliases.map((entry) =>
  `| \`${entry.alias}\` | ${entry.target ? `\`${entry.target}\`` : "Legacy presentation"} | [${entry.path}](${entry.path}) |`
).join("\n")}
`;

await writeFile(
  join(projectRoot, "COVERAGE.md"),
  normalizeGeneratedText(coverage),
);

process.stdout.write(
  `Generated entity, small-size, color, support, and resolver catalogs plus `
  + `COVERAGE.md for ${icons.length} entities and ${supportIcons.length} `
  + `support entries.\n`,
);
