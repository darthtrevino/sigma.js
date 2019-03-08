precision mediump float;

varying vec4 color;

void main(void){
    float border=.01;
    float radius=.5;
    
    vec4 color0=vec4(0.,0.,0.,0.);
    vec2 m=gl_PointCoord-vec2(.5,.5);
    float dist=radius-sqrt(m.x*m.x+m.y*m.y);
    
    float t=0.;
    if(dist>border)
    t=1.;
    else if(dist>0.)
    t=dist/border;
    
    gl_FragColor=mix(color0,color,t);
}