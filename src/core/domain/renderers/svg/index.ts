import id from "../../utils/misc/id";
import Dispatcher from "../../classes/Dispatcher";
import {
  SigmaLibrary,
  Renderer,
  Keyed,
  Captor,
  SigmaDispatchedEvent,
  Node,
  Edge
} from "../../../interfaces";
import Graph from "../../classes/Graph";
import Camera from "../../classes/Camera";
import { Settings } from "../../classes/Configurable";

export default (sigma: SigmaLibrary) => {
  return class SvgRenderer extends Dispatcher implements Renderer {
    public id = "__ID_NOT_SET__";
    private container: HTMLElement;
    private domElements: {
      graph: HTMLElement;
      groups: Keyed<HTMLElement>;
      nodes: Keyed<HTMLElement>;
      edges: Keyed<HTMLElement>;
      labels: Keyed<HTMLElement>;
      hovers: Keyed<HTMLElement>;
      [key: string]: HTMLElement | Keyed<HTMLElement>;
    } = {} as any;
    private measurementCanvas: CanvasRenderingContext2D | undefined;
    private nodesOnScreen: Node[] = [];
    private edgesOnScreen: Edge[] = [];
    public captors: Captor[];
    public width = 0;
    public height = 0;
    public contexts = {};

    //graph: null,
    // groups: {},
    // nodes: {},
    // edges: {},
    // labels: {},
    // hovers: {}

    /**
     * This function is the constructor of the svg sigma's renderer.
     *
     * @param  {sigma.classes.graph}            graph    The graph to render.
     * @param  {sigma.classes.camera}           camera   The camera.
     * @param  {configurable}           settings The sigma instance settings
     *                                           function.
     * @param  {object}                 object   The options object.
     * @return {SvgRenderer}             The renderer instance.
     */
    constructor(
      public graph: Graph,
      public camera: Camera,
      public settings: Settings,
      public options: any
    ) {
      super();
      if (typeof options !== "object") {
        throw new Error("SvgRenderer: Wrong options arguments.");
      }

      if (!(options.container instanceof HTMLElement)) {
        throw new Error("Container not found.");
      }

      this.container = this.options.container;
      this.settings =
        typeof options.settings === "object" && options.settings
          ? settings.embedObjects(options.settings)
          : settings;

      // Is the renderer meant to be freestyle?
      this.settings("freeStyle", !!this.options.freeStyle);

      // SVG xmlns
      this.settings("xmlns", "http://www.w3.org/2000/svg");

      // Find the prefix:
      this.options.prefix = `renderer${id()}:`;

      // Initialize the DOM elements
      this.initDOM("svg");

      // Initialize captors:
      const captors = this.options.captors || [
        sigma.captors.mouse,
        sigma.captors.touch
      ];
      this.captors = captors.map((captor: string | Function) => {
        const Captor =
          typeof captor === "function" ? captor : sigma.captors[captor];
        return new Captor(this.domElements.graph, this.camera, this.settings);
      });

      // Bind resize:
      window.addEventListener("resize", () => this.resize());

      // Deal with sigma events:
      // TODO: keep an option to override the DOM events?
      sigma.misc.bindDOMEvents.call(this, this.domElements.graph);
      this.bindHovers(this.options.prefix);

      // Resize
      this.resize();
    }

    /**
     * This method renders the graph on the svg scene.
     *
     * @param  {?object}                options Eventually an object of options.
     * @return {SvgRenderer}            Returns the instance itself
     */
    public render(options?: any) {
      options = options || {};
      const drawEdges =
        this.settings(options, "drawEdges") &&
        !(
          this.settings(options, "hideEdgesOnMove") &&
          (this.camera.isAnimated || this.camera.isMoving)
        );
      const drawNodes = this.settings(options, "drawNodes");
      const embedSettings = this.settings.embedObjects(options, {
        prefix: this.options.prefix,
        forceLabels: this.options.forceLabels
      });

      // Apply the camera's view:
      this.camera.applyView(undefined, this.options.prefix, {
        width: this.width,
        height: this.height
      });

      // Hiding everything
      // TODO: find a more sensible way to perform this operation
      this.hideDOMElements(this.domElements.nodes);
      this.hideDOMElements(this.domElements.edges);
      this.hideDOMElements(this.domElements.labels);

      this.determineVisibleNodesAndEdges();

      if (drawNodes) {
        this.renderNodes(embedSettings);
      }
      if (drawEdges) {
        this.renderEdges(embedSettings);
      }

      this.dispatchEvent("render");

      return this;
    }

    private determineVisibleNodesAndEdges() {
      const index: Keyed<boolean> = {};

      this.nodesOnScreen = this.camera.quadtree!.area(
        this.camera.getRectangle(this.width, this.height)
      );
      this.nodesOnScreen.forEach(node => (index[node.id] = true));

      // Find which nodes are on screen
      this.edgesOnScreen = [];

      // Find which edges are on screen
      this.graph.edges().forEach(edge => {
        const [source, target] = this.graph.nodes(edge.source, edge.target);
        const isEitherEndVisible = index[edge.source] || index[edge.target];
        const isEitherEndHidden = edge.hidden || source.hidden || target.hidden;

        if (isEitherEndVisible && !isEitherEndHidden)
          this.edgesOnScreen.push(edge);
      });
    }

    private renderNodes(embedSettings: Settings) {
      // Display nodes
      const renderers = sigma.svg.nodes;
      const subrenderers = sigma.svg.labels;
      const visibleNodes = this.nodesOnScreen.filter(node => !node.hidden);

      // -- First we create the nodes which are not already created
      visibleNodes
        .filter(node => !this.domElements.nodes[node.id])
        .forEach(node => {
          if (!node.hidden && !this.domElements.nodes[node.id]) {
            // Node
            const nodeElement = (renderers[node.type] || renderers.def).create(
              node,
              embedSettings
            );

            this.domElements.nodes[node.id] = nodeElement;
            this.domElements.groups.nodes.appendChild(nodeElement);

            // Label
            const labelElement = (
              subrenderers[node.type] || subrenderers.def
            ).create(node, embedSettings);
            this.domElements.labels[node.id] = labelElement;
            this.domElements.groups.labels.appendChild(labelElement);
          }
        });

      // -- Second we update the nodes
      visibleNodes.forEach(node => {
        // Node
        (renderers[node.type] || renderers.def).update(
          node,
          this.domElements.nodes[node.id],
          embedSettings
        );

        // Label
        (subrenderers[node.type] || subrenderers.def).update(
          node,
          this.domElements.labels[node.id],
          embedSettings
        );
      });
    }

    private renderEdges(settings: Settings) {
      // Display edges
      const renderers = sigma.svg.edges;
      const visibleEdges = this.edgesOnScreen;

      // -- First we create the edges which are not already created
      visibleEdges.forEach(edge => {
        if (!this.domElements.edges[edge.id]) {
          const [source, target] = this.graph.nodes(edge.source, edge.target);
          const edgeElement = (renderers[edge.type] || renderers.def).create(
            edge,
            source,
            target,
            settings
          );

          this.domElements.edges[edge.id] = edgeElement;
          this.domElements.groups.edges.appendChild(edgeElement);
        }
      });

      // -- Second we update the edges
      visibleEdges.forEach(edge => {
        const [source, target] = this.graph.nodes(edge.source, edge.target);
        (renderers[edge.type] || renderers.def).update(
          edge,
          this.domElements.edges[edge.id],
          source,
          target,
          settings
        );
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
    public initDOM(tag: string) {
      const dom = document.createElementNS(this.settings("xmlns"), tag);
      const c = this.settings("classPrefix");
      let l;
      let i;
      dom.style.position = "absolute";
      dom.setAttribute("class", `${c}-svg`);

      // Setting SVG namespace
      dom.setAttribute("xmlns", this.settings("xmlns"));
      dom.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      dom.setAttribute("version", "1.1");

      // Creating the measurement canvas
      const canvas = document.createElement("canvas");
      canvas.setAttribute("class", `${c}-measurement-canvas`);

      // Appending elements
      this.domElements.graph = this.container.appendChild(dom);

      // Creating groups
      const groups = ["edges", "nodes", "labels", "hovers"];
      for (i = 0, l = groups.length; i < l; i++) {
        const g = document.createElementNS(this.settings("xmlns"), "g");
        g.setAttributeNS(null, "id", `${c}-group-${groups[i]}`);
        g.setAttributeNS(null, "class", `${c}-group`);

        this.domElements.groups[groups[i]] = this.domElements.graph.appendChild(
          g
        );
      }

      // Appending measurement canvas
      this.container.appendChild(canvas);
      this.measurementCanvas = canvas.getContext("2d") || undefined;
    }

    /**
     * This method hides a batch of SVG DOM elements.
     *
     * @param  {array}                  elements  An array of elements to hide.
     * @param  {object}                 renderer  The renderer to use.
     * @return {SvgRenderer}              Returns the instance itself
     */
    public hideDOMElements(elements: Keyed<HTMLElement>) {
      Object.keys(elements).forEach(i => {
        const o = elements[i];
        sigma.svg.utils.hide(o);
      });
      return this;
    }

    /**
     * This method binds the hover events to the renderer.
     *
     * @param  {string} prefix The renderer prefix.
     */
    // TODO: add option about whether to display hovers or not
    public bindHovers(prefix: string) {
      const renderers = sigma.svg.hovers;
      let hoveredNode: Node | undefined;
      const overNode = (e: SigmaDispatchedEvent) => {
        const { node } = e.data;
        const embedSettings = this.settings.embedObjects({
          prefix
        });

        if (!embedSettings("enableHovering")) return;

        const hover = (renderers[node.type] || renderers.def).create(
          node,
          this.domElements.nodes[node.id],
          this.measurementCanvas!,
          embedSettings
        );

        this.domElements.hovers[node.id] = hover;

        // Inserting the hover in the dom
        this.domElements.groups.hovers.appendChild(hover);
        hoveredNode = node;
      };

      const outNode = (e: SigmaDispatchedEvent) => {
        const { node } = e.data;
        const embedSettings = this.settings.embedObjects({
          prefix
        });

        if (!embedSettings("enableHovering")) return;

        // Deleting element
        this.domElements.groups.hovers.removeChild(
          this.domElements.hovers[node.id]
        );
        hoveredNode = undefined;
        delete this.domElements.hovers[node.id];

        // Reinstate
        this.domElements.groups.nodes.appendChild(
          this.domElements.nodes[node.id]
        );
      };

      // OPTIMIZE: perform a real update rather than a deletion
      const update = () => {
        if (!hoveredNode) return;

        const embedSettings = this.settings.embedObjects({
          prefix
        });

        // Deleting element before update
        this.domElements.groups.hovers.removeChild(
          this.domElements.hovers[hoveredNode.id]
        );
        delete this.domElements.hovers[hoveredNode.id];

        const hover = (renderers[hoveredNode.type] || renderers.def).create(
          hoveredNode,
          this.domElements.nodes[hoveredNode.id],
          this.measurementCanvas!,
          embedSettings
        );

        this.domElements.hovers[hoveredNode.id] = hover;

        // Inserting the hover in the dom
        this.domElements.groups.hovers.appendChild(hover);
      };

      // Binding events
      this.bind("overNode", overNode);
      this.bind("outNode", outNode);

      // Update on render
      this.bind("render", update);
    }

    /**
     * This method resizes each DOM elements in the container and stores the new
     * dimensions. Then, it renders the graph.
     *
     * @param  {?number}                width  The new width of the container.
     * @param  {?number}                height The new height of the container.
     * @return {SvgRenderer}           Returns the instance itself
     */
    public resize(w?: number, h?: number) {
      const oldWidth = this.width;
      const oldHeight = this.height;
      const pixelRatio = 1;

      if (w !== undefined) {
        this.width = w;
      } else {
        this.width = this.container.offsetWidth;
        w = this.width;
      }
      if (h !== undefined) {
        this.height = h;
      } else {
        this.height = this.container.offsetHeight;
        h = this.height;
      }

      if (oldWidth !== this.width || oldHeight !== this.height) {
        this.domElements.graph.style.width = `${w!}px`;
        this.domElements.graph.style.height = `${h!}px`;
        if (this.domElements.graph.tagName.toLowerCase() === "svg") {
          this.domElements.graph.setAttribute("width", `${w! * pixelRatio}`);
          this.domElements.graph.setAttribute("height", `${h! * pixelRatio}`);
        }
      }

      return this;
    }

    /**
     * This method clears each canvas
     *
     * @return {SvgRenderer} Returns the instance itself.
     */
    public clear() {
      // TODO
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

      const remove = (element: HTMLElement) => {
        if (element.parentNode) {
          element.parentNode!.removeChild(element);
        }
      };

      // Kill contexts:
      Object.keys(this.domElements).forEach(k => {
        if (this.domElements[k] instanceof HTMLElement) {
          const element = this.domElements[k] as HTMLElement;
          remove(element);
        } else {
          const map = this.domElements[k] as Keyed<HTMLElement>;
          Object.keys(map).forEach(kk => remove(map[kk]));
        }
        delete this.domElements[k];
      });
      delete this.domElements;
    }
  };
};
