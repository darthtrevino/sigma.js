import Sigma from "./domain/classes/Sigma";

export interface Keyed<T> {
  [key: string]: T;
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

export interface SigmaLibrary {
  new (item?: any): Sigma;

  instances(id?: string): Sigma | { [key: string]: Sigma };
  register(packageName: string, item: any);

  classes: { [key: string]: Function };
  settings: { [key: string]: any };

  renderers: { [key: string]: Function };
  middlewares: { [key: string]: any };
  utils: { [key: string]: any };
  misc: { [key: string]: any };
  captors: { [key: string]: any };
  plugins: { [key: string]: any };

  // Renderer Utils
  canvas: { [key: string]: any };
  svg: { [key: string]: any };
  webgl: { [key: string]: any };
}

export interface Event<T> {
  data: T;
}

export interface Node {
  id: string;
  type: string;
  size: number;
  color: string;
  label: string;
  hidden?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  color: string;
  hidden?: boolean;
  hover?: boolean;
  hover_color?: string;
}
