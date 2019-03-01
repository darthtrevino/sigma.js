import splitSquare from "../../utils/geometry/splitSquare";
import pointToSquare from "../../utils/geometry/pointToSquare";
import { Boundaries, QuadTree } from "../../utils/geometry/interfaces";
import { Node } from "../../../interfaces";
import { AbstractQuad } from "./AbstractQuad";

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
 * The quad API as exposed to sigma
 */

/**
 * The quad core that will become the sigma interface with the quadtree.
 *
 * property {object} _tree  Property holding the quadtree object.
 * property {object} _cache Cache for the area method.
 */
export default class Quad extends AbstractQuad<Node> {
  /**
   * Creates the quadtree object itself.
   *
   * @param  {object}   bounds       The boundaries of the quad defined by an
   *                                 origin (x, y), width and heigth.
   * @param  {integer}  level        The level of the quad in the tree.
   * @param  {integer}  maxElements  The max number of element in a leaf node.
   * @param  {integer}  maxLevel     The max recursion level of the tree.
   * @return {object}                The quadtree object.
   */
  protected createQuadTree(
    bounds: Boundaries,
    level: number,
    maxElements: number,
    maxLevel: number
  ): QuadTree<Node> {
    return {
      level: level || 0,
      bounds,
      corners: splitSquare(bounds),
      maxElements: maxElements || 20,
      maxLevel: maxLevel || 4,
      elements: [],
      nodes: []
    };
  }

  protected addItem(node: Node) {
    const { prefix } = this;
    this.quadInsert(
      node,
      pointToSquare({
        x: node[`${prefix}x`],
        y: node[`${prefix}y`],
        size: node[`${prefix}size`]
      }),
      this.tree!
    );
  }
}
