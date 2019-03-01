import {
  Point,
  Boundaries,
  Rectangle,
  QuadTreeRectangle,
  RectangleCorners,
  QuadTree
} from "../../utils/geometry/interfaces";
import collision from "../../utils/geometry/collision";
import { Identified, Keyed } from "../../../interfaces";
import isAxisAligned from "../../utils/geometry/isAxisAligned";
import axisAlignedTopPoints from "../../utils/geometry/axisAlignedTopPoints";
import rectangleCorners from "../../utils/geometry/rectangleCorners";

/**
 * Get the index of the node containing the point in the quad
 *
 * @param  {object}  point      A point defined by coordinates (x, y).
 * @param  {object}  quadBounds Boundaries of the quad (x, y, width, heigth).
 * @return {integer}            The index of the node containing the point.
 */
function quadIndex(point: Point, quadBounds: Boundaries) {
  const xmp = quadBounds.x + quadBounds.width / 2;
  const ymp = quadBounds.y + quadBounds.height / 2;
  const top = point.y < ymp;
  const left = point.x < xmp;

  if (top) {
    if (left) return 0;
    return 1;
  }
  if (left) return 2;
  return 3;
}

/**
 * Get a list of indexes of nodes containing an axis-aligned rectangle
 *
 * @param  {object}  rectangle   A rectangle defined by two points (x1, y1),
 *                               (x2, y2) and height.
 * @param  {array}   quadCorners An array of the quad nodes' corners.
 * @return {array}               An array of indexes containing one to
 *                               four integers.
 */
function quadIndexes(
  rectangle: Rectangle,
  quadCorners: QuadTreeRectangle
): number[] {
  const indexes: number[] = [];

  // Iterating through quads
  for (let i = 0; i < 4; i++) {
    if (
      rectangle.x2 >= quadCorners[i][0].x &&
      rectangle.x1 <= quadCorners[i][1].x &&
      rectangle.y1 + rectangle.height >= quadCorners[i][0].y &&
      rectangle.y1 <= quadCorners[i][2].y
    ) {
      indexes.push(i);
    }
  }

  return indexes;
}

/**
 * Get a list of indexes of nodes containing a non-axis-aligned rectangle
 *
 * @param  {array}  corners      An array containing each corner of the
 *                               rectangle defined by its coordinates (x, y).
 * @param  {array}  quadCorners  An array of the quad nodes' corners.
 * @return {array}               An array of indexes containing one to
 *                               four integers.
 */
function quadCollision(
  corners: RectangleCorners,
  quadCorners: QuadTreeRectangle
): number[] {
  const indexes = [];

  // Iterating through quads
  for (let i = 0; i < 4; i++) {
    if (collision(corners, quadCorners[i])) indexes.push(i);
  }

  return indexes;
}

/**
 * Recursively retrieve every elements held by the node containing the
 * searched point.
 *
 * @param  {object}  point The searched point (x, y).
 * @param  {object}  quad  The searched quad.
 * @return {array}         An array of elements contained in the relevant
 *                         node.
 */
export function quadRetrievePoint<T>(point: Point, quad: QuadTree<T>): T[] {
  if (quad.level < quad.maxLevel) {
    const index = quadIndex(point, quad.bounds);

    // If node does not exist we return an empty list
    if (quad.nodes[index] !== undefined) {
      return quadRetrievePoint(point, quad.nodes[index]);
    }
    return [];
  }
  return quad.elements;
}

/**
 * Recursively retrieve every elements contained within an rectangular area
 * that may or may not be axis-aligned.
 *
 * @param  {object|array} rectData       The searched area defined either by
 *                                       an array of four corners (x, y) in
 *                                       the case of a non-axis-aligned
 *                                       rectangle or an object with two top
 *                                       points (x1, y1), (x2, y2) and height.
 * @param  {object}       quad           The searched quad.
 * @param  {function}     collisionFunc  The collision function used to search
 *                                       for node indexes.
 * @param  {array?}       els            The retrieved elements.
 * @return {array}                       An array of elements contained in the
 *                                       area.
 */

function quadRetrieveArea<T extends Identified>(
  rectData: RectangleCorners | Rectangle,
  quad: QuadTree<T>,
  collisionFunc: Function,
  els: Keyed<T> = {}
) {
  if (quad.level < quad.maxLevel) {
    const indexes = collisionFunc(rectData, quad.corners);

    for (let i = 0, l = indexes.length; i < l; i++)
      if (quad.nodes[indexes[i]] !== undefined)
        quadRetrieveArea(rectData, quad.nodes[indexes[i]], collisionFunc, els);
  } else
    for (let j = 0, m = quad.elements.length; j < m; j++)
      if (els[quad.elements[j].id] === undefined)
        els[quad.elements[j].id] = quad.elements[j];

  return els;
}

/**
 * The quad core that will become the sigma interface with the quadtree.
 *
 * property {object} _tree  Property holding the quadtree object.
 * property {object} _cache Cache for the area method.
 */
export abstract class AbstractQuad<T extends Identified> {
  public tree: QuadTree<T> | null = null;
  public cache: { query: string; result: T[] } = {
    query: "",
    result: []
  };
  public enabled = true;
  public prefix: string = "";

