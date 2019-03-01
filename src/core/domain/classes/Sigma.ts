import Dispatcher from "./Dispatcher";
import Camera, { CameraLocation } from "./Camera";
import Graph from "./Graph";
import { Settings } from "./Configurable";
import {
  SigmaConfiguration,
  Keyed,
  SigmaSettings,
  Renderer,
  SigmaUtils,
  SigmaMisc,
  SigmaWebGLUtilities,
  SigmaSvgUtils,
  SigmaCanvasUtils,
  Killable,
  SigmaDispatchedEvent
} from "../../interfaces";

const __instances: Keyed<Sigma> = {};

// Little shortcut:
// ****************
// The configuration is supposed to have a list of the configuration
// objects for each renderer.
//  - If there are no configuration at all, then nothing is done.
//  - If there are no renderer list, the given configuration object will be
//    considered as describing the first and only renderer.
//  - If there are no renderer list nor "container" object, it will be
//    considered as the container itself (a DOM element).
//  - If the argument passed to sigma() is a string, it will be considered
//    as the ID of the DOM container.
function unpackConf(conf: string | HTMLElement | Object): SigmaConfiguration {
  let result: SigmaConfiguration;
  if (typeof conf === "string" || conf instanceof HTMLElement) {
    result = {
      renderers: [conf]
    };
  } else if (Object.prototype.toString.call(conf) === "[object Array]") {
    result = {
      renderers: conf as any
    };
  } else {
    result = conf as SigmaConfiguration;
  }

  // Also check "renderer" and "container" keys:
  const o = result.renderers || result.renderer || result.container;
  if (!result.renderers || result.renderers.length === 0) {
    if (
      typeof o === "string" ||
      o instanceof HTMLElement ||
      (typeof o === "object" && "container" in o)
    )
      result.renderers = [o];
  }
  return result;
}

function determineId(conf: SigmaConfiguration): string {
  // Recense the instance:
  if (conf.id) {
    if (__instances[conf.id]) {
      throw new Error(`sigma: Instance "${conf.id}" already exists.`);
    }
    return conf.id;
  } else {
    let id = 0;
    while (__instances[id]) id++;
    return `${id}`;
  }
}

/**
 * This is the sigma instances constructor. One instance of sigma represent
 * one graph. It is possible to represent this grapĥ with several renderers
 * at the same time. By default, the default renderer (WebGL + Canvas
 * polyfill) will be used as the only renderer, with the container specified
 * in the configuration.
 *
 * @param  {?*}    conf The configuration of the instance. There are a lot of
 *                      different recognized forms to instantiate sigma, check
 *                      example files, documentation in this file and unit
 *                      tests to know more.
 * @return {Sigma}      The fresh new sigma instance.
 *
 * Instanciating sigma:
 * ********************
 * If no parameter is given to the constructor, the instance will be created
 * without any renderer or camera. It will just instantiate the graph, and
 * other modules will have to be instantiated through the public methods,
 * like "addRenderer" etc:
 *
 *  > s0 = new sigma();
 *  > s0.addRenderer({
 *  >   type: 'canvas',
 *  >   container: 'my-container-id'
 *  > });
 *
 * In most of the cases, sigma will simply be used with the default renderer.
 * Then, since the only required parameter is the DOM container, there are
 * some simpler way to call the constructor. The four following calls do the
 * exact same things:
 *
 *  > s1 = new sigma('my-container-id');
 *  > s2 = new sigma(document.getElementById('my-container-id'));
 *  > s3 = new sigma({
 *  >   container: document.getElementById('my-container-id')
 *  > });
 *  > s4 = new sigma({
 *  >   renderers: [{
 *  >     container: document.getElementById('my-container-id')
 *  >   }]
 *  > });
 *
 * Recognized parameters:
 * **********************
 * Here is the exhaustive list of every accepted parameters, when calling the
 * constructor with to top level configuration object (fourth case in the
 * previous examples):
 *
 *   {?string} id        The id of the instance. It will be generated
 *                       automatically if not specified.
 *   {?array}  renderers An array containing objects describing renderers.
 *   {?object} graph     An object containing an array of nodes and an array
 *                       of edges, to avoid having to add them by hand later.
 *   {?object} settings  An object containing instance specific settings that
 *                       will override the default ones defined in the object
 *                       sigma.settings.
 */
