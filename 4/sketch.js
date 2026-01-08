import p5 from "p5";

const sketch = (p) => {
  let coneTexture;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.noSmooth();

    // Create cone texture with stripes
    coneTexture = p.createGraphics(64, 64);
    coneTexture.noSmooth();
    coneTexture.background(255, 100, 0);
    coneTexture.noStroke();
    coneTexture.fill(255);
    // Two white stripes
    coneTexture.rect(0, 16, 64, 8);
    coneTexture.rect(0, 36, 64, 8);
  };

  p.draw = () => {
    p.background(220);
    p.orbitControl();

    // Basic lighting
    p.ambientLight(100);
    p.directionalLight(255, 255, 255, 0.5, 0.5, -1);

    // Draw the traffic cone
    drawTrafficCone(p, 0, 50, 0, 200);
  };

  function drawTrafficCone(p, x, y, z, size) {
    const coneHeight = size;
    const baseRadius = size * 0.4;
    const segments = 8; // Low-res: fewer segments

    p.push();
    p.translate(x, y, z);

    // Orange cone body with striped texture
    p.noStroke();
    p.push();
    p.rotateX(p.PI);
    p.texture(coneTexture);
    p.cone(baseRadius, coneHeight, segments, 1);
    p.pop();

    // Black base
    p.fill(30);
    p.push();
    p.translate(0, coneHeight / 2, 0);
    p.cylinder(baseRadius * 1.3, size * 0.08, segments, 1);
    p.pop();

    p.pop();
  }
};

new p5(sketch);