  protected abstract addItem(item: T): void;
  protected abstract createQuadTree(
    bounds: Boundaries,
    level: number,
    maxElements: number,
    maxLevel: number
  ): QuadTree<T>;

  /**
   * Index a graph by inserting its nodes into the quadtree.
   *
   * @param  {array}  nodes   An array of nodes to index.
   * @param  {object} params  An object of parameters with at least the quad
   *                          bounds.
   * @return {object}         The quadtree object.
   *
   * Parameters:
   * ----------
   * bounds:      {object}   boundaries of the quad defined by its origin (x, y)
   *                         width and heigth.
   * prefix:      {string?}  a prefix for node geometric attributes.
   * maxElements: {integer?} the max number of elements in a leaf node.
   * maxLevel:    {integer?} the max recursion level of the tree.
   */
  public index = (items: T[], params: any) => {
    if (!this.enabled) return this.tree;

    // Enforcing presence of boundaries
    if (!params.bounds)
      throw new Error("Quad.index: bounds information not given.");

    // Prefix
    this.prefix = params.prefix || "";

    // Building the tree
    this.tree = this.createQuadTree(
      params.bounds,
      0,
      params.maxElements,
      params.maxLevel
    );

    items.forEach(item => this.addItem(item));

    // Reset cache:
    this.cache = {
      query: "",
      result: []
    };

    // remove?
    return this.tree;
  };

  /**
   * Retrieve every graph nodes held by the quadtree node containing the
   * searched point.
   *
   * @param  {number} x of the point.
   * @param  {number} y of the point.
   * @return {array}  An array of items retrieved.
   */
  public point = (x: number, y: number) => {
    if (!this.enabled) return [];
    return this.tree ? quadRetrievePoint({ x, y }, this.tree!) || [] : [];
  };

  /**
   * Retrieve every graph items within a rectangular area. The methods keep the
   * last area queried in cache for optimization reason and will act differently
   * for the same reason if the area is axis-aligned or not.
   *
   * @param  {object} A rectangle defined by two top points (x1, y1), (x2, y2)
   *                  and height.
   * @return {array}  An array of items retrieved.
   */
  public area = (rect: Rectangle) => {
    if (!this.enabled) return [];
    const serialized = JSON.stringify(rect);
    let collisionFunc;
    let rectData;

    // Returning cache?
    if (this.cache.query === serialized) return this.cache.result;

    // Axis aligned ?
    if (isAxisAligned(rect)) {
      collisionFunc = quadIndexes;
      rectData = axisAlignedTopPoints(rect);
    } else {
      collisionFunc = quadCollision;
      rectData = rectangleCorners(rect);
    }

    // Retrieving items
    const resultMap = this.tree
      ? quadRetrieveArea(rectData, this.tree, collisionFunc)
      : {};

    // Object to array
    const resultArray = Object.keys(resultMap).map(n => resultMap[n]);

    // Caching
    this.cache.query = serialized;
    this.cache.result = resultArray;

    return resultArray;
  };

  /**
   * Subdivide a quad by creating a node at a precise index. The function does
   * not generate all four nodes not to potentially create unused nodes.
   *
   * @param  {integer}  index The index of the node to create.
   * @param  {object}   quad  The quad object to subdivide.
   * @return {object}         A new quad representing the node created.
   */
  public quadSubdivide(index: number, quad: QuadTree<T>): QuadTree<T> {
    const next = quad.level + 1;
    const width = Math.round(quad.bounds.width / 2);
    const height = Math.round(quad.bounds.height / 2);
    const qx = Math.round(quad.bounds.x);
    const qy = Math.round(quad.bounds.y);
    let x;
    let y;

    switch (index) {
      case 0:
        x = qx;
        y = qy;
        break;
      case 1:
        x = qx + width;
        y = qy;
        break;
      case 2:
        x = qx;
        y = qy + height;
        break;
      case 3:
        x = qx + width;
        y = qy + height;
        break;
      default:
        throw new Error(`invalid quad index ${index}`);
    }

    return this.createQuadTree(
      { x, y, width, height },
      next,
      quad.maxElements,
      quad.maxLevel
    );
  }

  /**
   * Recursively insert an element into the quadtree. Only points
   * with size, i.e. axis-aligned squares, may be inserted with this
   * method.
   *
   * @param  {object}  el         The element to insert in the quadtree.
   * @param  {object}  sizedPoint A sized point defined by two top points
   *                              (x1, y1), (x2, y2) and height.
   * @param  {object}  quad       The quad in which to insert the element.
   * @return {undefined}          The function does not return anything.
   */
  public quadInsert(el: T, sizedPoint: Rectangle, quad: QuadTree<T>) {
    if (quad.level < quad.maxLevel) {
      // Searching appropriate quads
      const indexes = quadIndexes(sizedPoint, quad.corners);

      // Iterating
      for (let i = 0, l = indexes.length; i < l; i++) {
        // Subdividing if necessary
        if (quad.nodes[indexes[i]] === undefined)
          quad.nodes[indexes[i]] = this.quadSubdivide(indexes[i], quad);

        // Recursion
        this.quadInsert(el, sizedPoint, quad.nodes[indexes[i]]);
      }
    } else {
      // Pushing the element in a leaf node
      quad.elements.push(el);
    }
  }
}
