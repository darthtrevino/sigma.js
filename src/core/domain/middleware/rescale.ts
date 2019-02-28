import getBoundaries from "../utils/geometry/getBoundaries";
import Sigma from "../classes/Sigma";
import { Keyed } from "../../interfaces";

/**
 * This middleware will rescale the graph such that it takes an optimal space
 * on the renderer.
 *
 * @param {?string} readPrefix  The read prefix.
 * @param {?string} writePrefix The write prefix.
 * @param {object}  options     The parameters.
 */
export default function rescale(
  this: Sigma,
  readPrefix: string,
  writePrefix: string,
  options?: any
) {
  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let scale: number;
  const settings = this.settings.embedObjects(options || {});
  const bounds =
    settings("bounds") || getBoundaries(this.graph, readPrefix, true);

  let { minX, minY, maxX, maxY } = bounds;
  const { sizeMax, weightMax } = bounds;
  const w = settings("width") || 1;
  const h = settings("height") || 1;

  let rescaleSettings = settings("autoRescale");
  const validSettings: Keyed<any> = {
    nodePosition: 1,
    nodeSize: 1,
    edgeSize: 1
  };

  /**
   * What elements should we rescale?
   */
  if (!(rescaleSettings instanceof Array)) {
    rescaleSettings = ["nodePosition", "nodeSize", "edgeSize"];
  }

  rescaleSettings.forEach(setting => {
    if (!validSettings[setting])
      throw new Error(`The rescale setting "${setting}" is not recognized.`);
  });

  const np = ~rescaleSettings.indexOf("nodePosition");
  const ns = ~rescaleSettings.indexOf("nodeSize");
  const es = ~rescaleSettings.indexOf("edgeSize");

  /**
   * First, we compute the scaling ratio, without considering the sizes
   * of the nodes : Each node will have its center in the canvas, but might
   * be partially out of it.
   */
  scale =
    settings("scalingMode") === "outside"
      ? Math.max(w / Math.max(maxX - minX, 1), h / Math.max(maxY - minY, 1))
      : Math.min(w / Math.max(maxX - minX, 1), h / Math.max(maxY - minY, 1));

  /**
   * Then, we correct that scaling ratio considering a margin, which is
   * basically the size of the biggest node.
   * This has to be done as a correction since to compare the size of the
   * biggest node to the X and Y values, we have to first get an
   * approximation of the scaling ratio.
   * */
  const margin =
    (settings("rescaleIgnoreSize")
      ? 0
      : (settings("maxNodeSize") || sizeMax) / scale) +
    (settings("sideMargin") || 0);
  maxX += margin;
  minX -= margin;
  maxY += margin;
  minY -= margin;

  // Fix the scaling with the new extrema:
  scale =
    settings("scalingMode") === "outside"
      ? Math.max(w / Math.max(maxX - minX, 1), h / Math.max(maxY - minY, 1))
      : Math.min(w / Math.max(maxX - minX, 1), h / Math.max(maxY - minY, 1));

  // Size homothetic parameters:
  if (!settings("maxNodeSize") && !settings("minNodeSize")) {
    a = 1;
    b = 0;
  } else if (settings("maxNodeSize") === settings("minNodeSize")) {
    a = 0;
    b = +settings("maxNodeSize");
  } else {
    a = (settings("maxNodeSize") - settings("minNodeSize")) / sizeMax;
    b = +settings("minNodeSize");
  }

  if (!settings("maxEdgeSize") && !settings("minEdgeSize")) {
    c = 1;
    d = 0;
  } else if (settings("maxEdgeSize") === settings("minEdgeSize")) {
    c = 0;
    d = +settings("minEdgeSize");
  } else {
    c = (settings("maxEdgeSize") - settings("minEdgeSize")) / weightMax;
    d = +settings("minEdgeSize");
  }

  // Rescale the nodes and edges:
  this.graph.edges().forEach(edge => {
    edge[`${writePrefix}size`] =
      edge[`${readPrefix}size`] * (es ? c : 1) + (es ? d : 0);
  });

  this.graph.nodes().forEach(node => {
    node[`${writePrefix}size`] =
      node[`${readPrefix}size`] * (ns ? a : 1) + (ns ? b : 0);
    node[`${writePrefix}x`] =
      (node[`${readPrefix}x`] - (maxX + minX) / 2) * (np ? scale : 1);
    node[`${writePrefix}y`] =
      (node[`${readPrefix}y`] - (maxY + minY) / 2) * (np ? scale : 1);
  });
}