class Sigma extends Dispatcher {
  // Static Data
  public static classes: any = {};
  public static settings: SigmaSettings;

  // current sigma version
  public static version = "1.2.1";

  // utility namespaces
  public static renderers: Keyed<any> = {};
  public static plugins: Keyed<any> = {};
  public static middlewares: Keyed<any> = {};
  public static utils: SigmaUtils = {
    pkg: getPackageObject
  } as any;
  public static misc: SigmaMisc = {} as any;
  public static captors: Keyed<Killable> = {};
  public static canvas: SigmaCanvasUtils = {} as any;
  public static svg: SigmaSvgUtils = {} as any;
  public static webgl: SigmaWebGLUtilities = {} as any;

  // Instance Data
  public events = [
    "click",
    "rightClick",
    "clickStage",
    "doubleClickStage",
    "rightClickStage",
    "clickNode",
    "clickNodes",
    "doubleClickNode",
    "doubleClickNodes",
    "rightClickNode",
    "rightClickNodes",
    "overNode",
    "overNodes",
    "outNode",
    "outNodes",
    "downNode",
    "downNodes",
    "upNode",
    "upNodes"
  ];
  private conf: SigmaConfiguration;
  public readonly id: string;
  public settings: Settings;
  public graph: Graph;
  public middlewares: Function[] = [];
  public cameras: Keyed<Camera> = {};
  public renderers: Keyed<any> = {};
  public renderersPerCamera: Keyed<Renderer[]> = {};
  public cameraFrames: Keyed<any> = {};

  constructor(conf: any = {}) {
    super();
    this.conf = unpackConf(conf);

    // Register the instance:
    this.id = determineId(conf);
    __instances[this.id] = this;

    // Initialize locked attributes:
    this.settings = Sigma.classes.configurable(
      Sigma.settings,
      this.conf.settings || {}
    );
    this.graph = new Sigma.classes.graph(this.settings);
    this.initializeRenderers();
    this.initializeMiddleware();
    this.initializeGraphData();

    // Deal with resize:
    window.addEventListener("resize", () => this.settings && this.refresh());
  }

  private initializeMiddleware() {
    const middlewares = this.conf.middlewares || [];
    middlewares.forEach((item: string | Function) => {
      const mw = item === "string" ? Sigma.middlewares[item] : item;
      this.middlewares.push(mw);
    });
  }

  private initializeRenderers() {
    const renderers = this.conf.renderers || [];
    renderers.forEach(r => this.addRenderer(r));
  }

  private initializeGraphData() {
    // Check if there is already a graph to fill in:
    if (typeof this.conf.graph === "object" && this.conf.graph) {
      this.graph.read(this.conf.graph);

      // If a graph is given to the to the instance, the "refresh" method is
      // directly called:
      this.refresh();
    }
  }

  // Add a custom handler, to redispatch events from renderers:
  private _handler = (e: SigmaDispatchedEvent) => {
    const data: Keyed<any> = {};
    Object.keys(e.data).forEach(key => {
      data[key] = e.data[key];
    });
    data.renderer = e.target;
    this.dispatchEvent(e.type, data);
  };

  public get camera() {
    return this.cameras[0];
  }

  private nextCameraId() {
    let id = 0;
    while (this.cameras[`${id}`]) id++;
    return `${id}`;
  }
  /**
   * This methods will instantiate and reference a new camera. If no id is
   * specified, then an automatic id will be generated.
   *
   * @param  {?string}              id Eventually the camera id.
   * @return {sigma.classes.camera}    The fresh new camera instance.
   */
  public addCamera(id: string = this.nextCameraId()) {
    if (this.cameras[id]) {
      throw new Error(`sigma.addCamera: The camera "${id}" already exists.`);
    }

    const camera = new Sigma.classes.camera(id, this.graph, this.settings);
    this.cameras[id] = camera;

    // Add a quadtree to the camera:
    camera.quadtree = new Sigma.classes.quad();

    // Add an edgequadtree to the camera:
    if (Sigma.classes.edgequad !== undefined) {
      camera.edgequadtree = new Sigma.classes.edgequad(this.graph);
    }

    camera.bind("coordinatesUpdated", () =>
      this.renderCamera(camera, camera.isAnimated)
    );

    this.renderersPerCamera[id] = [];
    return camera;
  }

