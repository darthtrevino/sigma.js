attribute vec2 a_position;
attribute float a_size;
attribute vec4 a_color;

uniform vec2 u_resolution;
uniform float u_ratio;
uniform float u_scale;
uniform mat3 u_matrix;

varying vec4 color;

void main(){
    // Scale from [[-1 1] [-1 1]] to the container:
    gl_Position=vec4(
        ((u_matrix*vec3(a_position,1)).xy/
    u_resolution*2.-1.)*vec2(1,-1),
    0,
    1
);

// Multiply the point size twice:
//  - x SCALING_RATIO to correct the canvas scaling
//  - x 2 to correct the formulae
gl_PointSize=a_size*u_ratio*u_scale*2.;

// Extract the color:
color=a_color/255.;
}