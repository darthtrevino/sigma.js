import { Edge, Node } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";

export function getColor(
  edge: Edge,
  source: Node,
  target: Node,
  settings: Settings
): string {
  let { color } = edge;
  if (color != null) {
    return color;
  }

  switch (settings("edgeColor")) {
    case "source":
      return source.color || settings("defaultNodeColor");
    case "target":
      return target.color || settings("defaultNodeColor");
    default:
      return settings("defaultEdgeColor");
  }
}

export function shaders(
  ...items: Array<WebGLShader | undefined | null>
): WebGLShader[] {
  return items.filter(t => !!t) as WebGLShader[];
}
