import p5 from "p5";

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

const sketch = (p) => {
  let palette;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100);
    const word = "GENUARY";
    palette = generatePalette(word, 50);
  };

  p.draw = () => {
    p.background(220);
    drawPalette(p, palette);
  };
};

new p5(sketch);