  /**
   * This method kills a camera, and every renderer attached to it.
   *
   * @param  {string|camera} v The camera to kill or its ID.
   * @return {Sigma}           Returns the instance.
   */
  public killCamera(v: string | Camera) {
    const camera: Camera =
      typeof v === "string" ? this.cameras[v] : (v as Camera);

    if (!camera) throw new Error("sigma.killCamera: The camera is undefined.");

    let i;
    let l;
    const a = this.renderersPerCamera[camera.id];

    for (l = a.length, i = l - 1; i >= 0; i--) {
      this.killRenderer(a[i]);
    }

    delete this.renderersPerCamera[camera.id];
    delete this.cameraFrames[camera.id];
    delete this.cameras[camera.id];

    if (camera.kill) {
      camera.kill();
    }

    return this;
  }

  /**
   * This methods will instantiate and reference a new renderer. The "type"
   * argument can be the constructor or its name in the "sigma.renderers"
   * package. If no type is specified, then "sigma.renderers.def" will be used.
   * If no id is specified, then an automatic id will be generated.
   *
   * @param  {?object}  options Eventually some options to give to the renderer
   *                            constructor.
   * @return {renderer}         The fresh new renderer instance.
   *
   * Recognized parameters:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the "options"
   * object:
   *
   *   {?string}            id     Eventually the renderer id.
   *   {?(function|string)} type   Eventually the renderer constructor or its
   *                               name in the "sigma.renderers" package.
   *   {?(camera|string)}   camera Eventually the renderer camera or its
   *                               id.
   */
  public addRenderer(options?: any) {
    let id;
    let fn;
    let o = options || {};

    // Polymorphism:
    if (typeof o === "string")
      o = {
        container: document.getElementById(o)
      };
    else if (o instanceof HTMLElement)
      o = {
        container: o
      };

    // If the container still is a string, we get it by id
    if (typeof o.container === "string") {
      o.container = document.getElementById(o.container);
    }

    // Reference the new renderer:
    if (!("id" in o)) {
      id = 0;
      while (this.renderers[`${id}`]) id++;
      id = `${id}`;
      // eslint-disable-next-line prefer-destructuring
    } else id = o.id;

    if (this.renderers[id])
      throw new Error(
        `sigma.addRenderer: The renderer "${id}" already exists.`
      );

    // Find the good constructor:
    fn = typeof o.type === "function" ? o.type : Sigma.renderers[o.type];
    fn = fn || Sigma.renderers.def;

    // Find the good camera:
    const findGoodCamera = () => {
      if ("camera" in o) {
        if (o.camera instanceof Sigma.classes.camera) {
          return o.camera;
        }
        return this.cameras[o.camera] || this.addCamera(o.camera);
      }
      return this.addCamera();
    };
    const camera = findGoodCamera();

    if (this.cameras[camera.id] !== camera)
      throw new Error(
        "sigma.addRenderer: The camera is not properly referenced."
      );

    // Instantiate:
    const renderer = new fn(this.graph, camera, this.settings, o);
    this.renderers[id] = renderer;
    Object.defineProperty(renderer, "id", {
      value: id
    });

    // Bind events:
    if (renderer.bind)
      renderer.bind(
        [
          "click",
          "rightClick",
          "clickStage",
          "doubleClickStage",
          "rightClickStage",
          "clickNode",
          "clickNodes",
          "clickEdge",
          "clickEdges",
          "doubleClickNode",
          "doubleClickNodes",
          "doubleClickEdge",
          "doubleClickEdges",
          "rightClickNode",
          "rightClickNodes",
          "rightClickEdge",
          "rightClickEdges",
          "overNode",
          "overNodes",
          "overEdge",
          "overEdges",
          "outNode",
          "outNodes",
          "outEdge",
          "outEdges",
          "downNode",
          "downNodes",
          "downEdge",
          "downEdges",
          "upNode",
          "upNodes",
          "upEdge",
          "upEdges"
        ],
        this._handler
      );

    // Reference the renderer by its camera:
    this.renderersPerCamera[camera.id].push(renderer);

    return renderer;
  }

