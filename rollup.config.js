import fs from "fs";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import shader from "rollup-plugin-shader";

const { NODE_ENV: environment } = process.env;
const isProd = environment === "production";
const qualifier = isProd ? ".min." : ".";

if (!fs.existsSync("build/temp")) {
  fs.mkdirSync("build/temp", { recursive: true });
}

const shaderConfig = {};

const umdPlugins = isProd
  ? [resolve(), commonjs(), shader(shaderConfig), terser()]
  : [resolve(), commonjs(), shader(shaderConfig)];
const cjsPlugins = isProd
  ? [shader(shaderConfig), terser()]
  : [shader(shaderConfig)];

function library(ns) {
  const rootFileName = `build/temp/${ns}${qualifier}js`;
  fs.writeFileSync(
    rootFileName,
    `
    import sigma from "sigma";
    if (typeof sigma === "undefined") {
      throw new Error("sigma is not declared");
    }
    import plugin from "../../lib/plugins/${ns}/index.js";
    plugin(sigma);
    `
  );

  return {
    input: rootFileName,
    output: {
      file: `build/plugins/${ns}${qualifier}js`,
      format: "umd",
      globals: {
        sigma: "sigma"
      }
    },
    plugins: umdPlugins
  };
}

export default [
  // browser-friendly UMD build
  {
    input: "lib/core/index.js",
    output: {
      name: "sigma",
      file: `build/sigma.umd${qualifier}js`,
      format: "umd"
    },
    plugins: umdPlugins
  },
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "lib/core/index.js",
    external: ["ms"],
    output: [
      { file: `build/sigma.cjs${qualifier}js`, format: "cjs" },
      { file: `build/sigma.esm${qualifier}js`, format: "es" }
    ],
    plugins: cjsPlugins
  },
  library("sigma.exporters.svg"),
  library("sigma.layout.noverlap"),
  library("sigma.layout.forceAtlas2"),
  library("sigma.neo4j.cypher"),
  library("sigma.parsers.gexf"),
  library("sigma.parsers.json"),
  library("sigma.pathfinding.astar"),
  library("sigma.plugins.animate"),
  library("sigma.plugins.dragNodes"),
  library("sigma.plugins.filter"),
  library("sigma.plugins.neighborhoods"),
  library("sigma.plugins.relativeSize"),
  library("sigma.renderers.customEdgeShapes"),
  library("sigma.renderers.customShapes"),
  library("sigma.renderers.edgeDots"),
  library("sigma.renderers.edgeLabels"),
  library("sigma.renderers.parallelEdges"),
  library("sigma.renderers.snapshot"),
  library("sigma.statistics.HITS")
];
