import Sigma from "./domain/classes/Sigma";
import Camera, { CameraLocation } from "./domain/classes/Camera";
import Graph from "./domain/classes/Graph";
import { Point, Line } from "./domain/utils/geometry/interfaces";
import Dispatcher from "./domain/classes/Dispatcher";
import configurable, { Settings } from "./domain/classes/Configurable";
import EdgeQuad from "./domain/classes/EdgeQuad";
import Quad from "./domain/classes/Quad";

export interface Keyed<T> {
  [key: string]: T;
}

export interface SigmaEventHandler {
  handler: Function;
  one?: boolean;
}

export interface SigmaDispatchedEvent {
  type: string;
  data: any;
  target: SigmaDispatcher;
}

export interface SigmaSettings {
  // Graph Settings

  /**
   * Indicates if the data have to be cloned in methods to add nodes or edges.
   * */
  clone: boolean;

  /**
   * Indicates if nodes "id" values and edges "id", "source" and "target" values must be set as immutable.
   */
  immutable: boolean;

  /**
   * Indicates if sigma can log its errors and warnings.
   */
  verbose: boolean;

  // RENDERERS SETTINGS:
  classPrefix: string;
  defaultNodeType: string;
  defaultEdgeType: string;
  defaultLabelColor: string;
  defaultEdgeColor: string;
  defaultNodeColor: string;
  defaultLabelSize: number;

  /**
   *  Indicates how to choose the edges color
   */
  edgeColor: "source" | "target" | "default";

  /**
   * Defines the minimal edge's arrow display size.
   */
  minArrowSize: number;

  font: string;
  fontStyle: string;

  /**
   * Indicates how to choose the labels color
   */
  labelColor: "default" | "node";

  /**
   * Indicates how to choose the labels size.
   */
  labelSize: "fixed" | "proportional";

  /**
   * The ratio between the font size of the label and the node size.
   */
  labelSizeRatio: number;

  /**
   * The minimum size a node must have to see its label displayed.
   */
  labelThreshold: number;

  /**
   * The oversampling factor used in WebGL renderer.
   */
  webglOversamplingRatio: number;

  /**
   * The size of the border of hovered nodes.
   */
  borderSize: number;

  /**
   * The default hovered node border's color.
   */
  defaultNodeBorderColor: string;

  /**
   * The hovered node's label font. If not specified, will inherit the "font" value.
   */
  hoverFont: string;

  /**
   * If true, then only one node can be hovered at a time.
   */
  singleHover: boolean;

  hoverFontStyle: string;

  /**
   *  Indicates how to choose the hovered nodes shadow color.
   */
  labelHoverShadow: "default" | "node";

  labelHoverShadowColor: string;
  /**
   * Indicates how to choose the hovered nodes color.
   */
  nodeHoverColor: "node" | "default";

  defaultNodeHoverColor: string;

  /**
   * Indicates how to choose the hovered nodes background color.
   */
  labelHoverBGColor: "default" | "node";

  defaultHoverLabelBGColor: string;

  /**
   * Indicates how to choose the hovered labels color.
   */
  labelHoverColor: "default" | "node";

  defaultLabelHoverColor: string;

  /**
   * Indicates how to choose the edges hover color. Available values:
   */
  edgeHoverColor: "edge" | "default";

  /**
   * The size multiplicator of hovered edges.
   */
  edgeHoverSizeRatio: number;

  defaultEdgeHoverColor: string;

  /**
   * Indicates if the edge extremities must be hovered when the edge is hovered.
   */
  edgeHoverExtremities: boolean;

  /**
   * Whether to render the edge layer. Default=true
   */
  drawEdges: boolean;

  /**
   * Whether to render the node layer. Default=true
   */
  drawNodes: boolean;

  /**
   * Whether to render the node labels layer. Default=true
   */
  drawLabels: boolean;

  /**
   * Whether to render the edge labels layer. Default=false
   */
  drawEdgeLabels: boolean;

  /**
   * Indicates if the edges must be drawn in several frames or in one frame, as the nodes and labels are drawn.
   */
  batchEdgesDrawing: boolean;

  /**
   * Indicates if the edges must be hidden during dragging and animations.
   * default=false
   */
  hideEdgesOnMove: false;

  // The different batch sizes, when elements are displayed in several frames.

  /**
   * The number of canvas edges to render per batch, default=500
   */
  canvasEdgesBatchSize: number;

