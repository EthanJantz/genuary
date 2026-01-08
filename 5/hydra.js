import p5 from "p5";
import Hydra from "hydra-synth";

// Initialize Hydra
const hydra = new Hydra({ detectAudio: false });
const { s0, src, o0, o1, render, time, mouse } = hydra.synth;

function generatePalette(inputString, hueSeed) {
  const palette = [];
  let currentHue = hueSeed;

  for (let i = 0; i < inputString.length; i++) {
    palette.push({
      h: currentHue % 360,
      s: 80,
      b: 90,
    });

    if (i < inputString.length - 1) {
      const currentCode = inputString.charCodeAt(i);
      const nextCode = inputString.charCodeAt(i + 1);
      currentHue += Math.abs(nextCode - currentCode);
    }
  }

  return palette;
}

function drawPalette(p, palette) {
  const blockWidth = p.width / palette.length;

  for (let i = 0; i < palette.length; i++) {
    const color = palette[i];
    p.noStroke();
    p.fill(color.h, color.s, color.b);
    p.rect(i * blockWidth, 0, blockWidth, p.height);
  }
}

const word = "GENUARY";
let palette;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100);

    // Initialize Hydra source with p5 canvas
    s0.init({ src: p.canvas });

    // Hydra pipeline
    src(s0).out(o0);

    src(o0)
      .rotate(() => time % 360)
      .modulateKaleid(src(o1))
      .out(o1);

    render(o1);
  };

  p.draw = () => {
    p.background(220);
    palette = generatePalette(word, p.mouseX);
    drawPalette(p, palette);
  };
};

new p5(sketch);
