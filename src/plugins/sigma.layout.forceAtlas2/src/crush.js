/**
 * Exporting
 * ----------
 *
 * Crush the worker function and make it accessible by sigma's instances so
 * the supervisor can call it.
 */
export default function crush(fnString) {
  let pattern;
  let i;
  let l;

  const np = [
    "x",
    "y",
    "dx",
    "dy",
    "old_dx",
    "old_dy",
    "mass",
    "convergence",
    "size",
    "fixed"
  ];

  const ep = ["source", "target", "weight"];

  const rp = [
    "node",
    "centerX",
    "centerY",
    "size",
    "nextSibling",
    "firstChild",
    "mass",
    "massCenterX",
    "massCenterY"
  ];

  // rp
  // NOTE: Must go first
  for (i = 0, l = rp.length; i < l; i++) {
    pattern = new RegExp(`rp\\(([^,]*), '${rp[i]}'\\)`, "g");
    fnString = fnString.replace(pattern, i === 0 ? "$1" : `$1 + ${i}`);
  }

  // np
  for (i = 0, l = np.length; i < l; i++) {
    pattern = new RegExp(`np\\(([^,]*), '${np[i]}'\\)`, "g");
    fnString = fnString.replace(pattern, i === 0 ? "$1" : `$1 + ${i}`);
  }

  // ep
  for (i = 0, l = ep.length; i < l; i++) {
    pattern = new RegExp(`ep\\(([^,]*), '${ep[i]}'\\)`, "g");
    fnString = fnString.replace(pattern, i === 0 ? "$1" : `$1 + ${i}`);
  }

  return fnString;
}
