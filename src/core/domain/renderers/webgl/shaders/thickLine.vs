attribute vec2 a_position;
attribute vec2 a_normal;
attribute float a_thickness;
attribute vec4 a_color;

uniform vec2 u_resolution;
uniform float u_ratio;
uniform mat3 u_matrix;

varying vec4 v_color;

void main(){
    
    // Scale from [[-1 1] [-1 1]] to the container:
    vec2 delta=vec2(a_normal*a_thickness/2.);
    vec2 position=(u_matrix*vec3(a_position+delta,1)).xy;
    position=(position/u_resolution*2.-1.)*vec2(1,-1);
    
    // Applying
    gl_Position=vec4(position,0,1);
    gl_PointSize=10.;
    
    // Extract the color:
    v_color=a_color/255.;
}