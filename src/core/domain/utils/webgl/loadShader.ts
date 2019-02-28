export default function loadShader(
  gl: WebGLRenderingContext,
  shaderSource: string,
  shaderType: number,
  error?: (err: Error) => void
): WebGLShader | undefined {
  const shader = gl.createShader(shaderType);

  if (shader !== null) {
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

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
  return undefined;
}
