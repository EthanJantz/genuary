import p5 from "p5";
import Hydra from "hydra-synth";

// Initialize Hydra
const hydra = new Hydra({
  detectAudio: false,
  width: window.innerWidth,
  height: window.innerHeight,
});
const { s0, src, osc, colorama, modulate, kaleid, o0, o1, render } =
  hydra.synth;
const time = () => hydra.synth.time;

const fibCache = [0, 1, 1];
function fib(n) {
  if (fibCache[n] !== undefined) return fibCache[n];
  fibCache[n] = fib(n - 2) + fib(n - 1);
  return fibCache[n];
}

const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const totalPoints = 500;
const scale = 50;

let currentPoint = 0;

const sketch = (p) => {
  let cx, cy;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(0);
    p.stroke("white");
    p.strokeWeight(3);

    cx = p.width / 2;
    cy = p.height / 2;

    // Initialize Hydra source with p5 canvas
    s0.init({ src: p.canvas });
    p.canvas.style.display = "none";

    // Hydra pipeline
    src(s0).colorama().modulate(osc(10).kaleid()).out(o0);

    src(o0)
      .add(src(o0).rotate(Math.PI))
      .kaleid()
      .modulate(src(o1))
      .diff(src(o1).rotate(() => (time() % 360) / 1000))
      .out(o1);

    render(o1);
  };

  p.draw = () => {
    const r = Math.log(fib(currentPoint) + 1) * scale;
    const angle = currentPoint * goldenAngle;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    p.point(x, y);
    currentPoint++;
  };
};

new p5(sketch);
