import p5 from "p5";
import Hydra from "hydra-synth";

// Initialize Hydra
const hydra = new Hydra({
  detectAudio: false,
  width: window.innerWidth,
  height: window.innerHeight,
});
const { s0, src, noise, o0, o1, render } = hydra.synth;

let coneTexture;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.noSmooth();

    coneTexture = p.createGraphics(64, 64);
    coneTexture.noSmooth();
    coneTexture.background(255, 100, 0);
    coneTexture.noStroke();
    coneTexture.fill(255);
    coneTexture.rect(0, 16, 64, 8);

    // Initialize Hydra source with p5 canvas
    s0.init({ src: p.canvas });
    p.canvas.style.display = "none";

    // Hydra pipeline
    src(s0).out(o0);

    noise()
      .modulateRotate(o0)
      .modulateScale(o0)
      .diff(src(o0).scrollY(0.25, 0))
      .out(o1);

    render(o1);
  };

  p.draw = () => {
    p.background(220);

    p.rotateY(p.frameCount * 0.02);

    p.ambientLight(100);
    p.directionalLight(255, 255, 255, 0.5, 0.5, -1);

    drawTrafficCone(p, 0, 50, 0, 200);
  };

  function drawTrafficCone(p, x, y, z, size) {
    const coneHeight = size;
    const baseRadius = size * 0.4;
    const segments = 8;

    p.push();
    p.translate(x, y, z);

    p.noStroke();
    p.push();
    p.rotateX(p.PI);
    p.texture(coneTexture);
    p.cone(baseRadius, coneHeight, segments, 1);
    p.pop();

    p.fill(30);
    p.push();
    p.translate(0, coneHeight / 2, 0);
    p.cylinder(baseRadius * 1.3, size * 0.08, segments, 1);
    p.pop();

    p.pop();
  }
};

new p5(sketch);
