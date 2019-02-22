const XMLNS = "http://www.w3.org/2000/svg";

/**
 * Subprocesses
 */
export default function optimize(svg, prefix, params) {
  const nodeColorIndex = {};
  const edgeColorIndex = {};
  let count = 0;
  let color;
  let style;
  let styleText = "";
  let f;
  let i;
  let l;

  // Creating style tag if needed
  if (params.classes) {
    style = document.createElementNS(XMLNS, "style");
    style.setAttribute("type", "text/css");
    svg.insertBefore(style, svg.firstChild);
  }

  // Iterating over nodes
  const nodes = svg.querySelectorAll(
    `[id="${prefix}-group-nodes"] > [class="${prefix}-node"]`
  );

  for (i = 0, l = nodes.length, f = true; i < l; i++) {
    color = nodes[i].getAttribute("fill");

    if (!params.data) nodes[i].removeAttribute("data-node-id");

    if (params.classes) {
      if (!(color in nodeColorIndex)) {
        nodeColorIndex[color] = f ? `${prefix}-node` : `c-${count++}`;
        styleText += `.${nodeColorIndex[color]}{fill: ${color}}`;
      }

      if (nodeColorIndex[color] !== `${prefix}-node`)
        nodes[i].setAttribute(
          "class",
          `${nodes[i].getAttribute("class")} ${nodeColorIndex[color]}`
        );
      nodes[i].removeAttribute("fill");
    }

    f = false;
  }

  // Iterating over edges
  const edges = svg.querySelectorAll(
    `[id="${prefix}-group-edges"] > [class="${prefix}-edge"]`
  );

  for (i = 0, l = edges.length, f = true; i < l; i++) {
    color = edges[i].getAttribute("stroke");

    if (!params.data) edges[i].removeAttribute("data-edge-id");

    if (params.classes) {
      if (!(color in edgeColorIndex)) {
        edgeColorIndex[color] = f ? `${prefix}-edge` : `c-${count++}`;
        styleText += `.${edgeColorIndex[color]}{stroke: ${color}}`;
      }

      if (edgeColorIndex[color] !== `${prefix}-edge`)
        edges[i].setAttribute(
          "class",
          `${edges[i].getAttribute("class")} ${edgeColorIndex[color]}`
        );
      edges[i].removeAttribute("stroke");
    }

    f = false;
  }

  if (params.classes) style.appendChild(document.createTextNode(styleText));
}
