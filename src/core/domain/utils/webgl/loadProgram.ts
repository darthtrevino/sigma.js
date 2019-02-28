export default function loadProgram(
  gl: WebGLRenderingContext,
  shaders: WebGLShader[],
  attribs: string[] = [],
  locations?: number[],
  error?: (err: Error) => void
): WebGLProgram | undefined {
  const program = gl.createProgram();
  if (program !== null) {
    // Load shaders and attributes
    shaders.forEach(shader => gl.attachShader(program, shader));
    attribs.forEach((attrib, i) =>
      gl.bindAttribLocation(program, locations ? locations[i] : i, attrib)
    );
    gl.linkProgram(program);

    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      if (error) {
        error(
          new Error(
            `Error in program linking: ${gl.getProgramInfoLog(program)}`
          )
        );
      }
      gl.deleteProgram(program);
      return undefined;
    }

    return program;
  }
  return undefined;
}
