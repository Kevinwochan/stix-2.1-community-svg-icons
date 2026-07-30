export {
  createIconResolver,
  loadIconInventory,
  resolveIcon,
} from "./tools/resolve-icon.mjs";
export type {
  IconAsset,
  IconInventory,
  IconResolver,
  ResolvedIcon,
} from "./tools/resolve-icon.mjs";

import type { IconAsset } from "./tools/resolve-icon.mjs";

export function getIconUrl(assetOrPath: IconAsset | string): URL;