  /**
   * The number of webgl edges to render per batch, default=1000
   */
  webglEdgesBatchSize: number;

  /**
   * RESCALE SETTINGS:
   * *****************
   */
  /**
   * Indicates whether to scale the graph relative to its container.
   */
  scalingMode: "inside" | "outside";
  /**
   * The margin to keep around the graph. default=0
   */
  sideMargin: number;

  // {number} Determine the size of the smallest and the biggest node / edges
  //          on the screen. This mapping makes easier to display the graph,
  //          avoiding too big nodes that take half of the screen, or too
  //          small ones that are not readable. If the two parameters are
  //          equals, then the minimal display size will be 0. And if they
  //          are both equal to 0, then there is no mapping, and the radius
  //          of the nodes will be their size.
  minEdgeSize: 0.5;
  maxEdgeSize: 1;
  minNodeSize: 1;
  maxNodeSize: 8;

  /**
   * CAPTORS SETTINGS:
   * *****************
   */
  touchEnabled: boolean;
  mouseEnabled: boolean;
  mouseWheelEnabled: boolean;
  doubleClickEnabled: boolean;

  /**
   * Defines whether the custom events such as "clickNode" can be
   */
  eventsEnabled: boolean;

  /**
   * Defines by how much multiplicating the zooming level when the user zooms with the mouse-wheel.
   */
  zoomingRatio: number;

  /**
   * Defines by how much multiplicating the zooming level when the user zooms by double clicking.
   */
  doubleClickZoomingRatio: number;

  /**
   * The minimum zooming level.
   */
  zoomMin: number;

  /**
   * The maximum zooming level.
   */
  zoomMax: number;

  /**
   * The duration of animations following a mouse scrolling.
   */
  mouseZoomDuration: number;

  /**
   * The duration of animations following a mouse double click.
   */
  doubleClickZoomDuration: number;

  /**
   * The duration of animations following a mouse dropping.
   */
  mouseInertiaDuration: number;
  /**
   * The inertia power (mouse captor).
   */
  mouseInertiaRatio: number;

  /**
   * The duration of animations following a touch dropping.
   */
  touchInertiaDuration: number;

  /**
   * The inertia power (touch captor).
   */
  touchInertiaRatio: number;

  /**
   * The maximum time between two clicks to make it a double click.
   */
  doubleClickTimeout: number;

  /**
   * The maximum time between two taps to make it a double tap.
   */
  doubleTapTimeout: number;

  /**
   * The maximum time of dragging to trigger intertia.
   */
  dragTimeout: number;

  /**
   * GLOBAL SETTINGS:
   * ****************
   */
  /**
   * Determines whether the instance has to refresh itself
   * automatically when a "resize" event is dispatched from the
   * window object.
   */
  autoResize: boolean;

  /**
   * Determines whether the "rescale" middleware has to be called
   * automatically for each camera on refresh.
   */
  autoRescale: boolean;

  /**
   * If set to false, the camera method "goTo" will basically do nothing.
   */
  enableCamera: boolean;

  /**
   * If set to false, the nodes cannot be hovered.
   */
  enableHovering: boolean;

  /**
   * If set to true, the edges can be hovered.
   */
  enableEdgeHovering: boolean;

  /**
   * The size of the area around the edges to activate hovering.
   */
  edgeHoverPrecision: number;

  /**
   * If set to true, the rescale middleware will ignore node sizes to determine the graphs boundings.
   */
  rescaleIgnoreSize: boolean;

  /**
   * Determines if the core has to try to catch errors on rendering.
   */
  skipErrors: boolean;

  /**
   * CAMERA SETTINGS:
   * ****************
   */
  /**
   * The power degrees applied to the nodes size relatively to the zooming level. Basically:
   *    > onScreenR = (zoom ** nodesPowRatio) * R
   *    > onScreenT = (zoom ** edgesPowRatio) * T
   */
  nodesPowRatio: number;

  /**
   * The power degrees applied to the edges size relatively to the zooming level. Basically:
   *    > onScreenR = (zoom ** nodesPowRatio) * R
   *    > onScreenT = (zoom ** edgesPowRatio) * T
   */
  edgesPowRatio: number;

  // ANIMATIONS SETTINGS:
  /**
   * The default animation time.
   */
  animationsTime: number;

  [key: string]: any;
}
export interface SigmaConfiguration {
  renderers?: Array<string | HTMLElement>;
  settings?: SigmaSettings;
  id?: string;
  [key: string]: any;
}

