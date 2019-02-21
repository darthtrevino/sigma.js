import worker from "./src/worker";
import supervisor from "./src/supervisor";

export default function extend(sigma) {
  worker(sigma);
  supervisor(sigma);
}
