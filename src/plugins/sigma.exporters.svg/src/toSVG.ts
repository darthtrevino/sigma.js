import optimize from "./optimize";
import download from "./download";
/**
 * Defaults
 */
const DEFAULTS = {
  size: "1000",
  width: "1000",
  height: "1000",
  classes: true,
  labels: true,
  data: false,
  download: false,
  filename: "graph.svg"
};

export default function toSVG(params) {
  params = params || {};
  const prefix = this.settings("classPrefix");
  const w = params.size || params.width || DEFAULTS.size;
  const h = params.size || params.height || DEFAULTS.size;

  // Creating a dummy container
  let container = document.createElement("div");
  container.setAttribute("width", w);
  container.setAttribute("height", h);
  container.setAttribute(
    "style",
    `position:absolute; top: 0px; left:0px; width: ${w}px; height: ${h}px;`
  );

  // Creating a camera
  const camera = this.addCamera();

  // Creating a svg renderer
  const renderer = this.addRenderer({
    camera,
    container,
    type: "svg",
    forceLabels: !!params.labels
  });

  // Refreshing
  renderer.resize(w, h);
  this.refresh();

  // Dropping camera and renderers before something nasty happens
  this.killRenderer(renderer);
  this.killCamera(camera);

  // Retrieving svg
  const svg = container.querySelector("svg");
  svg.removeAttribute("style");
  svg.setAttribute("width", `${w}px`);
  svg.setAttribute("height", `${h}px`);
  svg.setAttribute("x", "0px");
  svg.setAttribute("y", "0px");
  // svg.setAttribute('viewBox', '0 0 1000 1000');

  // Dropping labels
  if (!params.labels) {
    const labelGroup = svg.querySelector(`[id="${prefix}-group-labels"]`);
    svg.removeChild(labelGroup);
  }

  // Dropping hovers
  const hoverGroup = svg.querySelector(`[id="${prefix}-group-hovers"]`);
  svg.removeChild(hoverGroup);

  // Optims?
  params.classes = params.classes !== false;
  if (!params.data || params.classes) optimize(svg, prefix, params);

  // Retrieving svg string
  const svgString = svg.outerHTML;

  // Paranoid cleanup
  container = null;

  // Output string
  let output = '<?xml version="1.0" encoding="utf-8"?>\n';
  output +=
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
  output += svgString;

  if (params.download) download(output, params.filename || DEFAULTS.filename);

  return output;
}