export interface Captor extends Killable, SigmaDispatcher {}

export interface SigmaLibrary {
  new (item?: any): Sigma;

  instances(id?: string): Sigma | Keyed<Sigma>;
  register(packageName: string, item: any): void;

  classes: SigmaClasses;
  renderers: Keyed<any>;
  utils: SigmaUtils;
  captors: Keyed<any>;

  settings: Keyed<any>;
  misc: SigmaMisc;
  middlewares: Keyed<any>;
  plugins: Keyed<any>;

  // Renderer Utils
  canvas: SigmaCanvasUtils;
  svg: SigmaSvgUtils;
  webgl: SigmaWebGLUtilities;
}

export interface Event<T> {
  data: T;
}

export interface Node extends Keyed<any> {
  id: string;
  type: string;
  size: number;
  color: string;
  label: string;
  hidden?: boolean;
}

export interface Edge extends Keyed<any> {
  id: string;
  source: string;
  target: string;
  type: string;
  color: string;
  hidden?: boolean;
  hover?: boolean;
  hover_color?: string;
}

export interface Killable {
  kill(): void;
}

export interface Renderer extends Killable, SigmaDispatcher {
  id: string;
  camera: Camera;
  graph: Graph;
  width: number;
  height: number;
  settings: Settings;
  captors: Captor[];
  contexts: {
    [key: string]: CanvasRenderingContext2D | WebGLRenderingContext;
  };

  render(params?: any): Renderer;
  initDOM(tag: string, elementId: string, webgl?: boolean): void;
  resize(w?: number, h?: number): Renderer;
  clear(): Renderer;
}

export interface SigmaDispatcher {
  /**
   * Will execute the handler everytime that the indicated event (or the
   * indicated events) will be triggered.
   *
   * @param  {string}           events  The name of the event (or the events
   *                                    separated by spaces).
   * @param  {function(Object)} handler The handler to bind.
   * @return {dispatcher}               Returns the instance itself.
   */
  bind(
    events: Keyed<Function> | string[] | string,
    handler?: Function
  ): SigmaDispatcher;

  /**
   * Removes the handler from a specified event (or specified events).
   *
   * @param  {?string}           events  The name of the event (or the events
   *                                     separated by spaces). If undefined,
   *                                     then all handlers are removed.
   * @param  {?function(object)} handler The handler to unbind. If undefined,
   *                                     each handler bound to the event or the
   *                                     events will be removed.
   * @return {dispatcher}                Returns the instance itself.
   */
  unbind(events?: string | string[], handler?: Function): SigmaDispatcher;

  /**
   * Executes each handler bound to the event
   *
   * @param  {string}     events The name of the event (or the events separated
   *                             by spaces).
   * @param  {?object}    data   The content of the event (optional).
   * @return {dispatcher}        Returns the instance itself.
   */
  dispatchEvent(events: string | string[], data?: any): SigmaDispatcher;
}

export interface SigmaUtils extends Keyed<any> {
  geom: SigmaGeometryUtilities;
  events: SigmaEventUtilities;
  easings: SigmaEasings;
  webgl: SigmaWebGLUtilities;
  matrices: SigmaMatrixUtilities;

  /**
   * Takes a package name as parameter and checks at each lebel if it exists,
   * and if it does not, creates it.
   *
   * Example:
   * ********
   *  > pkg('a.b.c');
   *  > a.b.c;
   *  > // Object {};
   *  >
   *  > pkg('a.b.d');
   *  > a.b;
   *  > // Object { c: {}, d: {} };
   *
   * @param  {string} pkgName The name of the package to create/find.
   * @return {object}         The related package.
   */
  pkg(packageName: string): Keyed<any>;

  /**
   * A short "Date.now()" polyfill.
   *
   * @return {Number} The current time (in ms).
   */
  dateNow(): number;

  /**
   * Returns a unique incremental number ID.
   *
   * Example:
   * ********
   *  > id();
   *  > // 1;
   *  >
   *  > id();
   *  > // 2;
   *  >
   *  > id();
   *  > // 3;
   *
   * @param  {string} pkgName The name of the package to create/find.
   * @return {object}         The related package.
   */
  id(): number;

