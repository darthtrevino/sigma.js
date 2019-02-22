/* eslint-disable no-loop-func, @typescript-eslint/camelcase */
export default function extend(sigma) {
  // Initialize package:
  sigma.utils.pkg("sigma.layout.noverlap");

  /**
   * Noverlap Layout
   * ===============================
   *
   * Author: @apitts / Andrew Pitts
   * Algorithm: @jacomyma / Mathieu Jacomy (originally contributed to Gephi and ported to sigma.js under the MIT license by @andpitts with permission)
   * Acknowledgement: @sheyman / Sébastien Heymann (some inspiration has been taken from other MIT licensed layout algorithms authored by @sheyman)
   * Version: 0.1
   */

  const settings = {
    speed: 3,
    scaleNodes: 1.2,
    nodeMargin: 5.0,
    gridSize: 20,
    permittedExpansion: 1.1,
    rendererIndex: 0,
    maxIterations: 500
  };

  const _instance = {};

  /**
   * Event emitter Object
   * ------------------
   */
  const _eventEmitter = {};

  /**
   * Noverlap Object
   * ------------------
   */
  function Noverlap() {
    const self = this;

    this.init = function init(sigInst, options) {
      options = options || {};

      // Properties
      this.sigInst = sigInst;
      this.config = { ...options, ...settings };
      this.easing = options.easing;
      this.duration = options.duration;

      if (options.nodes) {
        this.nodes = options.nodes;
        delete options.nodes;
      }

      if (!sigma.plugins || typeof sigma.plugins.animate === "undefined") {
        throw new Error("sigma.plugins.animate is not declared");
      }

      // State
      this.running = false;
    };

    /**
     * Single layout iteration.
     */
    this.atomicGo = function atomicGo() {
      if (!this.running || this.iterCount < 1) return false;
      const nodes = this.nodes || this.sigInst.graph.nodes();
      let xmin = Infinity;
      let xmax = -Infinity;
      let ymin = Infinity;
      let ymax = -Infinity;
      let row;
      let col;
      let minXBox;
      let maxXBox;
      let minYBox;
      let maxYBox;
      let subRow;
      let subCol;
      let nxmin;
      let nxmax;
      let nymin;
      let nymax;

      this.iterCount--;
      this.running = false;

      nodes.forEach(n => {
        n.dn.dx = 0;
        n.dn.dy = 0;

        // Find the min and max for both x and y across all nodes
        xmin = Math.min(
          xmin,
          n.dn_x - (n.dn_size * self.config.scaleNodes + self.config.nodeMargin)
        );
        xmax = Math.max(
          xmax,
          n.dn_x + (n.dn_size * self.config.scaleNodes + self.config.nodeMargin)
        );
        ymin = Math.min(
          ymin,
          n.dn_y - (n.dn_size * self.config.scaleNodes + self.config.nodeMargin)
        );
        ymax = Math.max(
          ymax,
          n.dn_y + (n.dn_size * self.config.scaleNodes + self.config.nodeMargin)
        );
      });

      const xwidth = xmax - xmin;
      const yheight = ymax - ymin;
      const xcenter = (xmin + xmax) / 2;
      const ycenter = (ymin + ymax) / 2;
      xmin = xcenter - (self.config.permittedExpansion * xwidth) / 2;
      xmax = xcenter + (self.config.permittedExpansion * xwidth) / 2;
      ymin = ycenter - (self.config.permittedExpansion * yheight) / 2;
      ymax = ycenter + (self.config.permittedExpansion * yheight) / 2;

      const grid = {}; // An object of objects where grid[row][col] is an array of node ids representing nodes that fall in that grid. Nodes can fall in more than one grid

      for (row = 0; row < self.config.gridSize; row++) {
        grid[row] = {};
        for (col = 0; col < self.config.gridSize; col++) {
          grid[row][col] = [];
        }
      }

      // Place nodes in grid
      nodes.forEach(n => {
        nxmin =
          n.dn_x -
          (n.dn_size * self.config.scaleNodes + self.config.nodeMargin);
        nxmax =
          n.dn_x +
          (n.dn_size * self.config.scaleNodes + self.config.nodeMargin);
        nymin =
          n.dn_y -
          (n.dn_size * self.config.scaleNodes + self.config.nodeMargin);
        nymax =
          n.dn_y +
          (n.dn_size * self.config.scaleNodes + self.config.nodeMargin);

        minXBox = Math.floor(
          (self.config.gridSize * (nxmin - xmin)) / (xmax - xmin)
        );
        maxXBox = Math.floor(
          (self.config.gridSize * (nxmax - xmin)) / (xmax - xmin)
        );
        minYBox = Math.floor(
          (self.config.gridSize * (nymin - ymin)) / (ymax - ymin)
        );
        maxYBox = Math.floor(
          (self.config.gridSize * (nymax - ymin)) / (ymax - ymin)
        );
        for (col = minXBox; col <= maxXBox; col++) {
          for (row = minYBox; row <= maxYBox; row++) {
            grid[row][col].push(n.id);
          }
        }
      });

      const adjacentNodes = {}; // An object that stores the node ids of adjacent nodes (either in same grid box or adjacent grid box) for all nodes
      for (row = 0; row < self.config.gridSize; row++) {
        for (col = 0; col < self.config.gridSize; col++) {
          grid[row][col].forEach(nodeId => {
            if (!adjacentNodes[nodeId]) {
              adjacentNodes[nodeId] = [];
            }
            for (
              subRow = Math.max(0, row - 1);
              subRow <= Math.min(row + 1, self.config.gridSize - 1);
              subRow++
            ) {
              for (
                subCol = Math.max(0, col - 1);
                subCol <= Math.min(col + 1, self.config.gridSize - 1);
                subCol++
              ) {
                grid[subRow][subCol].forEach(subNodeId => {
                  if (
                    subNodeId !== nodeId &&
                    adjacentNodes[nodeId].indexOf(subNodeId) === -1
                  ) {
                    adjacentNodes[nodeId].push(subNodeId);
                  }
                });
              }
            }
          });
        }
      }

      // If two nodes overlap then repulse them
      nodes.forEach(n1 => {
        adjacentNodes[n1.id].forEach(nodeId => {
          const n2 = self.sigInst.graph.nodes(nodeId);
          const xDist = n2.dn_x - n1.dn_x;
          const yDist = n2.dn_y - n1.dn_y;
          const dist = Math.sqrt(xDist * xDist + yDist * yDist);
          const collision =
            dist <
            n1.dn_size * self.config.scaleNodes +
              self.config.nodeMargin +
              (n2.dn_size * self.config.scaleNodes + self.config.nodeMargin);
          if (collision) {
            self.running = true;
            if (dist > 0) {
              n2.dn.dx += (xDist / dist) * (1 + n1.dn_size);
              n2.dn.dy += (yDist / dist) * (1 + n1.dn_size);
            } else {
              n2.dn.dx += xwidth * 0.01 * (0.5 - Math.random());
              n2.dn.dy += yheight * 0.01 * (0.5 - Math.random());
            }
          }
        });
      });

      nodes
        .filter(n => !n.fixed)
        .forEach(n => {
          n.dn_x += n.dn.dx * 0.1 * self.config.speed;
          n.dn_y += n.dn.dy * 0.1 * self.config.speed;
        });

      if (this.running && this.iterCount < 1) {
        this.running = false;
      }

      return this.running;
    };

    this.go = function go() {
      this.iterCount = this.config.maxIterations;

      while (this.running) {
        this.atomicGo();
      }

      this.stop();
    };

    this.start = function start() {
      if (this.running) return;

      const nodes = this.sigInst.graph.nodes();
      const { rendererIndex } = self.config;
      const { prefix } = this.sigInst.renderers[rendererIndex].options;

      this.running = true;

      // Init nodes
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].dn_x = nodes[i][`${prefix}x`];
        nodes[i].dn_y = nodes[i][`${prefix}y`];
        nodes[i].dn_size = nodes[i][`${prefix}size`];
        nodes[i].dn = {
          dx: 0,
          dy: 0
        };
      }
      _eventEmitter[self.sigInst.id].dispatchEvent("start");
      this.go();
    };

    this.stop = function stop() {
      const nodes = this.sigInst.graph.nodes();

      this.running = false;

      if (this.easing) {
        _eventEmitter[self.sigInst.id].dispatchEvent("interpolate");
        sigma.plugins.animate(
          self.sigInst,
          {
            x: "dn_x",
            y: "dn_y"
          },
          {
            easing: self.easing,
            onComplete() {
              self.sigInst.refresh();
              nodes.forEach(n => {
                n.dn = null;
                n.dn_x = null;
                n.dn_y = null;
              });
              _eventEmitter[self.sigInst.id].dispatchEvent("stop");
            },
            duration: self.duration
          }
        );
      } else {
        // Apply changes
        nodes.forEach(n => {
          n.x = n.dn_x;
          n.y = n.dn_y;
          n.dn = null;
          n.dn_x = null;
          n.dn_y = null;
        });
        this.sigInst.refresh();
        _eventEmitter[self.sigInst.id].dispatchEvent("stop");
      }
    };

    this.kill = function kill() {
      this.sigInst = null;
      this.config = null;
      this.easing = null;
    };
  }

  /**
   * Interface
   * ----------
   */

  /**
   * Configure the layout algorithm.

   * Recognized options:
   * **********************
   * Here is the exhaustive list of every accepted parameter in the settings
   * object:
   *
   *   {?number}            speed               A larger value increases the convergence speed at the cost of precision
   *   {?number}            scaleNodes          The ratio to scale nodes by - a larger ratio will lead to more space around larger nodes
   *   {?number}            nodeMargin          A fixed margin to apply around nodes regardless of size
   *   {?number}            maxIterations       The maximum number of iterations to perform before the layout completes.
   *   {?integer}           gridSize            The number of rows and columns to use when partioning nodes into a grid for efficient computation
   *   {?number}            permittedExpansion  A permitted expansion factor to the overall size of the network applied at each iteration
   *   {?integer}           rendererIndex       The index of the renderer to use for node co-ordinates. Defaults to zero.
   *   {?(function|string)} easing              Either the name of an easing in the sigma.utils.easings package or a function. If not specified, the
   *                                            quadraticInOut easing from this package will be used instead.
   *   {?number}            duration            The duration of the animation. If not specified, the "animationsTime" setting value of the sigma instance will be used instead.
   *
   *
   * @param  {object} config  The optional configuration object.
   *
   * @return {sigma.classes.dispatcher} Returns an event emitter.
   */
  sigma.prototype.configNoverlap = function configNoverlap(config) {
    const sigInst = this;

    if (!config) throw new Error('Missing argument: "config"');

    // Create instance if undefined
    if (!_instance[sigInst.id]) {
      _instance[sigInst.id] = new Noverlap();

      _eventEmitter[sigInst.id] = {};
      sigma.classes.dispatcher.extend(_eventEmitter[sigInst.id]);

      // Binding on kill to clear the references
      sigInst.bind("kill", function kill() {
        _instance[sigInst.id].kill();
        _instance[sigInst.id] = null;
        _eventEmitter[sigInst.id] = null;
      });
    }

    _instance[sigInst.id].init(sigInst, config);

    return _eventEmitter[sigInst.id];
  };

  /**
   * Start the layout algorithm. It will use the existing configuration if no
   * new configuration is passed.

   * Recognized options:
   * **********************
   * Here is the exhaustive list of every accepted parameter in the settings
   * object
   *
   *   {?number}            speed               A larger value increases the convergence speed at the cost of precision
   *   {?number}            scaleNodes          The ratio to scale nodes by - a larger ratio will lead to more space around larger nodes
   *   {?number}            nodeMargin          A fixed margin to apply around nodes regardless of size
   *   {?number}            maxIterations       The maximum number of iterations to perform before the layout completes.
   *   {?integer}           gridSize            The number of rows and columns to use when partioning nodes into a grid for efficient computation
   *   {?number}            permittedExpansion  A permitted expansion factor to the overall size of the network applied at each iteration
   *   {?integer}           rendererIndex       The index of the renderer to use for node co-ordinates. Defaults to zero.
   *   {?(function|string)} easing              Either the name of an easing in the sigma.utils.easings package or a function. If not specified, the
   *                                            quadraticInOut easing from this package will be used instead.
   *   {?number}            duration            The duration of the animation. If not specified, the "animationsTime" setting value of the sigma instance will be used instead.
   *
   *
   *
   * @param  {object} config  The optional configuration object.
   *
   * @return {sigma.classes.dispatcher} Returns an event emitter.
   */

  sigma.prototype.startNoverlap = function startNoverlap(config) {
    const sigInst = this;

    if (config) {
      this.configNoverlap(sigInst, config);
    }

    _instance[sigInst.id].start();

    return _eventEmitter[sigInst.id];
  };

  /**
   * Returns true if the layout has started and is not completed.
   *
   * @return {boolean}
   */
  sigma.prototype.isNoverlapRunning = function isNoverlapRunning() {
    const sigInst = this;
    return !!_instance[sigInst.id] && _instance[sigInst.id].running;
  };
}
