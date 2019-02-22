import canvasEdgeHoversDashed from "./src/canvasEdgeHoversDashed";
import canvasEdgeHoversDotted from "./src/canvasEdgeHoversDotted";
import canvasEdgeHoversParallel from "./src/canvasEdgeHoversParallel";
import canvasEdgeHoversTapered from "./src/canvasEdgeHoversTapered";
import canvasEdgesDashed from "./src/canvasEdgesDashed";
import canvasEdgesDotted from "./src/canvasEdgesDotted";
import canvasEdgesParallel from "./src/canvasEdgesParallel";
import canvasEdgesTapered from "./src/sigmaCanvasEdgesTapered";

export default function extend(sigma) {
  sigma.register("sigma.canvas.edgehovers.dashed", canvasEdgeHoversDashed);
  sigma.register("sigma.canvas.edgehovers.dotted", canvasEdgeHoversDotted);
  sigma.register(
    "sigma.canvas.edgehovers.parallel",
    canvasEdgeHoversParallel(sigma)
  );
  sigma.register(
    "sigma.canvas.edgehovers.tapered",
    canvasEdgeHoversTapered(sigma)
  );
  sigma.register("sigma.canvas.edges.dashed", canvasEdgesDashed);
  sigma.register("sigma.canvas.edges.dotted", canvasEdgesDotted);
  sigma.register("sigma.canvas.edges.parallel", canvasEdgesParallel(sigma));
  sigma.register("sigma.canvas.edges.tapered", canvasEdgesTapered(sigma));
}
