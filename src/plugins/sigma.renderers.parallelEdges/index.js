import edgeHoversCurve from "./src/canvasEdgeHoversCurve";
import edgeHoversCurvedArrow from "./src/canvasEdgeHoversCurvedArrow";
import edgesCurve from "./src/canvasEdgesCurve";
import edgesCurvedArrow from "./src/canvasEdgesCurvedArrow";
import edgesLabelsCurve from "./src/canvasEdgesLabels";
import { getQuadraticControlPoint, getSelfLoopConrolPoints } from "./src/utils";

export default function extend(sigma) {
  sigma.utils.geom.getQuadraticControlPoint = getQuadraticControlPoint;
  sigma.utils.geom.getSelfLoopConrolPoints = getSelfLoopConrolPoints;

  sigma.register("sigma.canvas.edgehovers.curve", edgeHoversCurve(sigma), true);
  sigma.register(
    "sigma.canvas.edgehovers.curvedArrow",
    edgeHoversCurvedArrow(sigma),
    true
  );
  sigma.register("sigma.canvas.edges.curve", edgesCurve(sigma), true);
  sigma.register(
    "sigma.canvas.edges.curvedArrow",
    edgesCurvedArrow(sigma),
    true
  );
  sigma.register(
    "sigma.canvas.edges.labels.curve",
    edgesLabelsCurve(sigma),
    true
  );
}
