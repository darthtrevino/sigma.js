export default function loadProgram(
  gl: WebGLRenderingContext,
  shaders: WebGLShader[],
  attribs?: string[],
  locations?: number[],
  error?: (err: Error) => void
): WebGLProgram | undefined {
  let i;
  const program = gl.createProgram();

  for (i = 0; i < shaders.length; ++i) gl.attachShader(program, shaders[i]);

  if (attribs)
    for (i = 0; i < attribs.length; ++i)
      gl.bindAttribLocation(program, locations ? locations[i] : i, attribs[i]);

  gl.linkProgram(program);

  // Check the link status
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    if (error)
      error(
        new Error(`Error in program linking: ${gl.getProgramInfoLog(program)}`)
      );

    gl.deleteProgram(program);
    return undefined;
  }

  return program;
}
