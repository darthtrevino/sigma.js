import { SigmaLibrary } from "../interfaces";
import Camera, { CameraLocation } from "../domain/classes/Camera";

export default function configure(sigma: SigmaLibrary) {
  /**
   * Generates a unique ID for the animation.
   *
   * @return {string} Returns the new ID.
   */
  const _getID = (function getId() {
    let id = 0;
    return function next(): number {
      return ++id;
    };
  })();

  function animationCamera(camera: Camera, val: CameraLocation, options?: any) {
    if (
      !(camera instanceof sigma.classes.camera) ||
      typeof val !== "object" ||
      !val
    )
      throw new Error("animation.camera: Wrong arguments.");

    if (
      typeof val.x !== "number" &&
      typeof val.y !== "number" &&
      typeof val.ratio !== "number" &&
      typeof val.angle !== "number"
    )
      throw new Error(
        "There must be at least one valid coordinate in the given val."
      );

    let id: number;
    let anim;
    const o = options || {};
    const start = sigma.utils.dateNow();

    // Store initial values:
    const initialVal = {
      x: camera.x,
      y: camera.y,
      ratio: camera.ratio,
      angle: camera.angle
    };

    const easing =
      typeof o.easing !== "function"
        ? sigma.utils.easings[o.easing || "quadraticInOut"]
        : o.easing;

    function tick() {
      let coef;

      const t = o.duration ? (sigma.utils.dateNow() - start) / o.duration : 1;

      // If the animation is over:
      if (t >= 1) {
        camera.isAnimated = false;
        camera.goTo({
          x: val.x !== undefined ? val.x : initialVal.x,
          y: val.y !== undefined ? val.y : initialVal.y,
          ratio: val.ratio !== undefined ? val.ratio : initialVal.ratio,
          angle: val.angle !== undefined ? val.angle : initialVal.angle
        });

        cancelAnimationFrame(id);
        delete sigma.misc.animation.running[id];

        // Check callbacks:
        if (typeof o.onComplete === "function") o.onComplete();

        // Else, let's keep going:
      } else {
        coef = easing(t);
        camera.isAnimated = true;
        camera.goTo({
          x:
            val.x !== undefined
              ? initialVal.x + (val.x - initialVal.x) * coef
              : initialVal.x,
          y:
            val.y !== undefined
              ? initialVal.y + (val.y - initialVal.y) * coef
              : initialVal.y,
          ratio:
            val.ratio !== undefined
              ? initialVal.ratio + (val.ratio - initialVal.ratio) * coef
              : initialVal.ratio,
          angle:
            val.angle !== undefined
              ? initialVal.angle + (val.angle - initialVal.angle) * coef
              : initialVal.angle
        });

        // Check callbacks:
        if (typeof o.onNewFrame === "function") o.onNewFrame();

        anim.frameId = requestAnimationFrame(tick);
      }
    }

    id = _getID();
    anim = {
      frameId: requestAnimationFrame(tick),
      target: camera,
      type: "camera",
      options: o,
      fn: tick
    };
    sigma.misc.animation.running[id] = anim;

    return id;
  }

  function kill(id: number) {
    if (arguments.length !== 1 || typeof id !== "number")
      throw new Error("animation.kill: Wrong arguments.");

    const o = sigma.misc.animation.running[id];

    if (o) {
      cancelAnimationFrame(id);
      delete sigma.misc.animation.running[o.frameId];

      if (o.type === "camera") o.target.isAnimated = false;

      // Check callbacks:
      if (typeof (o.options || {}).onComplete === "function")
        o.options.onComplete();
    }

    return this;
  }

  function killAll(filter?: string | object) {
    let o;
    let count = 0;
    const type = typeof filter === "string" ? filter : null;
    const target = typeof filter === "object" ? filter : null;
    const { running } = sigma.misc.animation;
    Object.keys(running).forEach(id => {
      if (
        (!type || running[id].type === type) &&
        (!target || running[id].target === target)
      ) {
        o = sigma.misc.animation.running[id];
        cancelAnimationFrame(o.frameId);
        delete sigma.misc.animation.running[id];

        if (o.type === "camera") o.target.isAnimated = false;

        // Increment counter:
        count++;

        // Check callbacks:
        if (typeof (o.options || {}).onComplete === "function")
          o.options.onComplete();
      }
    });

    return count;
  }

  function has(filter: string | object) {
    const type = typeof filter === "string" ? filter : null;
    const target = typeof filter === "object" ? filter : null;
    const { running } = sigma.misc.animation;

    return Object.keys(running).some(id => {
      return (
        (!type || running[id].type === type) &&
        (!target || running[id].target === target)
      );
    });
  }

  sigma.register("sigma.misc.animation.running", Object.create(null));
  sigma.register("sigma.misc.animation.kill", kill);
  sigma.register("sigma.misc.animation.killAll", killAll);
  sigma.register("sigma.misc.animation.has", has);
  sigma.register("sigma.misc.animation.camera", animationCamera);
}
