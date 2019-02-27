// @ts-ignore
import conrad from "conrad";
import id from "../../utils/misc/id";
import Dispatcher from "../../classes/Dispatcher";
import getPixelRatio from "../../utils/events/getPixelRatio";
import multiply from "../../utils/matrices/multiply";
import translation from "../../utils/matrices/translation";
import { SigmaLibrary, Renderer, Captor } from "../../../interfaces";
import Graph from "../../classes/Graph";
import Camera from "../../classes/Camera";
import { Settings } from "../../classes/Configurable";

export default (sigma: SigmaLibrary) => {
  return class WebGLRenderer extends Dispatcher implements Renderer {
    public id = "__ID_NOT_SET__";

    // Conrad Properties
    private jobs = {};
    private conradId = id();

    // Main attributes
    public contexts: {
      labels?: CanvasRenderingContext2D;
      scene?: WebGLRenderingContext;
      nodes?: WebGLRenderingContext;
      edges?: WebGLRenderingContext;
      [key: string]: WebGLRenderingContext | CanvasRenderingContext2D;
    } = {};
    private domElements: { [key: string]: HTMLElement } = {};
    private container: HTMLElement;
    public captors: Captor[];
    public width: number = 0;
    public height: number = 0;

    // Rendering attributes
    private nodePrograms = {};
    private edgePrograms = {};
    private nodeFloatArrays = {};
    private edgeFloatArrays = {};
    private edgeIndicesArrays = {};

    /**
     * This function is the constructor of the canvas sigma's renderer.
     *
     * @param  {sigma.classes.graph}            graph    The graph to render.
     * @param  {sigma.classes.camera}           camera   The camera.
     * @param  {configurable}           settings The sigma instance settings
     *                                           function.
     * @param  {object}                 object   The options object.
     * @return {sigma.renderers.canvas}          The renderer instance.
     */
    constructor(
      public graph: Graph,
      public camera: Camera,
      public settings: Settings,
      public options
    ) {
      super();
      if (typeof options !== "object") {
        throw new Error("WebGLRenderer: Wrong arguments.");
      }
      if (!(options.container instanceof HTMLElement)) {
        throw new Error("Container not found.");
      }

      // Initialize main attributes:
      this.container = this.options.container;
      this.settings =
        typeof options.settings === "object" && options.settings
          ? settings.embedObjects(options.settings)
          : settings;

      // Find the prefix:
      this.options.prefix = this.camera.readPrefix;

      // Initialize the DOM elements:
      if (this.settings(options, "batchEdgesDrawing")) {
        this.initDOM("canvas", "edges", true);
        this.initDOM("canvas", "nodes", true);
      } else {
        this.initDOM("canvas", "scene", true);
        this.contexts.nodes = this.contexts.scene;
        this.contexts.edges = this.contexts.scene;
      }

      this.initDOM("canvas", "labels");
      this.initDOM("canvas", "mouse");
      this.contexts.hover = this.contexts.mouse;

      // Initialize captors:

      const captors = this.options.captors || [
        sigma.captors.mouse,
        sigma.captors.touch
      ];
      this.captors = captors.map(captor => {
        const Captor =
          typeof captor === "function" ? captor : sigma.captors[captor];
        return new Captor(this.domElements.mouse, this.camera, this.settings);
      });
      // Deal with sigma events:
      sigma.misc.bindEvents.call(this, this.camera.prefix);
      sigma.misc.drawHovers.call(this, this.camera.prefix);
      this.resize();
    }

    /**
     * This method will generate the nodes and edges float arrays. This step is
     * separated from the "render" method, because to keep WebGL efficient, since
     * all the camera and middlewares are modelised as matrices and they do not
     * require the float arrays to be regenerated.
     *
     * Basically, when the user moves the camera or applies some specific linear
     * transformations, this process step will be skipped, and the "render"
     * method will efficiently refresh the rendering.
     *
     * And when the user modifies the graph colors or positions (applying a new
     * layout or filtering the colors, for instance), this "process" step will be
     * required to regenerate the float arrays.
     *
     * @return {WebGLRenderer} Returns the instance itself.
     */
    public process(params) {
      let a;
      let i;
      let l;
      let type;
      let renderer;
      const { graph } = this;
      const options = { ...params, ...this.options };
      const defaultEdgeType = this.settings(options, "defaultEdgeType");
      const defaultNodeType = this.settings(options, "defaultNodeType");

      // Empty float arrays:
      Object.keys(this.nodeFloatArrays).forEach(
        k => delete this.nodeFloatArrays[k]
      );
      Object.keys(this.edgeFloatArrays).forEach(
        k => delete this.edgeFloatArrays[k]
      );
      Object.keys(this.edgeFloatArrays).forEach(
        k => delete this.edgeFloatArrays[k]
      );

      // Sort edges and nodes per types:
      for (a = graph.edges(), i = 0, l = a.length; i < l; i++) {
        type = a[i].type || defaultEdgeType;
        const k = type && sigma.webgl.edges[type] ? type : "def";

        if (!this.edgeFloatArrays[k])
          this.edgeFloatArrays[k] = {
            edges: []
          };

        this.edgeFloatArrays[k].edges.push(a[i]);
      }

      for (a = graph.nodes(), i = 0, l = a.length; i < l; i++) {
        type = a[i].type || defaultNodeType;
        const k = type && sigma.webgl.nodes[type] ? type : "def";

        if (!this.nodeFloatArrays[k])
          this.nodeFloatArrays[k] = {
            nodes: []
          };

        this.nodeFloatArrays[k].nodes.push(a[i]);
      }

      // Push edges:
      Object.keys(this.edgeFloatArrays).forEach(k => {
        renderer = sigma.webgl.edges[k];
        a = this.edgeFloatArrays[k].edges;

        // Creating the necessary arrays
        this.edgeFloatArrays[k].array = new Float32Array(
          a.length * renderer.POINTS * renderer.ATTRIBUTES
        );

        for (i = 0, l = a.length; i < l; i++) {
          // Just check that the edge and both its extremities are visible:
          if (
            !a[i].hidden &&
            !graph.nodes(a[i].source).hidden &&
            !graph.nodes(a[i].target).hidden
          )
            renderer.addEdge(
              a[i],
              graph.nodes(a[i].source),
              graph.nodes(a[i].target),
              this.edgeFloatArrays[k].array,
              i * renderer.POINTS * renderer.ATTRIBUTES,
              options.prefix,
              this.settings
            );
        }

        if (typeof renderer.computeIndices === "function")
          this.edgeIndicesArrays[k] = renderer.computeIndices(
            this.edgeFloatArrays[k].array
          );
      });

      // Push nodes:
      Object.keys(this.nodeFloatArrays).forEach(k => {
        renderer = sigma.webgl.nodes[k];
        a = this.nodeFloatArrays[k].nodes;

        // Creating the necessary arrays
        this.nodeFloatArrays[k].array = new Float32Array(
          a.length * renderer.POINTS * renderer.ATTRIBUTES
        );

        for (i = 0, l = a.length; i < l; i++) {
          if (!this.nodeFloatArrays[k].array)
            this.nodeFloatArrays[k].array = new Float32Array(
              a.length * renderer.POINTS * renderer.ATTRIBUTES
            );

          // Just check that the edge and both its extremities are visible:
          if (!a[i].hidden)
            renderer.addNode(
              a[i],
              this.nodeFloatArrays[k].array,
              i * renderer.POINTS * renderer.ATTRIBUTES,
              options.prefix,
              this.settings
            );
        }
      });

      return this;
    }

    /**
     * This method renders the graph. It basically calls each program (and
     * generate them if they do not exist yet) to render nodes and edges, batched
     * per renderer.
     *
     * As in the canvas renderer, it is possible to display edges, nodes and / or
     * labels in batches, to make the whole thing way more scalable.
     *
     * @param  {?object}               params Eventually an object of options.
     * @return {WebGLRenderer}        Returns the instance itself.
     */
    public render(params?: any) {
      const self = this;
      const nodesGl = this.contexts.nodes;
      const edgesGl = this.contexts.edges;
      let matrix = this.camera.getMatrix();
      const options = { ...params, ...this.options };
      const drawLabels = this.settings(options, "drawLabels");
      let drawEdges = this.settings(options, "drawEdges");
      const drawNodes = this.settings(options, "drawNodes");

      // Call the resize function:
      this.resize();

      // Check the 'hideEdgesOnMove' setting:
      if (this.settings(options, "hideEdgesOnMove"))
        if (this.camera.isAnimated || this.camera.isMoving) drawEdges = false;

      // Clear canvases:
      this.clear();

      // Translate matrix to [width/2, height/2]:
      matrix = multiply(matrix, translation(this.width / 2, this.height / 2));

      // Kill running jobs:
      Object.keys(this.jobs).forEach(k => {
        if (conrad.hasJob(k)) conrad.killJob(k);
      });

      if (drawEdges) {
        if (this.settings(options, "batchEdgesDrawing"))
          (function batch() {
            let arr;
            let end;
            let start;

            const edgeBatchId = `edges_${this.conradId}`;
            const batchSize = this.settings(options, "webglEdgesBatchSize");
            const a = Object.keys(this.edgeFloatArrays);

            if (!a.length) return;
            let i = 0;
            const renderer = sigma.webgl.edges[a[i]];
            arr = this.edgeFloatArrays[a[i]].array;
            const indices = this.edgeIndicesArrays[a[i]];
            start = 0;
            end = Math.min(
              start + batchSize * renderer.POINTS,
              arr.length / renderer.ATTRIBUTES
            );

            const job = () => {
              // Check program:
              if (!this.edgePrograms[a[i]])
                this.edgePrograms[a[i]] = renderer.initProgram(edgesGl);

              if (start < end) {
                edgesGl.useProgram(this.edgePrograms[a[i]]);
                renderer.render(edgesGl, this.edgePrograms[a[i]], arr, {
                  settings: this.settings,
                  matrix,
                  width: this.width,
                  height: this.height,
                  ratio: this.camera.ratio,
                  scalingRatio: this.settings(
                    options,
                    "webglOversamplingRatio"
                  ),
                  start,
                  count: end - start,
                  indicesData: indices
                });
              }

              // Catch job's end:
              if (
                end >= arr.length / renderer.ATTRIBUTES &&
                i === a.length - 1
              ) {
                delete this.jobs[edgeBatchId];
                return false;
              }

              if (end >= arr.length / renderer.ATTRIBUTES) {
                i++;
                arr = this.edgeFloatArrays[a[i]].array;
                const r = sigma.webgl.edges[a[i]];
                start = 0;
                end = Math.min(
                  start + batchSize * r.POINTS,
                  arr.length / r.ATTRIBUTES
                );
              } else {
                start = end;
                end = Math.min(
                  start + batchSize * renderer.POINTS,
                  arr.length / renderer.ATTRIBUTES
                );
              }

              return true;
            };

            this.jobs[edgeBatchId] = job;
            conrad.addJob(edgeBatchId, job);
          }.call(this));
        else {
          Object.keys(this.edgeFloatArrays).forEach(k => {
            const renderer = sigma.webgl.edges[k];

            // Check program:
            if (!this.edgePrograms[k])
              this.edgePrograms[k] = renderer.initProgram(edgesGl);

            // Render
            if (this.edgeFloatArrays[k]) {
              edgesGl.useProgram(this.edgePrograms[k]);
              renderer.render(
                edgesGl,
                this.edgePrograms[k],
                this.edgeFloatArrays[k].array,
                {
                  settings: this.settings,
                  matrix,
                  width: this.width,
                  height: this.height,
                  ratio: this.camera.ratio,
                  scalingRatio: this.settings(
                    options,
                    "webglOversamplingRatio"
                  ),
                  indicesData: this.edgeIndicesArrays[k]
                }
              );
            }
          });
        }
      }

      if (drawNodes) {
        // Enable blending:
        nodesGl.blendFunc(nodesGl.SRC_ALPHA, nodesGl.ONE_MINUS_SRC_ALPHA);
        nodesGl.enable(nodesGl.BLEND);

        Object.keys(this.nodeFloatArrays).forEach(k => {
          const renderer = sigma.webgl.nodes[k];

          // Check program:
          if (!this.nodePrograms[k])
            this.nodePrograms[k] = renderer.initProgram(nodesGl);

          // Render
          if (this.nodeFloatArrays[k]) {
            nodesGl.useProgram(this.nodePrograms[k]);
            renderer.render(
              nodesGl,
              this.nodePrograms[k],
              this.nodeFloatArrays[k].array,
              {
                settings: this.settings,
                matrix,
                width: this.width,
                height: this.height,
                ratio: this.camera.ratio,
                scalingRatio: this.settings(options, "webglOversamplingRatio")
              }
            );
          }
        });
      }

      const a = this.camera.quadtree.area(
        this.camera.getRectangle(this.width, this.height)
      );

      // Apply camera view to these nodes:
      this.camera.applyView(undefined, undefined, {
        nodes: a,
        edges: [],
        width: this.width,
        height: this.height
      });

      if (drawLabels) {
        const o = self.settings.embedObjects({
          prefix: self.camera.prefix
        });

        for (let i = 0; i < a.length; i++)
          if (!a[i].hidden)
            (sigma.canvas.labels[
              a[i].type || this.settings(options, "defaultNodeType")
            ] || sigma.canvas.labels.def)(a[i], this.contexts.labels, o);
      }

      this.dispatchEvent("render");
      return this;
    }

    /**
     * This method creates a DOM element of the specified type, switches its
     * position to "absolute", references it to the domElements attribute, and
     * finally appends it to the container.
     *
     * @param  {string}   tag   The label tag.
     * @param  {string}   id    The id of the element (to store it in
     *                          "domElements").
     * @param  {?boolean} webgl Will init the WebGL context if true.
     */
    public initDOM(tag: string, elementId: string, webgl?: boolean) {
      const dom = document.createElement(tag) as HTMLCanvasElement;
      const self = this;

      dom.style.position = "absolute";
      dom.setAttribute("class", `sigma-${elementId}`);

      this.domElements[elementId] = dom;
      this.container.appendChild(dom);

      if (tag.toLowerCase() === "canvas") {
        this.contexts[elementId] = dom.getContext(
          webgl ? "experimental-webgl" : "2d",
          {
            preserveDrawingBuffer: true
          }
        );

        // Adding webgl context loss listeners
        if (webgl) {
          dom.addEventListener(
            "webglcontextlost",
            e => e.preventDefault(),
            false
          );

          dom.addEventListener(
            "webglcontextrestored",
            () => self.render(),
            false
          );
        }
      }
    }

    /**
     * This method resizes each DOM elements in the container and stores the new
     * dimensions. Then, it renders the graph.
     *
     * @param  {?number}               width  The new width of the container.
     * @param  {?number}               height The new height of the container.
     * @return {WebGLRenderer}        Returns the instance itself.
     */
    public resize(w?: number, h?: number) {
      const oldWidth = this.width;
      const oldHeight = this.height;
      const pixelRatio = getPixelRatio();

      if (w !== undefined && h !== undefined) {
        this.width = w;
        this.height = h;
      } else {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        w = this.width;
        h = this.height;
      }

      if (oldWidth !== this.width || oldHeight !== this.height) {
        Object.keys(this.domElements).forEach(k => {
          const context = this.contexts[k] as CanvasRenderingContext2D;
          const element = this.domElements[k];

          element.style.width = `${w}px`;
          element.style.height = `${h}px`;

          if (element.tagName.toLowerCase() === "canvas") {
            // If simple 2D canvas:
            if (context && context.scale) {
              element.setAttribute("width", `${w * pixelRatio}px`);
              element.setAttribute("height", `${h * pixelRatio}px`);

              if (pixelRatio !== 1) context.scale(pixelRatio, pixelRatio);
            } else {
              element.setAttribute(
                "width",
                `${w * this.settings("webglOversamplingRatio")}px`
              );
              element.setAttribute(
                "height",
                `${h * this.settings("webglOversamplingRatio")}px`
              );
            }
          }
        });
      }

      // Scale:
      Object.keys(this.contexts).forEach(k => {
        const context = this.contexts[k] as WebGLRenderingContext;
        if (context && context.viewport)
          context.viewport(
            0,
            0,
            this.width * this.settings("webglOversamplingRatio"),
            this.height * this.settings("webglOversamplingRatio")
          );
      });

      return this;
    }

    /**
     * This method clears each canvas.
     *
     * @return {WebGLRenderer} Returns the instance itself.
     */
    public clear() {
      this.contexts.labels.clearRect(0, 0, this.width, this.height);
      this.contexts.nodes.clear(this.contexts.nodes.COLOR_BUFFER_BIT);
      this.contexts.edges.clear(this.contexts.edges.COLOR_BUFFER_BIT);

      return this;
    }

    /**
     * This method kills contexts and other attributes.
     */
    public kill() {
      let captor;

      // Kill captors:
      // eslint-disable-next-line no-cond-assign
      while ((captor = this.captors.pop())) captor.kill();
      delete this.captors;

      // Kill contexts:
      Object.keys(this.domElements).forEach(k => {
        this.domElements[k].parentNode.removeChild(this.domElements[k]);
        delete this.domElements[k];
        delete this.contexts[k];
      });
      delete this.domElements;
      delete this.contexts;
    }
  };
};
