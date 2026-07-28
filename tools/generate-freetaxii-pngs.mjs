#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const inventory = JSON.parse(
  readFileSync(
    join(projectRoot, "stix-2.1-icon-inventory.json"),
    "utf8",
  ),
);
const profile = inventory.export_profiles.freetaxii_issue_4;
const outputDirectory = join(projectRoot, profile.output_directory);
const requestedTypes = profile.types;
const pixelsPerMeter = Math.round(profile.dpi / 0.0254);
const pngSignature = Buffer.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
]);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0
      ? 0xedb88320 ^ (value >>> 1)
      : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const makeChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    8 + data.length,
  );
  return chunk;
};

const withPhysicalResolution = (png) => {
  if (!png.subarray(0, 8).equals(pngSignature)) {
    throw new Error("Renderer did not return a PNG");
  }
  const chunks = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const end = offset + 12 + length;
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type !== "pHYs") chunks.push(png.subarray(offset, end));
    if (type === "IHDR") {
      const data = Buffer.alloc(9);
      data.writeUInt32BE(pixelsPerMeter, 0);
      data.writeUInt32BE(pixelsPerMeter, 4);
      data[8] = 1;
      chunks.push(makeChunk("pHYs", data));
    }
    offset = end;
  }
  return Buffer.concat([pngSignature, ...chunks]);
};

mkdirSync(outputDirectory, { recursive: true });

for (const type of requestedTypes) {
  const source = join(projectRoot, profile.source_directory, `${type}.svg`);
  const render = spawnSync(
    "rsvg-convert",
    [
      "--width",
      String(profile.width),
      "--height",
      String(profile.height),
      source,
    ],
    { encoding: null },
  );
  if (render.status !== 0) {
    throw new Error(
      `Failed to render ${type}: ${render.stderr?.toString() ?? ""}`,
    );
  }
  const png = withPhysicalResolution(render.stdout);
  writeFileSync(
    join(outputDirectory, `${type}-300-dpi.png`),
    png,
  );
}

const readMetadata = (path) => {
  const png = readFileSync(path);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "pHYs") {
      return {
        width,
        height,
        x: png.readUInt32BE(offset + 8),
        y: png.readUInt32BE(offset + 12),
        unit: png[offset + 16],
      };
    }
    offset += 12 + length;
  }
  return { width, height };
};

for (const type of requestedTypes) {
  const output = join(outputDirectory, `${type}-300-dpi.png`);
  const metadata = readMetadata(output);
  if (
    metadata.width !== profile.width
    || metadata.height !== profile.height
    || metadata.x !== pixelsPerMeter
    || metadata.y !== pixelsPerMeter
    || metadata.unit !== 1
  ) {
    throw new Error(`${type}: invalid PNG dimensions or 300-dpi metadata`);
  }
}

process.stdout.write(
  `Generated ${requestedTypes.length} FreeTAXII PNG exports at `
  + `${profile.width} × ${profile.height} `
  + `with ${profile.dpi}-dpi metadata.\n`,
);
