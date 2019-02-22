import toSVG from "./src/toSVG";

export default function extend(sigma) {
  /**
   * Sigma SVG Exporter
   * ===================
   *
   * This plugin is designed to export a graph to a svg file that can be
   * downloaded or just used elsewhere.
   *
   * Author: Guillaume Plique (Yomguithereal)
   * Version: 0.0.1
   */
  sigma.prototype.toSVG = toSVG;
}
