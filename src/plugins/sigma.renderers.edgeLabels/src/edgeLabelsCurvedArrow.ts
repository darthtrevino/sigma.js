/**
 * This label renderer will just display the label on the curve of the edge.
 * The label is rendered at half distance of the edge extremities, and is
 * always oriented from left to right on the top side of the curve.
 *
 * @param  {object}                   edge         The edge object.
 * @param  {object}                   source node  The edge source node.
 * @param  {object}                   target node  The edge target node.
 * @param  {CanvasRenderingContext2D} context      The canvas context.
 * @param  {configurable}             settings     The settings function.
 */
export default sigma =>
  function edgeLabelsCurvedArrow(edge, source, target, context, settings) {
    sigma.canvas.edges.labels.curve(edge, source, target, context, settings);
  };
