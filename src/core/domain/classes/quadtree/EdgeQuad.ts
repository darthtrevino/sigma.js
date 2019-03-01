import getQuadraticControlPoint from "../../utils/geometry/getQuadraticControlPoint";
import splitSquare from "../../utils/geometry/splitSquare";
import selfLoopToSquare from "../../utils/geometry/selfLoopToSquare";
import quadraticCurveToSquare from "../../utils/geometry/quadraticCurveToSquare";
import lineToSquare from "../../utils/geometry/lineToSquare";
import { QuadTree, Boundaries } from "../../utils/geometry/interfaces";
import { Edge } from "../../../interfaces";
import { AbstractQuad } from "./AbstractQuad";
import Graph from "../Graph";

/**
 * Sigma Quadtree Module for edges
 * ===============================
 *
 * Author: Sébastien Heymann,
 *   from the quad of Guillaume Plique (Yomguithereal)
 * Version: 0.2
 */

/**
 * Quad Functions
 * ------------
 *
 * The Quadtree functions themselves.
 * For each of those functions, we consider that in a splitted quad, the
 * index of each node is the following:
 * 0: top left
 * 1: top right
 * 2: bottom left
 * 3: bottom right
 *
 * Moreover, the hereafter quad's philosophy is to consider that if an element
 * collides with more than one nodes, this element belongs to each of the
 * nodes it collides with where other would let it lie on a higher node.
 */

/**
 * Sigma Quad Constructor
 * ----------------------
 *
 * The edgequad API as exposed to sigma
 */

/**
 * The edgequad core that will become the sigma interface with the quadtree.
 *
 * property {object} tree     Property holding the quadtree object.
 * property {object} cache    Cache for the area method.
 * property {boolean} enabled Can index and retreive elements.
 */
export default class EdgeQuad extends AbstractQuad<Edge> {
  constructor(private graph: Graph) {
    super();
  }

  protected addItem(edge: Edge) {
    const { prefix } = this;
    const [source, target] = this.graph.nodes(edge.source, edge.target);

    const e = {
      x1: source[`${prefix}x`],
      y1: source[`${prefix}y`],
      x2: target[`${prefix}x`],
      y2: target[`${prefix}y`],
      size: edge[`${prefix}size`] || 0
    };

    // Inserting edge
    if (edge.type === "curve" || edge.type === "curvedArrow") {
      if (source.id === target.id) {
        const n = {
          x: source[`${prefix}x`],
          y: source[`${prefix}y`],
          size: source[`${prefix}size`] || 0
        };
        this.quadInsert(edge, selfLoopToSquare(n), this.tree!);
      } else {
        const cp = getQuadraticControlPoint(e.x1, e.y1, e.x2, e.y2);
        this.quadInsert(edge, quadraticCurveToSquare(e, cp), this.tree!);
      }
    } else {
      this.quadInsert(edge, lineToSquare(e), this.tree!);
    }
  }

  protected createQuadTree(
    bounds: Boundaries,
    level: number,
    maxElements: number,
    maxLevel: number
  ): QuadTree<Edge> {
    return {
      level: level || 0,
      bounds,
      corners: splitSquare(bounds),
      maxElements: maxElements || 40,
      maxLevel: maxLevel || 8,
      elements: [],
      nodes: []
    };
  }
}