  /**
   * This function takes an hexa color (for instance "#ffcc00" or "#fc0") or a
   * rgb / rgba color (like "rgb(255,255,12)" or "rgba(255,255,12,1)") and
   * returns an integer equal to "r * 255 * 255 + g * 255 + b", to gain some
   * memory in the data given to WebGL shaders.
   *
   * Note that the function actually caches its results for better performance.
   *
   * @param  {string} val The hexa or rgba color.
   * @return {number}     The number value.
   */
  floatColor(input: string): number;

  /**
   * Perform a zoom into a camera, with or without animation, to the
   * coordinates indicated using a specified ratio.
   *
   * Recognized parameters:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the animation
   * object:
   *
   *   {?number} duration     An amount of time that means the duration of the
   *                          animation. If this parameter doesn't exist the
   *                          zoom will be performed without animation.
   *   {?function} onComplete A function to perform it after the animation. It
   *                          will be performed even if there is no duration.
   *
   * @param {camera}     The camera where perform the zoom.
   * @param {x}          The X coordiantion where the zoom goes.
   * @param {y}          The Y coordiantion where the zoom goes.
   * @param {ratio}      The ratio to apply it to the current camera ratio.
   * @param {?animation} A dictionary with options for a possible animation.
   */
  zoomTo(
    camera: Camera,
    x: number,
    y: number,
    ratio: number,
    animation: any
  ): void;

  /**
   * This custom tool function removes every pair key/value from an hash. The
   * goal is to avoid creating a new object while some other references are
   * still hanging in some scopes...
   *
   * @param  {object} obj The object to empty.
   * @return {object}     The empty object.
   */
  emptyObject?: (input: object) => object;

  /**
   * XHR Polyfill
   */
  xhr(): XMLHttpRequest;
}

export interface SigmaGeometryUtilities extends Keyed<any> {
  /**
   * Return the control point coordinates for a quadratic bezier curve.
   *
   * @param  {number} x1  The X coordinate of the start point.
   * @param  {number} y1  The Y coordinate of the start point.
   * @param  {number} x2  The X coordinate of the end point.
   * @param  {number} y2  The Y coordinate of the end point.
   * @return {x,y}        The control point coordinates.
   */
  getQuadraticControlPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Point;

  /**
   * Compute the coordinates of the point positioned
   * at length t in the quadratic bezier curve.
   *
   * @param  {number} t  In [0,1] the step percentage to reach
   *                     the point in the curve from the context point.
   * @param  {number} x1 The X coordinate of the context point.
   * @param  {number} y1 The Y coordinate of the context point.
   * @param  {number} x2 The X coordinate of the ending point.
   * @param  {number} y2 The Y coordinate of the ending point.
   * @param  {number} xi The X coordinate of the control point.
   * @param  {number} yi The Y coordinate of the control point.
   * @return {object}    {x,y}.
   */
  getPointOnQuadraticCurve(
    t: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    xi: number,
    yi: number
  ): Point;

  /**
   * Compute the coordinates of the point positioned
   * at length t in the cubic bezier curve.
   *
   * @param  {number} t  In [0,1] the step percentage to reach
   *                     the point in the curve from the context point.
   * @param  {number} x1 The X coordinate of the context point.
   * @param  {number} y1 The Y coordinate of the context point.
   * @param  {number} x2 The X coordinate of the end point.
   * @param  {number} y2 The Y coordinate of the end point.
   * @param  {number} cx The X coordinate of the first control point.
   * @param  {number} cy The Y coordinate of the first control point.
   * @param  {number} dx The X coordinate of the second control point.
   * @param  {number} dy The Y coordinate of the second control point.
   * @return {object}    {x,y} The point at t.
   */
  getPointOnBezierCurve(
    t: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number,
    dx: number,
    dy: number
  ): Point;

  /**
   * Return the coordinates of the two control points for a self loop (i.e.
   * where the start point is also the end point) computed as a cubic bezier
   * curve.
   *
   * @param  {number} x    The X coordinate of the node.
   * @param  {number} y    The Y coordinate of the node.
   * @param  {number} size The node size.
   * @return {x1,y1,x2,y2} The coordinates of the two control points.
   */
  getSelfLoopControlPoints(x: number, y: number, size: number): Line;

  /**
   * Return the euclidian distance between two points of a plane
   * with an orthonormal basis.
   *
   * @param  {number} x1  The X coordinate of the first point.
   * @param  {number} y1  The Y coordinate of the first point.
   * @param  {number} x2  The X coordinate of the second point.
   * @param  {number} y2  The Y coordinate of the second point.
   * @return {number}     The euclidian distance.
   */
  getDistance(x0: number, y0: number, x1: number, y1: number): number;

