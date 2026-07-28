import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createIconResolver,
  loadIconInventory,
  resolveIcon,
} from "./resolve-icon.mjs";

const inventory = await loadIconInventory();
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test("inventory preserves 43 canonical entities and structured coverage", () => {
  assert.equal(inventory.entities.length, 43);
  assert.equal(inventory.marking_variants.length, 5);
  assert.equal(inventory.modern_tlp_variants.length, 2);
  assert.equal(inventory.predefined_object_extensions.length, 12);
  assert.equal(inventory.extension_objects.length, 4);
  assert.equal(inventory.marking_extensions.length, 3);
  assert.ok(inventory.entities.every((entry) => entry.path));
  assert.ok(inventory.compatibility_aliases.every((entry) => entry.path));
});

test("every asset-bearing inventory entry points to an existing file", async () => {
  const groups = [
    inventory.entities,
    inventory.marking_variants,
    inventory.modern_tlp_variants,
    inventory.predefined_object_extensions,
    inventory.extension_objects,
    inventory.marking_extensions,
    inventory.state_badges,
    inventory.fallback_icons,
    inventory.compatibility_aliases,
  ];
  await Promise.all(
    groups.flat().map((entry) => access(join(projectRoot, entry.path))),
  );
});

test("canonical TLP ID has highest precedence", () => {
  const result = resolveIcon({
    type: "indicator",
    id: "marking-definition--5e57c739-391a-4eb3-b6be-7d15ca92d5ed",
    definition_type: "tlp",
    definition: { tlp: "green" },
  });
  assert.equal(result.primary.key, "tlp-red");
  assert.equal(result.primary.reason, "canonical-tlp-id");
});

test("marking extension ID wins over deprecated definition content", () => {
  const result = resolveIcon({
    type: "marking-definition",
    definition_type: "tlp",
    definition: { tlp: "amber" },
    extensions: {
      "extension-definition--dff17fb3-edcb-4f99-ad1b-4b751c95738a": {},
    },
  });
  assert.equal(result.primary.key, "cui");
  assert.equal(result.primary.reason, "marking-extension-id");
});

test("definition subtype and TLP 2.0 values resolve semantically", () => {
  assert.equal(
    resolveIcon({
      type: "marking-definition",
      definition_type: "statement",
      definition: { statement: "Copyright Example" },
    }).primary.key,
    "statement-marking",
  );
  assert.equal(
    resolveIcon({
      type: "marking-definition",
      definition_type: "tlp",
      definition: { tlp: "amber-strict" },
    }).primary.key,
    "tlp-amber-strict",
  );
});

test("exact type remains primary while predefined extensions become badges", () => {
  const result = resolveIcon({
    type: "file",
    extensions: {
      "archive-ext": {},
      "ntfs-ext": {},
    },
  });
  assert.equal(result.primary.key, "file");
  assert.deepEqual(
    result.badges.map((entry) => entry.key),
    ["archive-ext", "ntfs-ext"],
  );
});

test("candidate extension ID can resolve an otherwise unknown object type", () => {
  const result = resolveIcon({
    type: "x-example-event",
    extensions: {
      "extension-definition--4ca6de00-5b0d-45ef-a1dc-ea7279ea910e": {
        extension_type: "new-sdo",
      },
    },
  });
  assert.equal(result.primary.key, "event");
  assert.equal(result.primary.reason, "attached-extension-id");
});

test("unknown Extension Definition receives the generic extension badge", () => {
  const result = resolveIcon({
    type: "indicator",
    extensions: {
      "extension-definition--aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": {},
    },
  });
  assert.equal(result.badges[0].key, "custom-extension");
});

test("aliases and category-specific fallbacks remain supported", () => {
  assert.deepEqual(
    {
      key: resolveIcon("coa").primary.key,
      target: resolveIcon("coa").primary.target,
    },
    { key: "coa", target: "course-of-action" },
  );
  assert.equal(
    resolveIcon({ type: "x-example", icon_category: "SCO" }).primary.key,
    "custom-sco",
  );
  assert.equal(resolveIcon({ type: "x-example" }).primary.key, "custom-object");
});

test("state and field-level marking badges are independent overlays", () => {
  const result = resolveIcon({
    type: "artifact",
    defanged: true,
    revoked: true,
    lang: "en",
    granular_markings: [{ lang: "fr", selectors: ["name"] }],
  });
  assert.deepEqual(
    result.states.map((entry) => entry.key),
    ["defanged", "revoked", "granular-marking", "language-marking"],
  );
});

test("a resolver can be constructed from a supplied inventory", () => {
  const resolver = createIconResolver(inventory);
  assert.equal(resolver("observed-string").primary.kind, "extension-object");
});
