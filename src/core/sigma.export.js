/* eslint-disable no-global-assign */
// Hardcoded export for the node.js version:
const { sigma } = this;

// Dirty polyfills to permit sigma usage in node
if (typeof HTMLElement === "undefined") HTMLElement = function noop() {};

if (typeof window === "undefined")
  window = {
    addEventListener() {}
  };

if (typeof exports !== "undefined") {
  if (typeof module !== "undefined" && module.exports)
    exports = module.exports = sigma;
  exports.sigma = sigma;
}