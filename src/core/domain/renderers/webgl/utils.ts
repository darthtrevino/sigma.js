import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

export function getColor(
  edge: Edge,
  source: Node,
  target: Node,
  settings: Settings
): string {
  let { color } = edge;

  if (!color)
    switch (settings("edgeColor")) {
      case "source":
        color = source.color || settings("defaultNodeColor");
        break;
      case "target":
        color = target.color || settings("defaultNodeColor");
        break;
      default:
        color = settings("defaultEdgeColor");
        break;
    }
  return color;
}

export function shaders(
  ...items: Array<WebGLShader | undefined | null>
): WebGLShader[] {
  return items.filter(t => !!t) as WebGLShader[];
}