  /**
   * Return the coordinates of the intersection points of two circles.
   *
   * @param  {number} x0  The X coordinate of center location of the first
   *                      circle.
   * @param  {number} y0  The Y coordinate of center location of the first
   *                      circle.
   * @param  {number} r0  The radius of the first circle.
   * @param  {number} x1  The X coordinate of center location of the second
   *                      circle.
   * @param  {number} y1  The Y coordinate of center location of the second
   *                      circle.
   * @param  {number} r1  The radius of the second circle.
   * @return {xi,yi}      The coordinates of the intersection points.
   */
  getCircleIntersection(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): { xi: number; yi: number; xi_prime: number; yi_prime: number };

  /**
   * Check if a point is on a line segment.
   *
   * @param  {number} x       The X coordinate of the point to check.
   * @param  {number} y       The Y coordinate of the point to check.
   * @param  {number} x1      The X coordinate of the line start point.
   * @param  {number} y1      The Y coordinate of the line start point.
   * @param  {number} x2      The X coordinate of the line end point.
   * @param  {number} y2      The Y coordinate of the line end point.
   * @param  {number} epsilon The precision (consider the line thickness).
   * @return {boolean}        True if point is "close to" the line
   *                          segment, false otherwise.
   */
  isPointOnSegment(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    epsilon: number
  ): boolean;

  /**
   * Check if a point is on a cubic bezier curve segment with a thickness.
   *
   * @param  {number} x       The X coordinate of the point to check.
   * @param  {number} y       The Y coordinate of the point to check.
   * @param  {number} x1      The X coordinate of the curve start point.
   * @param  {number} y1      The Y coordinate of the curve start point.
   * @param  {number} x2      The X coordinate of the curve end point.
   * @param  {number} y2      The Y coordinate of the curve end point.
   * @param  {number} cpx1    The X coordinate of the 1st curve control point.
   * @param  {number} cpy1    The Y coordinate of the 1st curve control point.
   * @param  {number} cpx2    The X coordinate of the 2nd curve control point.
   * @param  {number} cpy2    The Y coordinate of the 2nd curve control point.
   * @param  {number} epsilon The precision (consider the line thickness).
   * @return {boolean}        True if (x,y) is on the curve segment,
   *                          false otherwise.
   */
  isPointOnBezierCurve(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cpx1: number,
    cpy1: number,
    cpx2: number,
    cpy2: number,
    epsilon: number
  ): boolean;

