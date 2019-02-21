import {
  drawSquare,
  drawCircle,
  drawDiamond,
  drawCross,
  drawEquilateral,
  drawStar,
  drawPacman
} from "./drawing";

const shapes = [];
function register(name, drawShape, drawBorder) {
  shapes.push({
    name,
    drawShape,
    drawBorder
  });
}

function enumerate() {
  return shapes;
}

/**
 * For the standard closed shapes - the shape fill and border are drawn the
 * same, with some minor differences for fill and border. To facilitate this we
 * create the generic draw functions, that take a shape drawing func and
 * return a shape-renderer/border-renderer
 * ----------
 */
function shape(shapeFunc) {
  return (node, x, y, size, color, context) => {
    context.fillStyle = color;
    context.beginPath();
    shapeFunc(node, x, y, size, context);
    context.closePath();
    context.fill();
  };
}

function border(shapeFunc) {
  return (node, x, y, size, color, context) => {
    context.strokeStyle = color;
    context.lineWidth = size / 5;
    context.beginPath();
    shapeFunc(node, x, y, size, context);
    context.closePath();
    context.stroke();
  };
}

register("square", shape(drawSquare), border(drawSquare));
register("circle", shape(drawCircle), border(drawCircle));
register("diamond", shape(drawDiamond), border(drawDiamond));
register("cross", shape(drawCross), border(drawCross));
register("equilateral", shape(drawEquilateral), border(drawEquilateral));
register("star", shape(drawStar), border(drawStar));
register("pacman", drawPacman, null);

export default {
  enumerate,
  version: "0.1"
};
