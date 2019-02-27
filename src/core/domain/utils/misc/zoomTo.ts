import Camera from "../../classes/Camera";

export default function zoomTo(sigma) {
  return (
    camera: Camera,
    x: number,
    y: number,
    ratio: number,
    animation: any // TODO: animation type
  ) => {
    const { settings } = camera;

    // Create the newRatio dealing with min / max:
    const newRatio = Math.max(
      settings("zoomMin"),
      Math.min(settings("zoomMax"), camera.ratio * ratio)
    );

    // Check that the new ratio is different from the initial one:
    if (newRatio !== camera.ratio) {
      // Create the coordinates variable:
      ratio = newRatio / camera.ratio;
      const coordinates = {
        x: x * (1 - ratio) + camera.x,
        y: y * (1 - ratio) + camera.y,
        ratio: newRatio
      };

      if (animation && animation.duration) {
        // Complete the animation setings:
        const count = sigma.misc.animation.killAll(camera);
        animation = {
          ...animation,
          easing: count ? "quadraticOut" : "quadraticInOut"
        };

        sigma.misc.animation.camera(camera, coordinates, animation);
      } else {
        camera.goTo(coordinates);
        if (animation && animation.onComplete) animation.onComplete();
      }
    }
  };
}
