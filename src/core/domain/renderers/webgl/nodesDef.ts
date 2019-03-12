import floatColor from "../../utils/misc/floatColor";
import loadShader from "../../utils/webgl/loadShader";
import loadProgram from "../../utils/webgl/loadProgram";
import { Node, WebGLNodeDrawer } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";
import { shaders } from "./utils";
// @ts-ignore
import vertexShaderSource from "./shaders/nodesDef.vs";
// @ts-ignore
import fragmentShaderSource from "./shaders/nodesDef.fs";

/**
 * This node renderer will display nodes as discs, shaped in triangles with
 * the gl.TRIANGLES display mode. So, to be more precise, to draw one node,
 * it will store three times the center of node, with the color and the size,
 * and an angle indicating which "corner" of the triangle to draw.
 *
 * The fragment shader does not deal with anti-aliasing, so make sure that
 * you deal with it somewhere else in the code (by default, the WebGL
 * renderer will oversample the rendering through the webglOversamplingRatio
 * value).
 */
export default {
  POINTS: 3,
  ATTRIBUTES: 5,
  addNode(node: Node, data, i: number, prefix: string, settings: Settings) {
    const color = floatColor(node.color || settings("defaultNodeColor"));
    const size = node[`${prefix}size`];
    data[i++] = node[`${prefix}x`];
    data[i++] = node[`${prefix}y`];
    data[i++] = size;
    data[i++] = color;
    data[i++] = 0;

    data[i++] = node[`${prefix}x`];
    data[i++] = node[`${prefix}y`];
    data[i++] = size;
    data[i++] = color;
    data[i++] = (2 * Math.PI) / 3;

    data[i++] = node[`${prefix}x`];
    data[i++] = node[`${prefix}y`];
    data[i++] = size;
    data[i++] = color;
    data[i++] = (4 * Math.PI) / 3;
  },
  render(gl: WebGLRenderingContext, program: WebGLProgram, data, params) {
    // Define attributes:
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const sizeLocation = gl.getAttribLocation(program, "a_size");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const angleLocation = gl.getAttribLocation(program, "a_angle");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const ratioLocation = gl.getUniformLocation(program, "u_ratio");
    const scaleLocation = gl.getUniformLocation(program, "u_scale");
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    gl.uniform2f(resolutionLocation, params.width, params.height);
    gl.uniform1f(
      ratioLocation,
      1 / params.ratio ** params.settings("nodesPowRatio")
    );
    gl.uniform1f(scaleLocation, params.scalingRatio);
    gl.uniformMatrix3fv(matrixLocation, false, params.matrix);

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(sizeLocation);
    gl.enableVertexAttribArray(colorLocation);
    gl.enableVertexAttribArray(angleLocation);

    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    gl.vertexAttribPointer(
      sizeLocation,
      1,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      8
    );
    gl.vertexAttribPointer(
      colorLocation,
      4,
      gl.UNSIGNED_BYTE,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      12
    );
    gl.vertexAttribPointer(
      angleLocation,
      1,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      16
    );

    gl.drawArrays(
      gl.TRIANGLES,
      params.start || 0,
      params.count || data.length / this.ATTRIBUTES
    );
  },
  initProgram(gl: WebGLRenderingContext) {
    const vertexShader = loadShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = loadShader(
      gl,
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );
    const program = loadProgram(gl, shaders(vertexShader, fragmentShader));
    return program;
  }
} as WebGLNodeDrawer;
