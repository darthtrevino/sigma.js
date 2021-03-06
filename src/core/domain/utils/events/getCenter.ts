import getPixelRatio from "./getPixelRatio";
import getWidth from "./getWidth";
import getHeight from "./getHeight";

export default function getCenter(e: MouseEvent | TouchEvent) {
  const ratio =
    (e.target as any).namespaceURI.indexOf("svg") !== -1 ? 1 : getPixelRatio();
  return {
    x: getWidth(e) / (2 * ratio),
    y: getHeight(e) / (2 * ratio)
  };
}
