import settings from "./src/settings";
import canvasEdgesLabelsCurve from "./src/edgeLabelsCurve";
import canvasEdgesLabelsCurvedArrow from "./src/edgeLabelsCurvedArrow";
import canvasEdgesLabelsDef from "./src/edgeLabelsDef";

export default function extend(sigma) {
  settings(sigma);

  sigma.register(
    "sigma.canvas.edges.labels.curve",
    canvasEdgesLabelsCurve(sigma)
  );
  sigma.register(
    "sigma.canvas.edges.labels.curvedArrow",
    canvasEdgesLabelsCurvedArrow(sigma)
  );
  sigma.register("sigma.canvas.edges.labels.def", canvasEdgesLabelsDef);
}
