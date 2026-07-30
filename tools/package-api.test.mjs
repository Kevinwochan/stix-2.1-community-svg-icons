import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  createIconResolver,
  getIconUrl,
  loadIconInventory,
  resolveIcon,
} from "../index.mjs";

test("package root exports the resolver and an addressable SVG URL", async () => {
  const result = resolveIcon("indicator");
  assert.equal(result.primary.key, "indicator");
  assert.equal(result.primary.path, "icons/sdo/indicator.svg");

  const url = getIconUrl(result.primary);
  assert.equal(url.protocol, "file:");
  await access(url);
});

test("package API can construct a resolver from the exported inventory", async () => {
  const inventory = await loadIconInventory();
  const resolver = createIconResolver(inventory);
  assert.equal(
    resolver({
      type: "marking-definition",
      definition_type: "tlp",
      definition: { tlp: "amber+strict" },
    }).primary.path,
    "icons/marking/tlp-amber-strict.svg",
  );
});

test("getIconUrl rejects paths outside the packaged icon tree", () => {
  assert.throws(() => getIconUrl("../README.md"), TypeError);
  assert.throws(() => getIconUrl({ path: "README.md" }), TypeError);
});
