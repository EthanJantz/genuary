import p5 from "p5";

const fibCache = [0, 1, 1];
function fib(n) {
  if (fibCache[n] !== undefined) return fibCache[n];
  fibCache[n] = fib(n - 2) + fib(n - 1);
  return fibCache[n];
}

const sketch = (p) => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const maxDepth = 3;
  const pointsPerSpiral = 5000;
  let pointsDrawn = 0;
  let maxPoints = 0;
  let spirals = [];

  function drawSpiral(cx, cy, scale, depth, maxPts) {
    if (depth > maxDepth) return;

    //     // Draw center point
    //     if (depth === 0) {
    //       p.point(cx, cy);
    //       pointsDrawn++;
    //     }

    for (let i = 0; i <= pointsPerSpiral; i++) {
      if (pointsDrawn >= maxPts) return;

      let r = Math.log(fib(i) + 1) * scale * 2;
      let angle = i * goldenAngle;
      let x = cx + r * p.cos(angle);
      let y = cy + r * p.sin(angle);

      p.point(x, y);
      pointsDrawn++;

      drawSpiral(x, y, scale * 0.2, depth + 1, maxPts);
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.strokeWeight(3);
    // Initial spiral at center
    spirals.push({ x: p.width / 2, y: p.height / 2, startFrame: 0 });
  };

  p.draw = () => {
    p.background(220);

    for (let spiral of spirals) {
      pointsDrawn = 0;
      maxPoints = p.frameCount - spiral.startFrame;
      drawSpiral(spiral.x, spiral.y, 50, 0, maxPoints);
    }
  };

  p.mousePressed = () => {
    console.log("Click at:", p.mouseX, p.mouseY);
    spirals.push({
      x: p.mouseX,
      y: p.mouseY,
      startFrame: p.frameCount,
    });
  };
};

new p5(sketch);
