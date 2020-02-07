precision highp float;

uniform float uTime;
varying vec2 vUv;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    vec2 uv = vUv;
    float r = rand(uv * uTime);
    gl_FragColor = vec4(r, r, r, 0.025);
}