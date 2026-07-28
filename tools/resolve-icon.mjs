import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export const loadIconInventory = async (
  path = join(projectRoot, "stix-2.1-icon-inventory.json"),
) => JSON.parse(await readFile(path, "utf8"));

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const asset = (entry, kind, reason) => {
  const result = {
    key: entry.key ?? entry.type ?? entry.alias,
    path: entry.path,
    kind,
    reason,
  };
  if ("target" in entry) result.target = entry.target;
  return result;
};

export const createIconResolver = (inventory) => {
  const entitiesByType = new Map(
    inventory.entities.map((entry) => [entry.type, entry]),
  );
  const extensionObjectsByType = new Map(
    inventory.extension_objects.map((entry) => [entry.type, entry]),
  );
  const extensionObjectsById = new Map(
    inventory.extension_objects.map((entry) => [
      entry.extension_definition_id,
      entry,
    ]),
  );
  const markings = [
    ...inventory.marking_variants,
    ...inventory.modern_tlp_variants,
  ];
  const canonicalTlpById = new Map(
    markings
      .filter((entry) => entry.canonical_id)
      .map((entry) => [entry.canonical_id, entry]),
  );
  const markingExtensionsById = new Map(
    inventory.marking_extensions.map((entry) => [
      entry.extension_definition_id,
      entry,
    ]),
  );
  const markingByValue = new Map();
  for (const entry of markings.filter((candidate) => candidate.value)) {
    markingByValue.set(normalize(entry.value), entry);
    for (const alias of entry.value_aliases ?? []) {
      markingByValue.set(normalize(alias), entry);
    }
  }
  const markingByDefinitionType = new Map(
    inventory.marking_variants
      .filter((entry) => entry.definition_type !== "tlp")
      .map((entry) => [entry.definition_type, entry]),
  );
  const predefinedExtensionsByType = new Map(
    inventory.predefined_object_extensions.map((entry) => [entry.type, entry]),
  );
  const fallbacksByCategory = new Map(
    inventory.fallback_icons.map((entry) => [entry.category, entry]),
  );
  const fallbacksByKey = new Map(
    inventory.fallback_icons.map((entry) => [entry.key, entry]),
  );
  const aliasesByName = new Map(
    inventory.compatibility_aliases.map((entry) => [entry.alias, entry]),
  );

  const resolve = (input, options = {}) => {
    const object = typeof input === "string" ? { type: input } : input ?? {};
    const type = normalize(object.type);
    const extensionKeys = Object.keys(object.extensions ?? {});
    let primary;

    // 1. Canonical STIX TLP marking ID.
    const canonicalTlp = canonicalTlpById.get(object.id);
    if (canonicalTlp) {
      primary = asset(canonicalTlp, "marking", "canonical-tlp-id");
    }

    // 2. Marking Extension Definition ID.
    if (!primary) {
      const markingExtensionId = extensionKeys.find((key) =>
        markingExtensionsById.has(key)
      );
      if (markingExtensionId) {
        primary = asset(
          markingExtensionsById.get(markingExtensionId),
          "marking-extension",
          "marking-extension-id",
        );
      }
    }

    // 3. Deprecated marking definition subtype/value representation.
    if (!primary && type === "marking-definition") {
      const definitionType = normalize(object.definition_type);
      if (definitionType === "tlp") {
        const value = normalize(
          object.definition?.tlp
            ?? object.tlp
            ?? object.name?.replace(/^TLP\s*:\s*/i, ""),
        );
        const marking = markingByValue.get(value);
        if (marking) {
          primary = asset(marking, "marking", "definition-value");
        }
      } else {
        const marking = markingByDefinitionType.get(definitionType);
        if (marking) {
          primary = asset(marking, "marking", "definition-type");
        }
      }
    }

    // 4. Exact canonical or candidate object type, followed by aliases.
    if (!primary) {
      const exact = entitiesByType.get(type) ?? extensionObjectsByType.get(type);
      if (exact) {
        primary = asset(
          exact,
          entitiesByType.has(type) ? "entity" : "extension-object",
          "exact-type",
        );
      } else {
        const alias = aliasesByName.get(type);
        if (alias) primary = asset(alias, "compatibility-alias", "alias");
      }
    }

    // 5. Attached Extension Definition ID for a candidate new object.
    if (!primary) {
      const extensionObjectId = extensionKeys.find((key) =>
        extensionObjectsById.has(key)
      );
      if (extensionObjectId) {
        primary = asset(
          extensionObjectsById.get(extensionObjectId),
          "extension-object",
          "attached-extension-id",
        );
      }
    }

    // 6. Category-specific or generic fallback.
    if (!primary) {
      const category = options.category ?? object.icon_category ?? "unknown";
      const fallback = fallbacksByCategory.get(category)
        ?? fallbacksByKey.get("custom-object");
      primary = asset(fallback, "fallback", "fallback");
    }

    const badges = [];
    for (const extensionKey of extensionKeys) {
      const known = predefinedExtensionsByType.get(extensionKey);
      if (known) {
        badges.push(asset(known, "extension-badge", "attached-extension-key"));
        continue;
      }
      if (
        !markingExtensionsById.has(extensionKey)
        && !extensionObjectsById.has(extensionKey)
        && extensionKey.startsWith("extension-definition--")
      ) {
        badges.push(
          asset(
            fallbacksByKey.get("custom-extension"),
            "extension-badge",
            "unknown-extension-definition",
          ),
        );
      }
    }

    const states = [];
    for (const state of inventory.state_badges) {
      if (
        (state.key === "granular-marking"
          && Array.isArray(object.granular_markings)
          && object.granular_markings.length > 0)
        || (state.key === "language-marking"
          && (
            Boolean(object.lang)
            || object.granular_markings?.some((marking) => Boolean(marking.lang))
          ))
        || (state.key !== "granular-marking"
          && state.key !== "language-marking"
          && object[state.property] === true)
      ) {
        states.push(asset(state, "state-badge", `property:${state.property}`));
      }
    }

    return { primary, badges, states };
  };

  return resolve;
};

const defaultInventory = await loadIconInventory();
export const resolveIcon = createIconResolver(defaultInventory);
