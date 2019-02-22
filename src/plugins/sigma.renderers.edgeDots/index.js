import canvasEdgesDotCurve from "./src/edgeDotCurve";
import canvasEdgesDotCurveArrow from "./src/edgeDotCurveArrow";

export default function extend(sigma) {
  sigma.register("sigma.canvas.edges.useDotCurves", () => {
    sigma.canvas.edges.curve = sigma.canvas.edges.dotCurve;
    sigma.canvas.edges.curvedArrow = sigma.canvas.edges.dotCurvedArrow;
  });
  sigma.register("sigma.canvas.edges.dotCurve", canvasEdgesDotCurve(sigma));
  sigma.register(
    "sigma.canvas.edges.dotCurvedArrow",
    canvasEdgesDotCurveArrow(sigma)
  );
}
