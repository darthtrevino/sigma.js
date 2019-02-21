import edgeHoversCurve from "./src/canvasEdgeHoversCurve";
import edgeHoversCurvedArrow from "./src/canvasEdgeHoversCurvedArrow";
import edgesCurve from "./src/canvasEdgesCurve";
import edgesCurvedArrow from "./src/canvasEdgesCurvedArrow";
import edgesLabelsCurve from "./src/canvasEdgesLabels";

export default function extend(sigma) {
  sigma.register("sigma.canvas.edgehovers.curve", edgeHoversCurve(sigma));
  sigma.register(
    "sigma.canvas.edgehovers.curvedArrow",
    edgeHoversCurvedArrow(sigma)
  );
  sigma.register("sigma.canvas.edges.curve", edgesCurve(sigma));
  sigma.register("sigma.canvas.edges.curvedArrow", edgesCurvedArrow(sigma));
  sigma.register("sigma.canvas.edges.labels.curve", edgesLabelsCurve(sigma));
}
