

uniform float time;
varying vec2 vUv;
varying vec2 vUv1;
varying vec4 vPosition;

uniform sampler2D texturn1;
uniform sampler2D texture2;
uniform vec2 pixels;
uniform vec2 uvRate1;

attribute float size;

void main(){

    vUv = uv;

    //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 50.0 * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}