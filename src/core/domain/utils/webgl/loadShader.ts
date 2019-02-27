export default function loadShader(
  gl: WebGLRenderingContext,
  shaderSource: string,
  shaderType: number,
  error?: (err: Error) => void
): WebGLShader | undefined {
  const shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  // If something went wrong:
  if (!compiled) {
    if (error) {
      error(
        new Error(
          `Error compiling shader "${shader}":${gl.getShaderInfoLog(shader)}`
        )
      );
    }

    gl.deleteShader(shader);
    return undefined;
  }

  return shader;
}
