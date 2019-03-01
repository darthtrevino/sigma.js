import scale from "../utils/matrices/scale";
import rotation from "../utils/matrices/rotation";
import translation from "../utils/matrices/translation";
import multiply from "../utils/matrices/multiply";
import Dispatcher from "./Dispatcher";
import { AbstractQuad as Quad } from "./quadtree/AbstractQuad";
import { Edge, Node, Keyed } from "../../interfaces";

export interface CameraLocation {
  x: number;
  y: number;
  ratio?: number;
  angle?: number;
}

/**
 * The camera constructor. It just initializes its attributes and methods.
 *
 * @param  {string}       id       The id.
 * @param  {graph}  graph    The graph.
 * @param  {configurable} settings The settings function.
 * @param  {?object}      options  Eventually some overriding options.
 * @return {camera}                Returns the fresh new camera instance.
 */
export default class Camera extends Dispatcher {
  public x = 0;
  public y = 0;
  public ratio = 1;
  public angle = 0;
  public isAnimated = false;
  public isMoving = false;
  public settings: any;
  public prefix: string;
  public readPrefix: string;
  public kill?: Function;
  public quadtree?: Quad<Node>;
  public edgequadtree?: Quad<Edge>;

  constructor(
    public id: string,
    public graph: any,
    settings: any,
    options?: any
  ) {
    super();
    this.readPrefix = `read_cam${id}:`;
    this.prefix = `cam${id}:`;

    this.settings =
      typeof options === "object" && options
        ? settings.embedObject(options)
        : settings;
  }

  /**
   * Updates the camera position.
   *
   * @param  {object} coordinates The new coordinates object.
   * @return {camera}             Returns the camera.
   */
  public goTo = (coordinates?: CameraLocation) => {
    if (!this.settings("enableCamera")) return this;

    const c: Keyed<any> = coordinates || {};
    const keys = ["x", "y", "ratio", "angle"];
    keys.forEach(key => {
      if (c[key] !== undefined) {
        if (typeof c[key] === "number" && !Number.isNaN(c[key]))
          (this as any)[key] = (c as any)[key];
        else throw new Error(`Value for "${key}" is not a number.`);
      }
    });
    keys.forEach(() => this.dispatchEvent("coordinatesUpdated"));
    return this;
  };

  /**
   * This method takes a graph and computes for each node and edges its
   * coordinates relatively to the center of the camera. Basically, it will
   * compute the coordinates that will be used by the graphic renderers.
   *
   * Since it should be possible to use different cameras and different
   * renderers, it is possible to specify a prefix to put before the new
   * coordinates (to get something like "node.camera1_x")
   *
   * @param  {?string} read    The prefix of the coordinates to read.
   * @param  {?string} write   The prefix of the coordinates to write.
   * @param  {?object} options Eventually an object of options. Those can be:
   *                           - A restricted nodes array.
   *                           - A restricted edges array.
   *                           - A width.
   *                           - A height.
   * @return {camera}        Returns the camera.
   */
  public applyView = (read?: string, write?: string, options?: any) => {
    options = options || {};
    write = write !== undefined ? write : this.prefix;
    read = read !== undefined ? read : this.readPrefix;

    const nodes: Node[] = options.nodes || this.graph.nodes();
    const edges: Edge[] = options.edges || this.graph.edges();
    const relCos = Math.cos(this.angle) / this.ratio;
    const relSin = Math.sin(this.angle) / this.ratio;
    const nodeRatio = this.ratio ** this.settings("nodesPowRatio");
    const edgeRatio = this.ratio ** this.settings("edgesPowRatio");

    const xOffset =
      (options.width || 0) / 2 - this.x * relCos - this.y * relSin;
    const yOffset =
      (options.height || 0) / 2 - this.y * relCos + this.x * relSin;

    nodes.forEach(node => {
      node[`${write}x`] =
        (node[`${read}x`] || 0) * relCos +
        (node[`${read}y`] || 0) * relSin +
        xOffset;
      node[`${write}y`] =
        (node[`${read}y`] || 0) * relCos -
        (node[`${read}x`] || 0) * relSin +
        yOffset;
      node[`${write}size`] = (node[`${read}size`] || 0) / nodeRatio;
    });

    edges.forEach(edge => {
      edge[`${write}size`] = (edge[`${read}size`] || 0) / edgeRatio;
    });

    return this;
  };

  /**
   * This function converts the coordinates of a point from the frame of the
   * camera to the frame of the graph.
   *
   * @param  {number} x The X coordinate of the point in the frame of the
   *                    camera.
   * @param  {number} y The Y coordinate of the point in the frame of the
   *                    camera.
   * @return {object}   The point coordinates in the frame of the graph.
   */
  public graphPosition = (x: number, y: number, vector?: boolean) => {
    let X = 0;
    let Y = 0;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    // Revert the origin differential vector:
    if (!vector) {
      X = -(this.x * cos + this.y * sin) / this.ratio;
      Y = -(this.y * cos - this.x * sin) / this.ratio;
    }

    return {
      x: (x * cos + y * sin) / this.ratio + X,
      y: (y * cos - x * sin) / this.ratio + Y
    };
  };

  /**
   * This function converts the coordinates of a point from the frame of the
   * graph to the frame of the camera.
   *
   * @param  {number} x The X coordinate of the point in the frame of the
   *                    graph.
   * @param  {number} y The Y coordinate of the point in the frame of the
   *                    graph.
   * @return {object}   The point coordinates in the frame of the camera.
   */
  public cameraPosition = (x: number, y: number, vector?: boolean) => {
    let X = 0;
    let Y = 0;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    // Revert the origin differential vector:
    if (!vector) {
      X = -(this.x * cos + this.y * sin) / this.ratio;
      Y = -(this.y * cos - this.x * sin) / this.ratio;
    }

    return {
      x: ((x - X) * cos - (y - Y) * sin) * this.ratio,
      y: ((y - Y) * cos + (x - X) * sin) * this.ratio
    };
  };

  /**
   * This method returns the transformation matrix of the camera. This is
   * especially useful to apply the camera view directly in shaders, in case of
   * WebGL rendering.
   *
   * @return {array} The transformation matrix.
   */
  public getMatrix = () => {
    const scaled = scale(1 / this.ratio);
    const rotated = rotation(this.angle);
    const translated = translation(-this.x, -this.y);
    return multiply(translated, multiply(rotated, scaled));
  };

  /**
   * Taking a width and a height as parameters, this method returns the
   * coordinates of the rectangle representing the camera on screen, in the
   * graph's referentiel.
   *
   * To keep displaying labels of nodes going out of the screen, the method
   * keeps a margin around the screen in the returned rectangle.
   *
   * @param  {number} width  The width of the screen.
   * @param  {number} height The height of the screen.
   * @return {object}        The rectangle as x1, y1, x2 and y2, representing
   *                         two opposite points.
   */
  public getRectangle = (width: number, height: number) => {
    const widthVect = this.cameraPosition(width, 0, true);
    const heightVect = this.cameraPosition(0, height, true);
    const centerVect = this.cameraPosition(width / 2, height / 2, true);
    const marginX = this.cameraPosition(width / 4, 0, true).x;
    const marginY = this.cameraPosition(0, height / 4, true).y;
    return {
      x1: this.x - centerVect.x - marginX,
      y1: this.y - centerVect.y - marginY,
      x2: this.x - centerVect.x + marginX + widthVect.x,
      y2: this.y - centerVect.y - marginY + widthVect.y,
      height: Math.sqrt(heightVect.x ** 2 + (heightVect.y + 2 * marginY) ** 2)
    };
  };
}