  /**
   * Gets the layout boundaries of the given graph
   * @param graph
   * @param prefix
   * @param doEdges
   */
  getBoundaries(
    graph: Graph,
    prefix: string,
    doEdges?: boolean
  ): {
    weightMax: number;
    sizeMax: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface SigmaEventUtilities extends Keyed<any> {
  /**
   * Extract the local X position from a mouse or touch event.
   *
   * @param  {event}  e A mouse or touch event.
   * @return {number}   The local X value of the mouse.
   */
  getX(event: MouseEvent | TouchEvent): number;

  /**
   * Extract the local Y position from a mouse or touch event.
   *
   * @param  {event}  e A mouse or touch event.
   * @return {number}   The local Y value of the mouse.
   */
  getY(event: MouseEvent | TouchEvent): number;

  /**
   * The pixel ratio of the screen. Taking zoom into account
   *
   * @return {number}        Pixel ratio of the screen
   */
  getPixelRatio(): number;

  /**
   * Extract the width from a mouse or touch event.
   *
   * @param  {event}  e A mouse or touch event.
   * @return {number}   The width of the event's target.
   */
  getWidth(e: MouseEvent | TouchEvent): number;

  /**
   * Extract the center from a mouse or touch event.
   *
   * @param  {event}  e A mouse or touch event.
   * @return {object}   The center of the event's target.
   */
  getCenter(e: MouseEvent | TouchEvent): Point;

  /**
   * Convert mouse coords to sigma coords
   *
   * @param  {event}   e A mouse or touch event.
   * @param  {number?} x The x coord to convert
   * @param  {number?} x The y coord to convert
   *
   * @return {object}    The standardized event
   */
  mouseCoords(
    e: MouseEvent | TouchEvent,
    x?: number,
    y?: number
  ): Point & {
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  };

  /**
   * Extract the height from a mouse or touch event.
   *
   * @param  {event}  e A mouse or touch event.
   * @return {number}   The height of the event's target.
   */
  getHeight(e: MouseEvent | TouchEvent): boolean;

  /**
   * Extract the wheel delta from a mouse or touch event.
   *
   * @param  {event}  e A mouse or touch event.
   * @return {number}   The wheel delta of the mouse.
   */
  getDelta(e: MouseEvent | TouchEvent): number;

  /**
   * Returns the offset of a DOM element.
   *
   * @param  {DOMElement} dom The element to retrieve the position.
   * @return {object}         The offset of the DOM element (top, left).
   */
  getOffset(
    dom: HTMLElement
  ): {
    top: number;
    left: number;
  };

  /**
   * Simulates a "double click" event.
   *
   * @param  {HTMLElement} target   The event target.
   * @param  {string}      type     The event type.
   * @param  {function}    callback The callback to execute.
   */
  doubleClick(
    target: HTMLElement,
    type: string,
    callback: (evt: MouseEvent) => void
  ): void;

  /**
   * Unbind simulated "double click" events.
   *
   * @param  {HTMLElement} target   The event target.
   * @param  {string}      type     The event type.
   */
  unbindDoubleClick(target: HTMLElement, type: string): void;
}

export type Easing = (input: number) => number;
export interface SigmaEasings extends Keyed<Easing> {
  linearNone: Easing;
  quadraticIn: Easing;
  quadraticOut: Easing;
  quadraticInOut: Easing;
  cubicIn: Easing;
  cubicOut: Easing;
  cubicInOut: Easing;
}

export interface SigmaWebGLUtilities extends Keyed<any> {
  /**
   * Loads a WebGL shader and returns it.
   *
   * @param  {WebGLContext}           gl           The WebGLContext to use.
   * @param  {string}                 shaderSource The shader source.
   * @param  {number}                 shaderType   The type of shader.
   * @param  {function(string): void} error        Callback for errors.
   * @return {WebGLShader}                         The created shader.
   */
  loadShader(
    gl: WebGLRenderingContext,
    shaderSource: string,
    shaderType: number,
    error?: (err: Error) => void
  ): WebGLShader | undefined;

  /**
   * Creates a program, attaches shaders, binds attrib locations, links the
   * program and calls useProgram.
   *
   * @param  {Array.<WebGLShader>}    shaders   The shaders to attach.
   * @param  {Array.<string>}         attribs   The attribs names.
   * @param  {Array.<number>}         locations The locations for the attribs.
   * @param  {function(string): void} error     Callback for errors.
   * @return {WebGLProgram}                     The created program.
   */
  loadProgram(
    gl: WebGLRenderingContext,
    shaders: WebGLShader[],
    attribs?: string[],
    locations?: number[],
    error?: (err: Error) => void
  ): WebGLProgram | undefined;
}

export interface SigmaMatrixUtilities extends Keyed<any> {
  /**
   * The returns a 3x3 translation matrix.
   *
   * @param  {number} dx The X translation.
   * @param  {number} dy The Y translation.
   * @return {array}     Returns the matrix.
   */
  translation(dx: number, dy: number): number[];

  /**
   * The returns a 3x3 or 2x2 rotation matrix.
   *
   * @param  {number}  angle The rotation angle.
   * @param  {boolean} m2    If true, the function will return a 2x2 matrix.
   * @return {array}         Returns the matrix.
   */
  rotation(angle: number, m2?: boolean): number[];

  /**
   * The returns a 3x3 or 2x2 homothetic transformation matrix.
   *
   * @param  {number}  ratio The scaling ratio.
   * @param  {boolean} m2    If true, the function will return a 2x2 matrix.
   * @return {array}         Returns the matrix.
   */
  scale(ratio: number, m2?: boolean): number[];

  /**
   * The returns a 3x3 or 2x2 homothetic transformation matrix.
   *
   * @param  {array}   a  The first matrix.
   * @param  {array}   b  The second matrix.
   * @param  {boolean} m2 If true, the function will assume both matrices are
   *                      2x2.
   * @return {array}      Returns the matrix.
   */
  multiply(a: number[], b: number[], m2?: boolean): number[];
}

export interface SigmaClasses extends Keyed<any> {
  dispatcher: typeof Dispatcher;
  configurable: typeof configurable;
  camera: typeof Camera;
  edgequad: typeof EdgeQuad;
  graph: typeof Graph;
  quad: typeof Quad;
}

/**
 * This hover renderer will display the edge with a different color or size.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export type CanvasEdgeDrawer = (
  edge: Edge,
  source: Node,
  target: Node,
  context: CanvasRenderingContext2D,
  settings: Settings
) => void;

/**
 * This hover renderer will basically display the label with a background.
 *
 * @param  {object}                   node     The node object.
 * @param  {CanvasRenderingContext2D} context  The canvas context.
 * @param  {configurable}             settings The settings function.
 */
export type CanvasNodeDrawer = (
  node: Node,
  context: CanvasRenderingContext2D,
  settings: Settings
) => void;

export interface SigmaCanvasUtils extends Keyed<any> {
  edgehovers: {
    def: CanvasEdgeDrawer;
    [key: string]: CanvasEdgeDrawer;
  };
  edges: {
    labels: {
      def: CanvasEdgeDrawer;
      [key: string]: CanvasEdgeDrawer;
    };
    def: CanvasEdgeDrawer;
    [key: string]: Keyed<CanvasEdgeDrawer> | CanvasEdgeDrawer;
  };
  extremities: {
    def: CanvasEdgeDrawer;
    [key: string]: CanvasEdgeDrawer;
  };
  hovers: {
    def: CanvasNodeDrawer;
    [key: string]: CanvasNodeDrawer;
  };
  labels: {
    def: CanvasNodeDrawer;
    [key: string]: CanvasNodeDrawer;
  };
  nodes: {
    def: CanvasNodeDrawer;
    [key: string]: CanvasNodeDrawer;
  };
}

export interface SvgEdgeDrawer {
  /**
   * SVG Element creation.
   *
   * @param  {object}                   edge       The edge object.
   * @param  {object}                   source     The source node object.
   * @param  {object}                   target     The target node object.
   * @param  {configurable}             settings   The settings function.
   */
  create(
    edge: Edge,
    source: Node,
    target: Node,
    settings: Settings
  ): HTMLElement;

  /**
   * SVG Element update.
   *
   * @param  {object}                   edge       The edge object.
   * @param  {DOMElement}               line       The line DOM Element.
   * @param  {object}                   source     The source node object.
   * @param  {object}                   target     The target node object.
   * @param  {configurable}             settings   The settings function.
   */
  update(
    edge: Edge,
    path: HTMLElement,
    source: Node,
    target: Node,
    settings: Settings
  ): void;
}

export interface SvgHoverDrawer {
  /**
   * SVG Element creation.
   *
   * @param  {object}           node               The node object.
   * @param  {CanvasElement}    measurementCanvas  A fake canvas handled by
   *                            the svg to perform some measurements and
   *                            passed by the renderer.
   * @param  {DOMElement}       nodeCircle         The node DOM Element.
   * @param  {configurable}     settings           The settings function.
   */
  create(
    node: Node,
    nodeCircle: HTMLElement,
    measurementCanvas: CanvasRenderingContext2D,
    settings: Settings
  ): HTMLElement;
}

export interface SvgNodeDrawer {
  /**
   * SVG Element creation.
   *
   * @param  {object}                   node       The node object.
   * @param  {configurable}             settings   The settings function.
   */
  create(node: Node, settings: Settings): HTMLElement;

  /**
   * SVG Element update.
   *
   * @param  {object}                   node     The node object.
   * @param  {DOMElement}               text     The label DOM element.
   * @param  {configurable}             settings The settings function.
   */
  update(node: Node, text: HTMLElement, settings: Settings): void;
}

export interface SigmaSvgUtils extends Keyed<any> {
  edges: {
    curve: SvgEdgeDrawer;
    def: SvgEdgeDrawer;
    [key: string]: SvgEdgeDrawer;
  };
  hovers: {
    def: SvgHoverDrawer;
    [key: string]: SvgHoverDrawer;
  };
  labels: {
    def: SvgNodeDrawer;
    [key: string]: SvgNodeDrawer;
  };
  nodes: {
    def: SvgNodeDrawer;
    [key: string]: SvgNodeDrawer;
  };
  utils: {
    /**
     * SVG Element show.
     *
     * @param  {DOMElement} element The DOM element to show.
     */
    show(element: HTMLElement): void;
    /**
     * SVG Element hide.
     *
     * @param  {DOMElement} element The DOM element to hide.
     */
    hide(element: HTMLElement): void;
    [key: string]: any;
  };
}

interface WebGLDrawer {
  POINTS: number;
  ATTRIBUTES: number;
  render(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    data: Float32Array,
    params: any
  ): void;
  initProgram(gl: WebGLRenderingContext): WebGLProgram;
}

export interface WebGLEdgeDrawer extends WebGLDrawer {
  addEdge(
    edge: Edge,
    source: Node,
    target: Node,
    data: Float32Array,
    i: number,
    prefix: string,
    settings: Settings
  ): void;
  computeIndices(data: Float32Array): Uint16Array;
  initProgram(gl: WebGLRenderingContext): WebGLProgram;
}

export interface WebGLNodeDrawer extends WebGLDrawer {
  addNode(
    node: Node,
    data: Float32Array,
    i: number,
    prefix: string,
    settings: Settings
  ): void;
}

export interface SigmaWebGLUtilities extends Keyed<any> {
  edges: {
    arrow: WebGLEdgeDrawer;
    thickLine: WebGLEdgeDrawer;
    thickLineCPU: WebGLEdgeDrawer;
    thickLineGPU: WebGLEdgeDrawer;
    fast: WebGLEdgeDrawer;
    def: WebGLEdgeDrawer;
    [key: string]: WebGLEdgeDrawer;
  };
  nodes: {
    def: WebGLNodeDrawer;
    fast: WebGLNodeDrawer;
    [key: string]: WebGLNodeDrawer;
  };
}

export interface SigmaMisc extends Keyed<any> {
  /**
   * This method listens to "overNode", "outNode", "overEdge" and "outEdge"
   * events from a renderer and renders the nodes differently on the top layer.
   * The goal is to make any node label readable with the mouse, and to
   * highlight hovered nodes and edges.
   *
   */
  drawHovers(prefix: string): void;

  /**
   * This helper will bind any no-DOM renderer (for instance canvas or WebGL)
   * to its captors, to properly dispatch the good events to the sigma instance
   * to manage clicking, hovering etc...
   *
   */
  bindEvents(prefix: string): void;

  /**
   * This helper will bind any DOM renderer (for instance svg)
   * to its captors, to properly dispatch the good events to the sigma instance
   * to manage clicking, hovering etc...
   *
   */
  bindDOMEvents(container: HTMLElement): void;

  animation: SigmaMiscAnimation;
}

export interface AnimationReference {
  type: string;
  target: any;
  frameId: number;
  options: any;
  fn: Function;
}

export interface SigmaMiscAnimation extends Keyed<any> {
  running: {
    [key: string]: AnimationReference;
  };

  /**
   * Kills a running animation. It triggers the eventual onComplete callback.
   *
   * @param  {number} id  The id of the animation to kill.
   */
  kill(id: number): void;

  /**
   * Kills every running animations, or only the one with the specified type,
   * if a string parameter is given.
   *
   * @param  {?(string|object)} filter A string to filter the animations to kill
   *                                   on their type (example: "camera"), or an
   *                                   object to filter on their target.
   * @return {number}                  Returns the number of animations killed
   *                                   that way.
   */
  killAll(filter: string | object): number;

  /**
   * Returns "true" if any animation that is currently still running matches
   * the filter given to the function.
   *
   * @param  {string|object} filter A string to filter the animations to kill
   *                                on their type (example: "camera"), or an
   *                                object to filter on their target.
   * @return {boolean}              Returns true if any running animation
   *                                matches.
   */
  has(filter: string): boolean;

  /**
   * This function animates a camera. It has to be called with the camera to
   * animate, the values of the coordinates to reach and eventually some
   * options. It returns a number id, that you can use to kill the animation,
   * with the method sigma.misc.animation.kill(id).
   *
   * The available options are:
   *
   *   {?number}            duration   The duration of the animation.
   *   {?function}          onNewFrame A callback to execute when the animation
   *                                   enter a new frame.
   *   {?function}          onComplete A callback to execute when the animation
   *                                   is completed or killed.
   *   {?(string|function)} easing     The name of a function from the package
   *                                   sigma.utils.easings, or a custom easing
   *                                   function.
   *
   * @param  {camera}  camera  The camera to animate.
   * @param  {object}  target  The coordinates to reach.
   * @param  {?object} options Eventually an object to specify some options to
   *                           the function. The available options are
   *                           presented in the description of the function.
   * @return {number}          The animation id, to make it easy to kill
   *                           through the method "sigma.misc.animation.kill".
   */
  camera(camera: Camera, val: CameraLocation, options?: any): void;
}
