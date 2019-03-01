import floatColor from "../../utils/misc/floatColor";
import loadShader from "../../utils/webgl/loadShader";
import loadProgram from "../../utils/webgl/loadProgram";
import { Edge, Node, WebGLEdgeDrawer } from "../../../interfaces";
import { Settings } from "../../classes/Configurable";
import { getColor, shaders } from "./utils";

/**
 * This will render edges as thick lines using four points translated
 * orthogonally from the source & target's centers by half thickness.
 *
 * Rendering two triangles by using only four points is made possible through
 * the use of indices.
 *
 * This method should be faster than the 6 points / 2 triangles approach and
 * should handle thickness better than with gl.LINES.
 *
 * This version of the shader balances geometry computation evenly between
 * the CPU & GPU (normals are computed on the CPU side).
 */
export default {
  POINTS: 4,
  ATTRIBUTES: 6,
  addEdge(
    edge: Edge,
    source: Node,
    target: Node,
    data,
    i: number,
    prefix: string,
    settings: Settings
  ) {
    const thickness = (edge as any)[`${prefix}size`] || 1;
    const x1 = source[`${prefix}x`];
    const y1 = source[`${prefix}y`];
    const x2 = target[`${prefix}x`];
    const y2 = target[`${prefix}y`];
    const color = floatColor(getColor(edge, source, target, settings));

    // Computing normals:
    const dx = x2 - x1;
    const dy = y2 - y1;
    let len = dx * dx + dy * dy;

    let normals;
    if (!len) {
      normals = [0, 0];
    } else {
      len = 1 / Math.sqrt(len);
      normals = [-dy * len, dx * len];
    }
    const [norm0, norm1] = normals;

    // First point
    data[i++] = x1;
    data[i++] = y1;
    data[i++] = norm0;
    data[i++] = norm1;
    data[i++] = thickness;
    data[i++] = color;

    // First point flipped
    data[i++] = x1;
    data[i++] = y1;
    data[i++] = -norm0;
    data[i++] = -norm1;
    data[i++] = thickness;
    data[i++] = color;

    // Second point
    data[i++] = x2;
    data[i++] = y2;
    data[i++] = norm0;
    data[i++] = norm1;
    data[i++] = thickness;
    data[i++] = color;

    // Second point flipped
    data[i++] = x2;
    data[i++] = y2;
    data[i++] = -norm0;
    data[i++] = -norm1;
    data[i++] = thickness;
    data[i++] = color;
  },
  computeIndices(data: Float32Array) {
    const indices = new Uint16Array(data.length * 6);
    let c = 0;
    const l = data.length / this.ATTRIBUTES;

    for (let i = 0; i < l; i += 4) {
      indices[c++] = i + 0;
      indices[c++] = i + 1;
      indices[c++] = i + 2;
      indices[c++] = i + 2;
      indices[c++] = i + 1;
      indices[c++] = i + 3;
    }

    return indices;
  },
  render(gl, program, data, params) {
    // Define attributes:
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const normalLocation = gl.getAttribLocation(program, "a_normal");
    const thicknessLocation = gl.getAttribLocation(program, "a_thickness");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const ratioLocation = gl.getUniformLocation(program, "u_ratio");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // Creating buffer:
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Binding uniforms:
    gl.uniform2f(resolutionLocation, params.width, params.height);
    gl.uniform1f(
      ratioLocation,
      params.ratio / params.ratio ** params.settings("edgesPowRatio")
    );

    gl.uniformMatrix3fv(matrixLocation, false, params.matrix);

    // Binding attributes:
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(normalLocation);
    gl.enableVertexAttribArray(thicknessLocation);
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
      normalLocation,
      2,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      8
    );
    gl.vertexAttribPointer(
      thicknessLocation,
      1,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      16
    );
    gl.vertexAttribPointer(
      colorLocation,
      1,
      gl.FLOAT,
      false,
      this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      20
    );

    // Creating indices buffer:
    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, params.indicesData, gl.STATIC_DRAW);

    // Drawing:
    gl.drawElements(
      gl.TRIANGLES,
      params.indicesData.length,
      gl.UNSIGNED_SHORT,
      params.start || 0
    );
  },
  initProgram(gl: WebGLRenderingContext) {
    const vertexShader = loadShader(
      gl,
      [
        "attribute vec2 a_position;",
        "attribute vec2 a_normal;",
        "attribute float a_thickness;",
        "attribute float a_color;",

        "uniform vec2 u_resolution;",
        "uniform float u_ratio;",
        "uniform mat3 u_matrix;",

        "varying vec4 v_color;",

        "void main() {",

        // Scale from [[-1 1] [-1 1]] to the container:
        "vec2 delta = vec2(a_normal * a_thickness / 2.0);",
        "vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;",
        "position = (position / u_resolution * 2.0 - 1.0) * vec2(1, -1);",

        // Applying
        "gl_Position = vec4(position, 0, 1);",
        "gl_PointSize = 10.0;",

        // Extract the color:
        "float c = a_color;",
        "v_color.b = mod(c, 256.0); c = floor(c / 256.0);",
        "v_color.g = mod(c, 256.0); c = floor(c / 256.0);",
        "v_color.r = mod(c, 256.0); c = floor(c / 256.0); v_color /= 255.0;",
        "v_color.a = 1.0;",
        "}"
      ].join("\n"),
      gl.VERTEX_SHADER
    );

    const fragmentShader = loadShader(
      gl,
      [
        "precision mediump float;",

        "varying vec4 v_color;",

        "void main(void) {",
        "gl_FragColor = v_color;",
        "}"
      ].join("\n"),
      gl.FRAGMENT_SHADER
    );

    const program = loadProgram(gl, shaders(vertexShader, fragmentShader));
    return program;
  }
} as WebGLEdgeDrawer;
