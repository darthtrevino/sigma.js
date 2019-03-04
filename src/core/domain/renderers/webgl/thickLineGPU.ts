import { Edge, Node, SigmaLibrary, WebGLEdgeDrawer } from "../../../interfaces";
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
 * This version of the shader computes geometry on the GPU side only, making
 * the handled array buffer heavier but sparing costly computation to the
 * CPU side.
 */
export default (sigma: SigmaLibrary) =>
  ({
    POINTS: 4,
    ATTRIBUTES: 7,
    addEdge(
      edge: Edge,
      source: Node,
      target: Node,
      data: Float32Array,
      i: number,
      prefix: string,
      settings: Settings
    ) {
      const thickness = (edge as any)[`${prefix}size`] || 1;
      const x1 = source[`${prefix}x`];
      const y1 = source[`${prefix}y`];
      const x2 = target[`${prefix}x`];
      const y2 = target[`${prefix}y`];

      // Normalize color:
      const { color, alpha } = sigma.utils.floatColor(
        getColor(edge, source, target, settings)
      );

      // First point
      data[i++] = x1;
      data[i++] = y1;
      data[i++] = x2;
      data[i++] = y2;
      data[i++] = 1.0;
      data[i++] = thickness;
      data[i++] = color;

      // First point flipped
      data[i++] = x1;
      data[i++] = y1;
      data[i++] = x2;
      data[i++] = y2;
      data[i++] = -1.0;
      data[i++] = thickness;
      data[i++] = color;

      // Second point
      data[i++] = x2;
      data[i++] = y2;
      data[i++] = x1;
      data[i++] = y1;
      data[i++] = 1.0;
      data[i++] = thickness;
      data[i++] = color;

      // Second point flipped
      data[i++] = x2;
      data[i++] = y2;
      data[i++] = x1;
      data[i++] = y1;
      data[i++] = -1.0;
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
    render(gl: WebGLRenderingContext, program: WebGLProgram, data, params) {
      // Define attributes:
      const position1Location = gl.getAttribLocation(program, "a_position1");
      const position2Location = gl.getAttribLocation(program, "a_position2");
      const directionLocation = gl.getAttribLocation(program, "a_direction");
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
      gl.enableVertexAttribArray(position1Location);
      gl.enableVertexAttribArray(position2Location);
      gl.enableVertexAttribArray(directionLocation);
      gl.enableVertexAttribArray(thicknessLocation);
      gl.enableVertexAttribArray(colorLocation);

      gl.vertexAttribPointer(
        position1Location,
        2,
        gl.FLOAT,
        false,
        this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
        0
      );
      gl.vertexAttribPointer(
        position2Location,
        2,
        gl.FLOAT,
        false,
        this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
        8
      );
      gl.vertexAttribPointer(
        directionLocation,
        1,
        gl.FLOAT,
        false,
        this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
        16
      );
      gl.vertexAttribPointer(
        thicknessLocation,
        1,
        gl.FLOAT,
        false,
        this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
        20
      );
      gl.vertexAttribPointer(
        colorLocation,
        1,
        gl.FLOAT,
        false,
        this.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
        24
      );

      // Creating indices buffer:
      const indicesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        params.indicesData,
        gl.STATIC_DRAW
      );

      // Drawing:
      gl.drawElements(
        gl.TRIANGLES,
        params.indicesData.length,
        gl.UNSIGNED_SHORT,
        params.start || 0
      );
    },
    initProgram(gl: WebGLRenderingContext) {
      const vertexShader = sigma.webgl.loadShader(
        gl,
        [
          "attribute vec2 a_position1;",
          "attribute vec2 a_position2;",
          "attribute float a_direction;",
          "attribute float a_thickness;",
          "attribute float a_color;",

          "uniform vec2 u_resolution;",
          "uniform float u_ratio;",
          "uniform mat3 u_matrix;",

          "varying vec4 v_color;",

          "void main() {",

          // Scale from [[-1 1] [-1 1]] to the container:
          "vec2 translation = a_position2 - a_position1;",
          "vec2 orthogonal = vec2(translation.y, -translation.x);",
          "vec2 delta = a_thickness / 2.0 * a_direction * normalize(orthogonal);",
          "vec2 position = (u_matrix * vec3(a_position1 + delta, 1)).xy;",
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
        gl.VERTEX_SHADER,
        error => console.log(error)
      );

      const fragmentShader = sigma.webgl.loadShader(
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

      const program = sigma.webgl.loadProgram(
        gl,
        shaders(vertexShader, fragmentShader)
      );
      return program;
    }
  } as WebGLEdgeDrawer);
