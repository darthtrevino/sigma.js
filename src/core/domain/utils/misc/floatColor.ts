import { Keyed } from "../../../interfaces";

const floatColorCache: Keyed<{ color: number; alpha: number }> = {};

export default function floatColor(
  input: string
): { color: number; alpha: number } {
  let val = input;

  // Is the color already computed?
  if (floatColorCache[val]) {
    return floatColorCache[val];
  }

  const original = val;
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 1.0;

  if (val[0] === "#") {
    val = val.slice(1);

    if (val.length === 3) {
      r = parseInt(val.charAt(0) + val.charAt(0), 16);
      g = parseInt(val.charAt(1) + val.charAt(1), 16);
      b = parseInt(val.charAt(2) + val.charAt(2), 16);
    } else {
      r = parseInt(val.charAt(0) + val.charAt(1), 16);
      g = parseInt(val.charAt(2) + val.charAt(3), 16);
      b = parseInt(val.charAt(4) + val.charAt(5), 16);
    }
  } else if (val.match(/^ *rgba? *\(/)) {
    const matches = val.match(
      /^ *rgba? *\( *([0-9]*) *, *([0-9]*) *, *([0-9]*) *,? *([0-9]*\.?[0-9]*)?\) *$/
    );
    if (matches) {
      r = +matches[1];
      g = +matches[2];
      b = +matches[3];
      a = +matches[4];
    }
  }

  const color = r * 256 * 256 + g * 256 + b;

  // Caching the color
  const result = { color, alpha: a };
  floatColorCache[original] = result;
  return result;
}
