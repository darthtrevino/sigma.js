import floatColor from "../../utils/misc/floatColor";
import loadShader from "../../utils/webgl/loadShader";
import loadProgram from "../../utils/webgl/loadProgram";
import { Node, WebGLNodeDrawer } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";
import { shaders } from "./utils";

// @ts-ignore
import vertexShaderSource from "nodesFast.vs";
// @ts-ignore
import fragmentShaderSource from "nodesFast.fs";

/**
 * This node renderer will display nodes in the fastest way: Nodes are basic
 * squares, drawn through the gl.POINTS drawing method. The size of the nodes
 * are represented with the "gl_PointSize" value in the vertex shader.
 *
 * It is the fastest node renderer here since the buffer just takes one line
 * to draw each node (with attributes "x", "y", "size" and "color").
 *
 * Nevertheless, this method has some problems, especially due to some issues
 * with the gl.POINTS:
 *  - First, if the center of a node is outside the scene, the point will not
 *    be drawn, even if it should be partly on screen.
 *  - I tried applying a fragment shader similar to the one in the default
 *    node renderer to display them as discs, but it did not work fine on
 *    some computers settings, filling the discs with weird gradients not
 *    depending on the actual color.
 */
export default {
  POINTS: 1,
  ATTRIBUTES: 4,
  addNode(
    node: Node,
    data: Float32Array,
    i: number,
    prefix: string,
    settings: Settings
  ) {
    const color = floatColor(node.color || settings("defaultNodeColor"));
    data[i++] = node[`${prefix}x`];
    data[i++] = node[`${prefix}y`];
    data[i++] = node[`${prefix}size`];
    data[i++] = color;
  },
  render(gl: WebGLRenderingContext, program: WebGLProgram, data, params) {
    // Define attributes:
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const sizeLocation = gl.getAttribLocation(program, "a_size");
    const colorLocation = gl.getAttribLocation(program, "a_color");
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

    gl.drawArrays(
      gl.POINTS,
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
