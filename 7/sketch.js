import p5 from "p5";

// Vertex shader - just passes coordinates through
const vertShader = `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;
out vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Fragment shader - does the XOR operation
const fragShader = `#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;

void main() {
  vec2 center = vec2(0.5);
  vec2 pixel = gl_FragCoord.xy;
  vec2 uv = (pixel / uResolution) + sin(uTime / 2.0) / 2.0 - 0.25;

  vec2 uv_centered = uv - center;
  float angle = uTime;

  vec2 uv_shifted = uv - vec2(0.0, uTime * 0.1);

  uv_shifted = fract(uv_shifted);

  vec2 uv_rotated;
  uv_rotated.x = uv_shifted.x * cos(angle) - uv_shifted.y * sin(angle);
  uv_rotated.y = uv_shifted.x * sin(angle) + uv_shifted.y * cos(angle);

  uv_rotated += center;

  vec3 gradient1 = vec3(uv_shifted.x, uv_shifted.y, uv_rotated.x);
  vec3 gradient2 = vec3(uv_rotated.x, uv_rotated.y, uv_shifted.y);
  vec3 gradient3 = vec3(uv_rotated.y, uv_shifted.x, uv_shifted.x);
  
  ivec3 gradient1Int = ivec3(gradient1 * 255.0);
  ivec3 gradient2Int = ivec3(gradient2 * 255.0);
  ivec3 gradient3Int = ivec3(gradient3 * 255.0);
  ivec3 xorResult = gradient1Int ^ gradient2Int;
  ivec3 shiftResult = xorResult >> 1;
  ivec3 andResult = shiftResult & gradient3Int;
  vec3 finalColor = vec3(shiftResult) / 255.0;
  
  fragColor = vec4(finalColor, 1.0);
}
`;

let xorShader;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

    xorShader = p.createShader(vertShader, fragShader);
    p.noStroke();
  };

  p.draw = () => {
    p.shader(xorShader);

    xorShader.setUniform("uResolution", [p.width, p.height]);
    xorShader.setUniform("uMouse", [p.width * 0.75, p.height * 0.75]);
    xorShader.setUniform("uCircleRadius", 80.0);
    xorShader.setUniform("uTime", p.millis() / 1000.0);

    p.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  };
};

new p5(sketch);
