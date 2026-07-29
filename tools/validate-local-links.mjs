#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];

const checkTarget = async (sourcePath, target) => {
  if (
    target.startsWith("http://")
    || target.startsWith("https://")
    || target.startsWith("#")
    || target.startsWith("mailto:")
  ) {
    return;
  }
  const cleanTarget = decodeURIComponent(target.split("#")[0].split("?")[0]);
  try {
    await access(join(dirname(sourcePath), cleanTarget));
  } catch {
    errors.push(
      `${sourcePath.slice(projectRoot.length + 1)}: missing ${target}`,
    );
  }
};

for (const relativePath of ["README.md", "COVERAGE.md", "UPSTREAM.md"]) {
  const path = join(projectRoot, relativePath);
  const source = await readFile(path, "utf8");
  const targets = [...source.matchAll(/\[[^\]]*]\(([^)]+)\)/g)]
    .map((match) => match[1]);
  await Promise.all(targets.map((target) => checkTarget(path, target)));
}

const previewPath = join(projectRoot, "preview", "index.html");
const preview = await readFile(previewPath, "utf8");
const previewTargets = [...preview.matchAll(/\b(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1]);
await Promise.all(
  previewTargets.map((target) => checkTarget(previewPath, target)),
);

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Validated local Markdown links and preview HTML asset references.\n",
  );
}
