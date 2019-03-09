attribute vec2 a_position1;
attribute vec2 a_position2;
attribute float a_thickness;
attribute float a_minus;
attribute vec4 a_color;

uniform vec2 u_resolution;
uniform float u_ratio;
uniform float u_scale;
uniform mat3 u_matrix;
uniform mat2 u_matrixHalfPi;
uniform mat2 u_matrixHalfPiMinus;

varying vec4 color;

void main(){
    // Find the good point:
    vec2 position=a_thickness*u_ratio*
    normalize(a_position2-a_position1);
    
    mat2 matrix=a_minus*u_matrixHalfPiMinus+
    (1.-a_minus)*u_matrixHalfPi;
    
    position=matrix*position+a_position1;
    
    // Scale from [[-1 1] [-1 1]] to the container:
    gl_Position=vec4(
        ((u_matrix*vec3(position,1)).xy/
    u_resolution*2.-1.)*vec2(1,-1),
    0,
    1
);

// Extract the color:
color=a_color/255.;
}