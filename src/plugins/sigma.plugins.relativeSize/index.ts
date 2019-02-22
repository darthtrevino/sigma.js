import relativeSize from "./src/relativeSize";

export default function extend(sigma) {
  sigma.register("sigma.plugins.relativeSize", relativeSize);
}
