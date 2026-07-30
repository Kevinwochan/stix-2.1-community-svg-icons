export interface IconAsset {
  key: string;
  path: `icons/${string}`;
  kind: string;
  reason: string;
  target?: string;
}

export interface ResolvedIcon {
  primary: IconAsset;
  badges: IconAsset[];
  states: IconAsset[];
}

export interface IconInventory {
  entities: Array<Record<string, unknown>>;
  marking_variants: Array<Record<string, unknown>>;
  modern_tlp_variants: Array<Record<string, unknown>>;
  predefined_object_extensions: Array<Record<string, unknown>>;
  extension_objects: Array<Record<string, unknown>>;
  marking_extensions: Array<Record<string, unknown>>;
  state_badges: Array<Record<string, unknown>>;
  fallback_icons: Array<Record<string, unknown>>;
  compatibility_aliases: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type IconResolver = (
  input: string | Record<string, unknown>,
  options?: { category?: string },
) => ResolvedIcon;

export function loadIconInventory(path?: string | URL): Promise<IconInventory>;
export function createIconResolver(inventory: IconInventory): IconResolver;
export const resolveIcon: IconResolver;
