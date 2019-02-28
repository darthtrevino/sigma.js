// @ts-ignore
import conrad from "conrad";
import Dispatcher from "../../classes/Dispatcher";
import id from "../../utils/misc/id";
import getPixelRatio from "../../utils/events/getPixelRatio";
import {
  SigmaLibrary,
  Renderer,
  Captor,
  Node,
  Edge,
  Keyed,
  CanvasEdgeDrawer
} from "../../../interfaces";
import Camera from "../../classes/Camera";
import Graph from "../../classes/Graph";
import { Settings } from "../../classes/Configurable";
import { EHOSTUNREACH } from "constants";

export default (sigma: SigmaLibrary) => {
  return class CanvasRenderer extends Dispatcher implements Renderer {
    public id = "__ID_NOT_SET__";
    private container: HTMLElement;
    public contexts: Keyed<CanvasRenderingContext2D> = {};
    private domElements: Keyed<HTMLElement> = {};
    private nodesOnScreen: Node[] = [];
    private edgesOnScreen: Edge[] = [];
    public captors: Captor[] = [];
    public width = 0;
    public height = 0;

    // Conrad related attributes:
    private jobs: Keyed<Function> = {};
    private conradId = id();

    /**
     * This function is the constructor of the canvas sigma's renderer.
     *
     * @param  {graph}            graph    The graph to render.
     * @param  {camera}           camera   The camera.
     * @param  {configurable}           settings The sigma instance settings
     *                                           function.
     * @param  {object}                 object   The options object.
     * @return {Canvas}          The renderer instance.
     */
    constructor(
      public graph: Graph,
      public camera: Camera,
      public settings: Settings,
      public options: any
    ) {
      super();
      if (typeof options !== "object") {
        throw new Error("Canvas: Wrong arguments.");
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
      this.options.prefix = `renderer${this.conradId}:`;

      // Initialize the DOM elements:
      if (!this.settings("batchEdgesDrawing")) {
        this.initDOM("canvas", "scene");
        this.contexts.edges = this.contexts.scene;
        this.contexts.nodes = this.contexts.scene;
        this.contexts.labels = this.contexts.scene;
      } else {
        this.initDOM("canvas", "edges");
        this.initDOM("canvas", "scene");
        this.contexts.nodes = this.contexts.scene;
        this.contexts.labels = this.contexts.scene;
      }

      this.initDOM("canvas", "mouse");
      this.contexts.hover = this.contexts.mouse;

      // Initialize captors:
      this.captors = [];
      const a = this.options.captors || [
        sigma.captors.mouse,
        sigma.captors.touch
      ];
      for (let i = 0; i < a.length; i++) {
        const fn = typeof a[i] === "function" ? a[i] : sigma.captors[a[i]];
        this.captors.push(
          new fn(this.domElements.mouse, this.camera, this.settings)
        );
      }

      // Deal with sigma events:
      sigma.misc.bindEvents.call(this, this.options.prefix);
      sigma.misc.drawHovers.call(this, this.options.prefix);

      this.resize();
    }

    /**
     * This method renders the graph on the canvases.
     *
     * @param  {?object}                options Eventually an object of options.
     * @return {Canvas}         Returns the instance itself.
     */
    public render(options?: any) {
      options = options || {};
      let o;
      const index: Keyed<boolean> = {};
      let drawEdges = this.settings(options, "drawEdges");
      const drawNodes = this.settings(options, "drawNodes");
      const drawLabels = this.settings(options, "drawLabels");
      const embedSettings = this.settings.embedObjects(options, {
        prefix: this.options.prefix
      });

      // Call the resize function:
      this.resize();

      // Check the 'hideEdgesOnMove' setting:
      if (this.settings(options, "hideEdgesOnMove"))
        if (this.camera.isAnimated || this.camera.isMoving) drawEdges = false;

      // Apply the camera's view:
      this.camera.applyView(undefined, this.options.prefix, {
        width: this.width,
        height: this.height
      });

      // Clear canvases:
      this.clear();

      // Kill running jobs:
      Object.keys(this.jobs).forEach(k => {
        if (conrad.hasJob(k)) conrad.killJob(k);
      });

      // Find which nodes are on screen:
      this.edgesOnScreen = [];
      this.nodesOnScreen = this.camera.quadtree!.area(
        this.camera.getRectangle(this.width, this.height)
      );
      this.nodesOnScreen.forEach(node => (index[node.id] = true));
      const visibleNodes = this.nodesOnScreen.filter(t => !t.hidden);

      // Draw edges:
      // - If settings('batchEdgesDrawing') is true, the edges are displayed per
      //   batches. If not, they are drawn in one frame.
      if (drawEdges) {
        // First, let's identify which edges to draw. To do this, we just keep
        // every edges that have at least one extremity displayed according to
        // the quadtree and the "hidden" attribute. We also do not keep hidden
        // edges.
        this.edgesOnScreen = this.graph
          .edges()
          .filter(e => !e.hidden)
          .filter(e => {
            const [source, target] = this.graph.nodes(e.source, e.target);
            return !source.hidden && !target.hidden;
          })
          .filter(e => index[e.source] && index[e.target]);

        this.drawEdges(embedSettings, options);
      }

      if (drawNodes) {
        this.drawNodes(visibleNodes, embedSettings, options);
      }
      if (drawLabels) {
        this.drawLabels(visibleNodes, embedSettings, options);
      }
      this.dispatchEvent("render");
      return this;
    }

    private drawEdges(embedSettings: Settings, options: any) {
      const drawEdgeLabels = this.settings(options, "drawEdgeLabels");
      const isBatched = this.settings(options, "batchEdgesDrawing");
      // If the "batchEdgesDrawing" settings is true, edges are batched:
      if (isBatched) {
        const edgeJobId = `edges_${this.conradId}`;
        const batchSize = embedSettings("canvasEdgesBatchSize");

        const edges = this.edgesOnScreen;

        let start = 0;
        let end = Math.min(edges.length, start + batchSize);

        const job = () => {
          const renderers = sigma.canvas.edges;
          const tempGCO = this.contexts.edges.globalCompositeOperation;
          this.contexts.edges.globalCompositeOperation = "destination-over";

          for (let i = start; i < end; i++) {
            const edge = edges[i];
            const [source, target] = this.graph.nodes(edge.source, edge.target);
            const type =
              edge.type || this.settings(options, "defaultEdgeType") || "def";

            (renderers[type] as CanvasEdgeDrawer)(
              edge,
              source,
              target,
              this.contexts.edges,
              embedSettings
            );
          }

          // Draw edge labels:
          if (drawEdgeLabels) {
            const renderers = sigma.canvas.edges.labels;
            for (let i = start; i < end; i++) {
              const edge = edges[i];
              if (!edge.hidden) {
                const [source, target] = this.graph.nodes(
                  edge.source,
                  edge.target
                );
                const type =
                  edge.type ||
                  this.settings(options, "defaultEdgeType") ||
                  "def";
                renderers[type](
                  edge,
                  source,
                  target,
                  this.contexts.labels,
                  embedSettings
                );
              }
            }
          }

          // Restore original globalCompositeOperation:
          this.contexts.edges.globalCompositeOperation = tempGCO;

          // Catch job's end:
          if (end === edges.length) {
            delete this.jobs[edgeJobId];
            return false;
          }

          start = end + 1;
          end = Math.min(edges.length, start + batchSize);
          return true;
        };

        this.jobs[edgeJobId] = job;
        conrad.addJob(edgeJobId, job);

        // If not, they are drawn in one frame:
      } else {
        const renderers = sigma.canvas.edges;
        this.edgesOnScreen.forEach(edge => {
          const [source, target] = this.graph.nodes(edge.source, edge.target);
          const type =
            edge.type || this.settings(options, "defaultEdgeType") || "def";
          (renderers[type] as CanvasEdgeDrawer)(
            edge,
            source,
            target,
            this.contexts.edges,
            embedSettings
          );
        });

        // Draw edge labels:
        // - No batching
        if (drawEdgeLabels) {
          const renderers = sigma.canvas.edges.labels;
          this.edgesOnScreen
            .filter(e => !e.hidden)
            .forEach(edge => {
              const [source, target] = this.graph.nodes(
                edge.source,
                edge.target
              );
              const type =
                edge.type || this.settings(options, "defaultEdgeType") || "def";
              renderers[type](
                edge,
                source,
                target,
                this.contexts.labels,
                embedSettings
              );
            });
        }
      }
    }

    private drawNodes(
      visibleNodes: Node[],
      embedSettings: Settings,
      options: any
    ) {
      const renderers = sigma.canvas.nodes;
      visibleNodes.forEach(node => {
        (renderers[node.type || this.settings(options, "defaultNodeType")] ||
          renderers.def)(node, this.contexts.nodes, embedSettings);
      });
    }

    private drawLabels(
      visibleNodes: Node[],
      embedSettings: Settings,
      options: any
    ) {
      const renderers = sigma.canvas.labels;
      visibleNodes.forEach(node => {
        (renderers[node.type || this.settings(options, "defaultNodeType")] ||
          renderers.def)(node, this.contexts.labels, embedSettings);
      });
    }

    /**
     * This method creates a DOM element of the specified type, switches its
     * position to "absolute", references it to the domElements attribute, and
     * finally appends it to the container.
     *
     * @param  {string} tag The label tag.
     * @param  {string} id  The id of the element (to store it in "domElements").
     */
    public initDOM(tag: string, elementId: string) {
      const dom = document.createElement(tag) as HTMLCanvasElement;

      dom.style.position = "absolute";
      dom.setAttribute("class", `sigma-${elementId}`);

      this.domElements[elementId] = dom;
      this.container.appendChild(dom);

      if (tag.toLowerCase() === "canvas") {
        const context = dom.getContext("2d");
        if (context) {
          this.contexts[elementId] = context;
        }
      }
    }

    /**
     * This method resizes each DOM elements in the container and stores the new
     * dimensions. Then, it renders the graph.
     *
     * @param  {?number}                width  The new width of the container.
     * @param  {?number}                height The new height of the container.
     * @return {Canvas}        Returns the instance itself.
     */
    public resize(w?: number, h?: number) {
      const oldWidth = this.width;
      const oldHeight = this.height;
      const pixelRatio = getPixelRatio();

      if (w !== undefined) {
        this.width = w;
        this.width = this.container.offsetWidth;
      } else {
        w = this.width;
      }
      if (h !== undefined) {
        this.height = h;
        this.height = this.container.offsetHeight;
      } else {
        h = this.height;
      }

      if (oldWidth !== this.width || oldHeight !== this.height) {
        Object.keys(this.domElements).forEach(k => {
          this.domElements[k].style.width = `${w!}px`;
          this.domElements[k].style.height = `${h!}px`;

          if (this.domElements[k].tagName.toLowerCase() === "canvas") {
            this.domElements[k].setAttribute("width", `${w! * pixelRatio}px`);
            this.domElements[k].setAttribute("height", `${h! * pixelRatio}px`);

            if (pixelRatio !== 1)
              this.contexts[k].scale(pixelRatio, pixelRatio);
          }
        });
      }

      return this;
    }

    /**
     * This method clears each canvas.
     *
     * @return {Canvas} Returns the instance itself.
     */
    public clear() {
      Object.keys(this.contexts).forEach(k => {
        this.contexts[k].clearRect(0, 0, this.width, this.height);
      });

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
        const element = this.domElements[k];
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        delete this.domElements[k];
        delete this.contexts[k];
      });
      delete this.domElements;
      delete this.contexts;
    }
  };
};
