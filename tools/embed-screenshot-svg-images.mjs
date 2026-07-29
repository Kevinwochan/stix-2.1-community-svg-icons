import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotDir = resolve(root, "preview/pr-screenshots");

const embedImages = async (templateName) => {
  const templatePath = resolve(screenshotDir, `${templateName}.template.svg`);
  let output = await readFile(templatePath, "utf8");
  const imagePattern = /<image href="([^"]+)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"\/>/g;
  const matches = [...output.matchAll(imagePattern)];

  for (const match of matches) {
    const [, href, x, y, width, height] = match;
    const assetPath = resolve(screenshotDir, href);
    const asset = await readFile(assetPath, "utf8");
    const rootAttributes = asset.match(/<svg([^>]*)>/)?.[1];
    const viewBox = rootAttributes?.match(/viewBox="([^"]+)"/)?.[1];
    const inner = asset.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
    if (!rootAttributes || !viewBox || inner === undefined) {
      throw new Error(`Cannot embed ${assetPath}`);
    }
    const presentationAttributes = rootAttributes
      .replace(/\s+xmlns="[^"]*"/g, "")
      .replace(/\s+viewBox="[^"]*"/g, "")
      .replace(/\s+role="[^"]*"/g, "")
      .replace(/\s+aria-label="[^"]*"/g, "")
      .replace(/\s+focusable="[^"]*"/g, "")
      .trim();
    const embedded =
      `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
      `viewBox="${viewBox}" ${presentationAttributes}>${inner}</svg>`;
    output = output.replace(match[0], embedded);
  }

  await writeFile(resolve(screenshotDir, `${templateName}.svg`), output);
};

await embedImages("tlp-variants");
await embedImages("variant-decision");
