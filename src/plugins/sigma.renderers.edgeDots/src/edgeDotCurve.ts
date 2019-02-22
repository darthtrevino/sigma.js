import { createDot } from "./utils";
/**
 * This edge renderer will display edges as curves.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default sigma =>
  function edgesDotCurve(edge, source, target, context, settings) {
    let { color } = edge;
    const prefix = settings("prefix") || "";
    const size = edge[`${prefix}size`] || 1;
    const edgeColor = settings("edgeColor");
    const defaultNodeColor = settings("defaultNodeColor");
    const defaultEdgeColor = settings("defaultEdgeColor");
    const sSize = source[`${prefix}size`];
    const sX = source[`${prefix}x`];
    const sY = source[`${prefix}y`];
    const tX = target[`${prefix}x`];
    const tY = target[`${prefix}y`];
    const cp =
      source.id === target.id
        ? sigma.utils.getSelfLoopControlPoints(sX, sY, sSize)
        : sigma.utils.geom.getQuadraticControlPoint(sX, sY, tX, tY);

    if (!color)
      switch (edgeColor) {
        case "source":
          color = source.color || defaultNodeColor;
          break;
        case "target":
          color = target.color || defaultNodeColor;
          break;
        default:
          color = defaultEdgeColor;
          break;
      }

    context.strokeStyle = color;
    context.lineWidth = size;
    context.beginPath();
    context.moveTo(sX, sY);
    if (source.id === target.id) {
      context.bezierCurveTo(cp.x1, cp.y1, cp.x2, cp.y2, tX, tY);
    } else {
      context.quadraticCurveTo(cp.x, cp.y, tX, tY);
    }
    context.stroke();
    if (
      edge.sourceDotColor !== undefined ||
      edge.targetDotColor !== undefined
    ) {
      let dotOffset = edge.dotOffset || 3;
      const dotSize = (edge.dotSize || 1) * size;
      dotOffset *= sSize;
      if (edge.sourceDotColor !== undefined) {
        createDot(
          context,
          sX,
          sY,
          cp,
          tX,
          tY,
          dotOffset,
          dotSize,
          edge.sourceDotColor
        );
      }
      if (edge.targetDotColor !== undefined) {
        createDot(
          context,
          tX,
          tY,
          cp,
          sX,
          sY,
          dotOffset,
          dotSize,
          edge.targetDotColor
        );
      }
    }
  };
