import floatColor from "../../utils/misc/floatColor";
import loadProgram from "../../utils/webgl/loadProgram";
import loadShader from "../../utils/webgl/loadShader";
import { Edge, Node, WebGLEdgeDrawer } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";
import { getColor, shaders } from "./utils";

/**
 * This edge renderer will display edges as lines with the gl.LINES display
 * mode. Since this mode does not support well thickness, edges are all drawn
 * with the same thickness (3px), independantly of the edge attributes or the
 * zooming ratio.
 */
export default {
  POINTS: 2,
  ATTRIBUTES: 3,
  addEdge(
    edge: Edge,
    source: Node,
    target: Node,
    data,
    i: number,
    prefix: string,
    settings: Settings
  ) {
    const x1 = source[`${prefix}x`];
    const y1 = source[`${prefix}y`];
    const x2 = target[`${prefix}x`];
    const y2 = target[`${prefix}y`];
    // Normalize color:
    const { color, alpha } = floatColor(
      getColor(edge, source, target, settings)
    );

    data[i++] = x1;
    data[i++] = y1;
    data[i++] = color;

    data[i++] = x2;
    data[i++] = y2;
    data[i++] = color;
  },
  render(gl: WebGLRenderingContext, program: WebGLProgram, data, params) {
    // Define attributes:
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.uniform2f(resolutionLocation, params.width, params.height);
    gl.uniformMatrix3fv(matrixLocation, false, params.matrix);
    gl.enableVertexAttribArray(positionLocation);
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
      colorLocation,
      1,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      8
    );

    gl.lineWidth(3);
    gl.drawArrays(
      gl.LINES,
      params.start || 0,
      params.count || data.length / this.ATTRIBUTES
    );
  },
  initProgram(gl) {
    const vertexShader = loadShader(
      gl,
      [
        "attribute vec2 a_position;",
        "attribute float a_color;",

        "uniform vec2 u_resolution;",
        "uniform mat3 u_matrix;",

        "varying vec4 color;",

        "void main() {",
        // Scale from [[-1 1] [-1 1]] to the container:
        "gl_Position = vec4(",
        "((u_matrix * vec3(a_position, 1)).xy /",
        "u_resolution * 2.0 - 1.0) * vec2(1, -1),",
        "0,",
        "1",
        ");",

        // Extract the color:
        "float c = a_color;",
        "color.b = mod(c, 256.0); c = floor(c / 256.0);",
        "color.g = mod(c, 256.0); c = floor(c / 256.0);",
        "color.r = mod(c, 256.0); c = floor(c / 256.0); color /= 255.0;",
        "color.a = 1.0;",
        "}"
      ].join("\n"),
      gl.VERTEX_SHADER
    );

    const fragmentShader = loadShader(
      gl,
      [
        "precision mediump float;",

        "varying vec4 color;",

        "void main(void) {",
        "gl_FragColor = color;",
        "}"
      ].join("\n"),
      gl.FRAGMENT_SHADER
    );

    const program = loadProgram(gl, shaders(vertexShader, fragmentShader));
    return program;
  }
} as WebGLEdgeDrawer;
