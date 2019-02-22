/**
 * Utilities
 */
export default function createBlob(data) {
  return new Blob([data], { type: "image/svg+xml;charset=utf-8" });
}