  /**
   * This method kills a renderer.
   *
   * @param  {string|renderer} v The renderer to kill or its ID.
   * @return {Sigma}             Returns the instance.
   */
  public killRenderer(v: string | Renderer) {
    const renderer: Renderer = typeof v === "string" ? this.renderers[v] : v;
    if (!renderer) {
      throw new Error("sigma.killRenderer: The renderer is undefined.");
    }

    // Remove the renderer from attached cameras
    const cameraRenderers = this.renderersPerCamera[renderer.camera.id];
    const rendererIndex = cameraRenderers.indexOf(renderer);
    if (rendererIndex >= 0) {
      cameraRenderers.splice(rendererIndex, 1);
    }

    // Kill the Renderer
    if (renderer.kill) {
      renderer.kill();
    }

    // Remove the renderer from Sigma
    delete this.renderers[renderer.id];
    return this;
  }

  /**
   * This method calls the "render" method of each renderer, with the same
   * arguments than the "render" method, but will also check if the renderer
   * has a "process" method, and call it if it exists.
   *
   * It is useful for quadtrees or WebGL processing, for instance.
   *
   * @param  {?object}  options Eventually some options to give to the refresh
   *                            method.
   * @return {Sigma}            Returns the instance itself.
   *
   * Recognized parameters:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the "options"
   * object:
   *
   *   {?boolean} skipIndexation A flag specifying wether or not the refresh
   *                             function should reindex the graph in the
   *                             quadtrees or not (default: false).
   */
  public refresh(
    options: {
      skipIndexation?: boolean;
    } = {}
  ) {
    const middlewares = this.middlewares || [];
    let bounds;
    let prefix = 0;

    // Call each middleware:

    middlewares.forEach((mw, i) => {
      mw.call(
        this,
        i === 0 ? "" : `tmp${prefix}:`,
        i === middlewares.length - 1 ? "ready:" : `tmp${++prefix}:`
      );
    });

    // Then, for each camera, call the "rescale" middleware, unless the
    // settings specify not to:
    Object.keys(this.cameras).forEach(camId => {
      const cam = this.cameras[camId];
      if (
        cam.settings("autoRescale") &&
        this.renderersPerCamera[cam.id] &&
        this.renderersPerCamera[cam.id].length
      )
        Sigma.middlewares.rescale.call(
          this,
          middlewares.length ? "ready:" : "",
          cam.readPrefix,
          {
            width: this.renderersPerCamera[cam.id][0].width,
            height: this.renderersPerCamera[cam.id][0].height
          }
        );
      else
        Sigma.middlewares.copy.call(
          this,
          middlewares.length ? "ready:" : "",
          cam.readPrefix
        );

      if (!options.skipIndexation) {
        // Find graph boundaries:
        bounds = Sigma.utils.geom.getBoundaries(this.graph, cam.readPrefix);

        // Refresh quadtree:
        cam.quadtree!.index(this.graph.nodes(), {
          prefix: cam.readPrefix,
          bounds: {
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY
          }
        });

        // Refresh edgequadtree:
        if (
          cam.edgequadtree !== undefined &&
          cam.settings("drawEdges") &&
          cam.settings("enableEdgeHovering")
        ) {
          cam.edgequadtree.index(this.graph.edges(), {
            prefix: cam.readPrefix,
            bounds: {
              x: bounds.minX,
              y: bounds.minY,
              width: bounds.maxX - bounds.minX,
              height: bounds.maxY - bounds.minY
            }
          });
        }
      }
    });

    this._forEachRenderer("process");
    this.render();
    return this;
  }

