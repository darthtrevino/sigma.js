/* eslint-disable no-eval */
export default function extend(sigma, global = window) {
  /**
   * Sigma ForceAtlas2.5 Supervisor
   * ===============================
   *
   * Author: Guillaume Plique (Yomguithereal)
   * Version: 0.1
   */

  /**
   * Feature detection
   * ------------------
   */
  const webWorkers = "Worker" in global;

  /**
   * Supervisor Object
   * ------------------
   */
  function Supervisor(sigInst, options) {
    const _this = this;

    const workerFn =
      sigInst.getForceAtlas2Worker && sigInst.getForceAtlas2Worker();

    options = options || {};

    // global URL Polyfill
    global.URL = global.URL || global.webkitURL;

    // Properties
    this.sigInst = sigInst;
    this.graph = this.sigInst.graph;
    this.ppn = 10;
    this.ppe = 3;
    this.config = {};
    this.shouldUseWorker =
      options.worker === false ? false : true && webWorkers;
    this.workerUrl = options.workerUrl;

    // State
    this.started = false;
    this.running = false;

    // Web worker or classic DOM events?
    if (this.shouldUseWorker) {
      if (!this.workerUrl) {
        const blob = this.makeBlob(workerFn);
        this.worker = new Worker(URL.createObjectURL(blob));
      } else {
        this.worker = new Worker(this.workerUrl);
      }

      // Post Message Polyfill
      this.worker.postMessage =
        this.worker.webkitPostMessage || this.worker.postMessage;
    } else {
      eval(workerFn);
    }

    // Worker message receiver
    this.msgName = this.worker ? "message" : "newCoords";
    this.listener = function listener(e) {
      // Retrieving data
      _this.nodesByteArray = new Float32Array(e.data.nodes);

      // If ForceAtlas2 is running, we act accordingly
      if (_this.running) {
        // Applying layout
        _this.applyLayoutChanges();

        // Send data back to worker and loop
        _this.sendByteArrayToWorker();

        // Rendering graph
        _this.sigInst.refresh();
      }
    };

    (this.worker || document).addEventListener(this.msgName, this.listener);

    // Filling byteArrays
    this.graphToByteArrays();

    // Binding on kill to properly terminate layout when parent is killed
    sigInst.bind("kill", function kill() {
      sigInst.killForceAtlas2();
    });
  }

  Supervisor.prototype.makeBlob = function makeBlob(workerFn) {
    let blob;

    try {
      blob = new Blob([workerFn], { type: "application/javascript" });
    } catch (e) {
      const BlobBuilder =
        global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder;

      blob = new BlobBuilder();
      blob.append(workerFn);
      blob = blob.getBlob();
    }

    return blob;
  };

  Supervisor.prototype.graphToByteArrays = function graphToByteArrays() {
    const nodes = this.graph.nodes();
    const edges = this.graph.edges();
    const nbytes = nodes.length * this.ppn;
    const ebytes = edges.length * this.ppe;
    const nIndex = {};
    let i;
    let j;
    let l;

    // Allocating Byte arrays with correct nb of bytes
    this.nodesByteArray = new Float32Array(nbytes);
    this.edgesByteArray = new Float32Array(ebytes);

    // Iterate through nodes
    for (i = j = 0, l = nodes.length; i < l; i++) {
      // Populating index
      nIndex[nodes[i].id] = j;

      // Populating byte array
      this.nodesByteArray[j] = nodes[i].x;
      this.nodesByteArray[j + 1] = nodes[i].y;
      this.nodesByteArray[j + 2] = 0;
      this.nodesByteArray[j + 3] = 0;
      this.nodesByteArray[j + 4] = 0;
      this.nodesByteArray[j + 5] = 0;
      this.nodesByteArray[j + 6] = 1 + this.graph.degree(nodes[i].id);
      this.nodesByteArray[j + 7] = 1;
      this.nodesByteArray[j + 8] = nodes[i].size;
      this.nodesByteArray[j + 9] = 0;
      j += this.ppn;
    }

    // Iterate through edges
    for (i = j = 0, l = edges.length; i < l; i++) {
      this.edgesByteArray[j] = nIndex[edges[i].source];
      this.edgesByteArray[j + 1] = nIndex[edges[i].target];
      this.edgesByteArray[j + 2] = edges[i].weight || 0;
      j += this.ppe;
    }
  };

  // TODO: make a better send function
  Supervisor.prototype.applyLayoutChanges = function applyLayoutChanges() {
    const nodes = this.graph.nodes();
    let j = 0;

    // Moving nodes
    for (let i = 0, l = this.nodesByteArray.length; i < l; i += this.ppn) {
      nodes[j].x = this.nodesByteArray[i];
      nodes[j].y = this.nodesByteArray[i + 1];
      j++;
    }
  };

  Supervisor.prototype.sendByteArrayToWorker = function sendByteArrayToWorker(
    action
  ) {
    const content = {
      action: action || "loop",
      nodes: this.nodesByteArray.buffer
    };

    const buffers = [this.nodesByteArray.buffer];

    if (action === "start") {
      content.config = this.config || {};
      content.edges = this.edgesByteArray.buffer;
      buffers.push(this.edgesByteArray.buffer);
    }

    if (this.shouldUseWorker) this.worker.postMessage(content, buffers);
    else global.postMessage(content, "*");
  };

  Supervisor.prototype.start = function start() {
    if (this.running) return;

    this.running = true;

    // Do not refresh edgequadtree during layout:
    Object.keys(this.sigInst.camera).forEach(k => {
      const camera = this.sigInst.cameras[k];
      camera.edgequadtree._enabled = false;
    });

    if (!this.started) {
      // Sending init message to worker
      this.sendByteArrayToWorker("start");
      this.started = true;
    } else {
      this.sendByteArrayToWorker();
    }
  };

  Supervisor.prototype.stop = function stop() {
    if (!this.running) return;

    // Allow to refresh edgequadtree:
    let bounds;
    Object.keys(this.sigInst.camera).forEach(k => {
      const camera = this.sigInst.cameras[k];
      camera.edgequadtree._enabled = true;

      // Find graph boundaries:
      bounds = sigma.utils.geom.getBoundaries(this.graph, camera.readPrefix);

      // Refresh edgequadtree:
      if (camera.settings("drawEdges") && camera.settings("enableEdgeHovering"))
        camera.edgequadtree.index(this.sigInst.graph, {
          prefix: camera.readPrefix,
          bounds: {
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY
          }
        });
    });

    this.running = false;
  };

  Supervisor.prototype.killWorker = function killWorker() {
    if (this.worker) {
      this.worker.terminate();
    } else {
      global.postMessage({ action: "kill" }, "*");
      document.removeEventListener(this.msgName, this.listener);
    }
  };

  Supervisor.prototype.configure = function configure(config) {
    // Setting configuration
    this.config = config;
    if (!this.started) return;
    const data = { action: "config", config: this.config };
    if (this.shouldUseWorker) this.worker.postMessage(data);
    else global.postMessage(data, "*");
  };

  /**
   * Interface
   * ----------
   */
  sigma.prototype.startForceAtlas2 = function startForceAtlas2(config) {
    // Create supervisor if undefined
    if (!this.supervisor) this.supervisor = new Supervisor(this, config);

    // Configuration provided?
    if (config) this.supervisor.configure(config);

    // Start algorithm
    this.supervisor.start();

    return this;
  };

  sigma.prototype.stopForceAtlas2 = function stopForceAtlas2() {
    if (!this.supervisor) return this;

    // Pause algorithm
    this.supervisor.stop();

    return this;
  };

  sigma.prototype.killForceAtlas2 = function killForceAtlas2() {
    if (!this.supervisor) return this;

    // Stop Algorithm
    this.supervisor.stop();

    // Kill Worker
    this.supervisor.killWorker();

    // Kill supervisor
    this.supervisor = null;

    return this;
  };

  sigma.prototype.configForceAtlas2 = function configForceAtlas2(config) {
    if (!this.supervisor) this.supervisor = new Supervisor(this, config);

    this.supervisor.configure(config);

    return this;
  };

  sigma.prototype.isForceAtlas2Running = function isForceAtlas2Running() {
    return !!this.supervisor && this.supervisor.running;
  };
}
