attribute vec2 a_pos1;
attribute vec2 a_pos2;
attribute float a_thickness;
attribute float a_tSize;
attribute float a_delay;
attribute float a_minus;
attribute float a_head;
attribute float a_headPosition;
attribute vec4 a_color;

uniform vec2 u_resolution;
uniform float u_ratio;
uniform float u_nodeRatio;
uniform float u_arrowHead;
uniform float u_scale;
uniform mat3 u_matrix;
uniform mat2 u_matrixHalfPi;
uniform mat2 u_matrixHalfPiMinus;

varying vec4 color;

void main(){
    // Find the good point:
    vec2 pos=normalize(a_pos2-a_pos1);
    
    mat2 matrix=(1.-a_head)*
    (
        a_minus*u_matrixHalfPiMinus+
        (1.-a_minus)*u_matrixHalfPi
    )+a_head*(
        a_headPosition*u_matrixHalfPiMinus*.6+
        (a_headPosition*a_headPosition-1.)*mat2(1.)
    );
    
    pos=a_pos1+(
        // Deal with body:
        (1.-a_head)*a_thickness*u_ratio*matrix*pos+
        // Deal with head:
        a_head*u_arrowHead*a_thickness*u_ratio*matrix*pos+
        // Deal with delay:
        a_delay*pos*(
            a_tSize/u_nodeRatio+
            u_arrowHead*a_thickness*u_ratio
        )
    );
    
    // Scale from [[-1 1] [-1 1]] to the container:
    gl_Position=vec4(
        ((u_matrix*vec3(pos,1)).xy/u_resolution*2.-1.)*vec2(1,-1),
        0,
        1
    );
    
    // Extract the color:
    color=a_color/255.;
}