  public _forEachRenderer(name: string) {
    Object.keys(this.renderers).forEach(key => {
      const renderer = this.renderers[key];
      if (renderer[name]) {
        if (this.settings("skipErrors")) {
          try {
            renderer[name]();
          } catch (e) {
            console.log(
              `Warning: The renderer "${key}" crashed on ".${name}()"`,
              e
            );
          }
        } else {
          renderer[name]();
        }
      }
    });
  }

  /**
   * This method calls the "render" method of each renderer.
   *
   * @return {Sigma} Returns the instance itself.
   */
  public render() {
    this._forEachRenderer("render");
    return this;
  }

  /**
   * This method calls the "render" method of each renderer that is bound to
   * the specified camera. To improve the performances, if this method is
   * called too often, the number of effective renderings is limitated to one
   * per frame, unless you are using the "force" flag.
   *
   * @param  {sigma.classes.camera} camera The camera to render.
   * @param  {?boolean}             force  If true, will render the camera
   *                                       directly.
   * @return {Sigma}                       Returns the instance itself.
   */
  public renderCamera(camera: Camera, force?: boolean) {
    let i;
    let l;
    let a;

    if (force) {
      a = this.renderersPerCamera[camera.id];
      for (i = 0, l = a.length; i < l; i++)
        if (this.settings("skipErrors"))
          try {
            a[i].render();
          } catch (e) {
            if (this.settings("verbose"))
              console.log(
                `Warning: The renderer "${a[i].id}" crashed on ".render()"`
              );
          }
        else a[i].render();
    } else if (!this.cameraFrames[camera.id]) {
      a = this.renderersPerCamera[camera.id];
      for (i = 0, l = a.length; i < l; i++)
        if (this.settings("skipErrors"))
          try {
            a[i].render();
          } catch (e) {
            if (this.settings("verbose"))
              console.log(
                `Warning: The renderer "${a[i].id}" crashed on ".render()"`
              );
          }
        else a[i].render();

      this.cameraFrames[camera.id] = requestAnimationFrame(() => {
        delete this.cameraFrames[camera.id];
      });
    }

    return this;
  }

  /**
   * This method calls the "kill" method of each module and destroys any
   * reference from the instance.
   */
  public kill() {
    // Dispatching event
    this.dispatchEvent("kill");

    // Kill graph:
    this.graph.kill();

    // Kill middlewares:
    delete this.middlewares;

    // Kill each renderer:
    Object.keys(this.renderers).forEach(key =>
      this.killRenderer(this.renderers[key])
    );

    // Kill each camera:
    Object.keys(this.cameras).forEach(key =>
      this.killCamera(this.cameras[key])
    );

    delete this.renderers;
    delete this.cameras;

    // Kill everything else:
    Object.keys(this).forEach(key => delete (this as any)[key]);

    delete __instances[this.id];
  }

  /**
   * Returns a clone of the instances object or a specific running instance.
   *
   * @param  {?string} id Eventually an instance ID.
   * @return {object}     The related instance or a clone of the instances
   *                      object.
   */
  public static instances(id?: string) {
    return arguments.length ? __instances[id!] : { ...__instances };
  }

  public static register(packageName: string, item: any, override?: boolean) {
    const parentPath = packageName.substring(0, packageName.lastIndexOf("."));
    const itemName = packageName.substring(packageName.lastIndexOf(".") + 1);
    const pkg = getPackageObject(parentPath);
    pkg[itemName] = override ? item : pkg[itemName] || item;
  }
}

function getPackageObject(pkgName: string) {
  const getPackage = (levels: string[], root: Keyed<any>) => {
    return levels.reduce((context, objName) => {
      if (!context[objName]) {
        context[objName] = {};
      }
      return context[objName];
    }, root);
  };
  const levels = (pkgName || "").split(".");
  if (levels[0] !== "sigma") {
    throw new Error(`package root must start with sigma.`);
  }
  return getPackage(levels.slice(1), Sigma);
}

export default Sigma;
