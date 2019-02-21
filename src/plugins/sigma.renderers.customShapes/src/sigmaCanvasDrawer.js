export default (drawShape, drawBorder, drawImage) =>
  function customDraw(node, context, settings) {
    const prefix = settings("prefix") || "";
    const size = node[`${prefix}size`];
    const color = node.color || settings("defaultNodeColor");
    const borderColor = node.borderColor || color;
    const x = node[`${prefix}x`];
    const y = node[`${prefix}y`];
    context.save();

    if (drawShape) {
      drawShape(node, x, y, size, color, context);
    }

    if (drawBorder) {
      drawBorder(node, x, y, size, borderColor, context);
    }

    drawImage(node, x, y, size, context);

    context.restore();
  };
