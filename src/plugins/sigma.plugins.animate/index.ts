/**
 * This plugin provides a method to animate a sigma instance by interpolating
 * some node properties. Check the sigma.plugins.animate function doc or the
 * examples/animate.html code sample to know more.
 */
export default function extend(sigma) {
  sigma.utils.pkg("sigma.plugins");

  let _id = 0;

  const _cache = {};

  // TOOLING FUNCTIONS:
  // ******************
  function parseColor(val) {
    if (_cache[val]) return _cache[val];

    let result = [0, 0, 0];

    if (val.match(/^#/)) {
      val = (val || "").replace(/^#/, "");
      result =
        val.length === 3
          ? [
              parseInt(val.charAt(0) + val.charAt(0), 16),
              parseInt(val.charAt(1) + val.charAt(1), 16),
              parseInt(val.charAt(2) + val.charAt(2), 16)
            ]
          : [
              parseInt(val.charAt(0) + val.charAt(1), 16),
              parseInt(val.charAt(2) + val.charAt(3), 16),
              parseInt(val.charAt(4) + val.charAt(5), 16)
            ];
    } else if (val.match(/^ *rgba? *\(/)) {
      val = val.match(
        /^ *rgba? *\( *([0-9]*) *, *([0-9]*) *, *([0-9]*) *(,.*)?\) *$/
      );
      result = [+val[1], +val[2], +val[3]];
    }

    _cache[val] = {
      r: result[0],
      g: result[1],
      b: result[2]
    };

    return _cache[val];
  }

  function interpolateColors(c1, c2, p) {
    c1 = parseColor(c1);
    c2 = parseColor(c2);

    const c = {
      r: c1.r * (1 - p) + c2.r * p,
      g: c1.g * (1 - p) + c2.g * p,
      b: c1.b * (1 - p) + c2.b * p
    };

    return `rgb(${[c.r | 0, c.g | 0, c.b | 0].join(",")})`;
  }

  function getEasing(options) {
    const { easings } = sigma.utils;
    switch (typeof options.easing) {
      case "string":
        return easings[options.easing];
      case "function": {
        // eslint-disable-next-line prefer-destructuring
        return options.easing;
      }
      default:
        return easings.quadraticInOut;
    }
  }

  /**
   * This function will animate some specified node properties. It will
   * basically call requestAnimationFrame, interpolate the values and call the
   * refresh method during a specified duration.
   *
   * Recognized parameters:
   * **********************
   * Here is the exhaustive list of every accepted parameters in the settings
   * object:
   *
   *   {?array}             nodes      An array of node objects or node ids. If
   *                                   not specified, all nodes of the graph
   *                                   will be animated.
   *   {?(function|string)} easing     Either the name of an easing in the
   *                                   sigma.utils.easings package or a
   *                                   function. If not specified, the
   *                                   quadraticInOut easing from this package
   *                                   will be used instead.
   *   {?number}            duration   The duration of the animation. If not
   *                                   specified, the "animationsTime" setting
   *                                   value of the sigma instance will be used
   *                                   instead.
   *   {?function}          onComplete Eventually a function to call when the
   *                                   animation is ended.
   *
   * @param  {sigma}   s       The related sigma instance.
   * @param  {object}  animate An hash with the keys being the node properties
   *                           to interpolate, and the values being the related
   *                           target values.
   * @param  {?object} options Eventually an object with options.
   */
  sigma.plugins.animate = function animateFn(s, animate, options) {
    const o = options || {};
    const id = ++_id;
    const duration = o.duration || s.settings("animationsTime");
    const easing = getEasing(o);
    const start = sigma.utils.dateNow();
    let nodes;
    if (o.nodes && o.nodes.length) {
      // eslint-disable-next-line prefer-destructuring
      if (typeof o.nodes[0] === "object") nodes = o.nodes;
      else nodes = s.graph.nodes(o.nodes); // argument is an array of IDs
    } else nodes = s.graph.nodes();

    // Store initial positions:
    const startPositions = nodes.reduce((res, node) => {
      res[node.id] = {};
      Object.keys(animate).forEach(k => {
        if (k in node) res[node.id][k] = node[k];
      });
      return res;
    }, {});

    s.animations = s.animations || Object.create({});
    sigma.plugins.kill(s);

    // Do not refresh edgequadtree during drag:
    Object.keys(s.cameras).forEach(k => {
      const c = s.cameras[k];
      c.edgequadtree._enabled = false;
    });

    function step() {
      let p = (sigma.utils.dateNow() - start) / duration;

      if (p >= 1) {
        nodes.forEach(node => {
          Object.keys(animate).forEach(k => {
            if (k in animate) node[k] = node[animate[k]];
          });
        });

        // Allow to refresh edgequadtree:
        Object.keys(s.cameras).forEach(k => {
          const c = s.cameras[k];
          c.edgequadtree._enabled = true;
        });

        s.refresh();
        if (typeof o.onComplete === "function") o.onComplete();
      } else {
        p = easing(p);
        nodes.forEach(node => {
          Object.keys(animate).forEach(k => {
            if (k in animate) {
              if (k.match(/color$/))
                node[k] = interpolateColors(
                  startPositions[node.id][k],
                  node[animate[k]],
                  p
                );
              else
                node[k] =
                  node[animate[k]] * p + startPositions[node.id][k] * (1 - p);
            }
          });
        });

        s.refresh();
        s.animations[id] = requestAnimationFrame(step);
      }
    }

    step();
  };

  sigma.plugins.kill = function kill(s) {
    Object.keys(s.animations).forEach(k => {
      cancelAnimationFrame(s.animations[k]);
    });

    // Allow to refresh edgequadtree:
    let c;
    Object.keys(s.cameras).forEach(k => {
      c = s.cameras[k];
      c.edgequadtree._enabled = true;
    });
  };
}
