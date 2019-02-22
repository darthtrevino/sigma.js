import canvasEdgesDotCurve from "./src/edgeDotCurve";
import canvasEdgesDotCurveArrow from "./src/edgeDotCurveArrow";

export default function extend(sigma) {
  sigma.register("sigma.canvas.edges.useDotCurves", () => {
    sigma.register(
      "sigma.canvas.edges.curve",
      sigma.canvas.edges.dotCurve,
      true
    );
    sigma.register(
      "sigma.canvas.edges.curvedArrow",
      sigma.canvas.edges.dotCurvedArrow,
      true
    );
  });
  sigma.register("sigma.canvas.edges.dotCurve", canvasEdgesDotCurve(sigma));
  sigma.register(
    "sigma.canvas.edges.dotCurvedArrow",
    canvasEdgesDotCurveArrow(sigma)
  );
}
