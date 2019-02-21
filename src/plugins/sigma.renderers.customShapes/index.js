import shapes from "./src/shapeLibrary";
import sigmaCanvasDrawer from "./src/sigmaCanvasDrawer";
import sigmaSvgDrawer from "./src/sigmaSvgDrawer";

export default function extend(sigma) {
  let sigInst;
  const imgCache = {};

  function drawImage(node, x, y, size, context) {
    if (sigInst && node.image && node.image.url) {
      const { url } = node.image;
      const ih = node.image.h || 1; // 1 is arbitrary, anyway only the ratio counts
      const iw = node.image.w || 1;
      const scale = node.image.scale || 1;
      const clip = node.image.clip || 1;

      // create new IMG or get from imgCache
      let image = imgCache[url];
      if (!image) {
        image = document.createElement("IMG");
        image.src = url;
        image.status = "loading";
        image.onerror = () => {
          console.log("error loading", url);
          image.status = "error";
        };
        image.onload = () => {
          // TODO see how we redraw on load
          // need to provide the siginst as a parameter to the library
          console.log("redraw on image load", url);
          image.status = "ok";
          sigInst.refresh();
        };
        imgCache[url] = image;
      }

      // calculate position and draw
      const xratio = iw < ih ? iw / ih : 1;
      const yratio = ih < iw ? ih / iw : 1;
      const r = size * scale;

      // Draw the clipping disc:
      context.save(); // enter clipping mode
      context.beginPath();
      context.arc(x, y, size * clip, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();

      if (image.status === "ok") {
        // Draw the actual image
        context.drawImage(
          image,
          x + Math.sin(-3.142 / 4) * r * xratio,
          y - Math.cos(-3.142 / 4) * r * yratio,
          r * xratio * 2 * Math.sin(-3.142 / 4) * -1,
          r * yratio * 2 * Math.cos(-3.142 / 4)
        );
      }
      context.restore(); // exit clipping mode
    }
  }

  function drawSVGImage(node, group, settings) {
    if (sigInst && node.image && node.image.url) {
      const clipCircle = document.createElementNS(settings("xmlns"), "circle");
      const clipPath = document.createElementNS(settings("xmlns"), "clipPath");
      const clipPathId = `${settings("classPrefix")}-clip-path-${node.id}`;
      const def = document.createElementNS(settings("xmlns"), "defs");
      const image = document.createElementNS(settings("xmlns"), "image");

      clipPath.setAttributeNS(null, "id", clipPathId);
      clipPath.appendChild(clipCircle);
      def.appendChild(clipPath);

      // angular's base tag will change the relative fragment id, so
      // #<clipPathId> doesn't work
      // HACKHACK: IE <=9 does not respect the HTML base element in SVG.
      // They don't need the current URL in the clip path reference.
      let absolutePath = /MSIE [5-9]/.test(navigator.userAgent)
        ? ""
        : document.location.href;
      // To fix cases where an anchor tag was used
      [absolutePath] = absolutePath.split("#");
      image.setAttributeNS(
        null,
        "class",
        `${settings("classPrefix")}-node-image`
      );
      image.setAttributeNS(
        null,
        "clip-path",
        `url(${absolutePath}#${clipPathId})`
      );
      image.setAttributeNS(null, "pointer-events", "none");
      image.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        node.image.url
      );
      group.appendChild(def);
      group.appendChild(image);
    }
  }

  function register(name, drawShape, drawBorder) {
    sigma.register(
      `sigma.canvas.nodes.${name}`,
      sigmaCanvasDrawer(drawShape, drawBorder, drawImage)
    );
    sigma.register(`sigma.svg.nodes.${name}`, sigmaSvgDrawer(drawSVGImage));
  }

  sigma.register("sigma.customShapes.init", function init() {
    sigInst = this;
  });
  sigma.register("sigma.customShapes.shapeLibrary", shapes);

  shapes
    .enumerate()
    .forEach(shape => register(shape.name, shape.drawShape, shape.drawBorder));
}
