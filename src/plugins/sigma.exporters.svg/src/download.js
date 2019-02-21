import createBlob from "./createBlob";

export default function download(string, filename, global = window) {
  /**
   * Polyfills
   */
  const URL = global.URL || global.webkitURL || global;

  // Creating blob href
  const blob = createBlob(string);

  // Anchor
  const o = {};
  o.anchor = document.createElement("a");
  o.anchor.setAttribute("href", URL.createObjectURL(blob));
  o.anchor.setAttribute("download", filename);

  // Click event
  const event = document.createEvent("MouseEvent");
  event.initMouseEvent(
    "click",
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );

  URL.revokeObjectURL(blob);

  o.anchor.dispatchEvent(event);
  delete o.anchor;
}
