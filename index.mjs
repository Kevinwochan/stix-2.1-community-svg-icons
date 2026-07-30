export {
  createIconResolver,
  loadIconInventory,
  resolveIcon,
} from "./tools/resolve-icon.mjs";

export const getIconUrl = (assetOrPath) => {
  const path = typeof assetOrPath === "string"
    ? assetOrPath
    : assetOrPath?.path;

  if (
    typeof path !== "string"
    || !path.startsWith("icons/")
    || path.includes("..")
  ) {
    throw new TypeError(
      "getIconUrl expects an icon asset or an icons/... package path",
    );
  }

  return new URL(`./${path}`, import.meta.url);
};
