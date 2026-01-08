import p5 from "p5";
import Hydra from "hydra-synth";

// Initialize Hydra
const hydra = new Hydra({
  detectAudio: false,
  width: window.innerWidth,
  height: window.innerHeight,
});
const { s0, src, solid, shape, o0, o1, o2, o3, render } = hydra.synth;

class Shape {
  constructor(p, x, y, radius, sides, color) {
    this.p = p;
    this.spawnCooldown = 0;

    this.pos = p.createVector(x, y);
    this.random_seed = this.p.map(this.p.random(), 0, 1, 0, 1000000);
    this.random_offset = this.p.map(this.p.random(), 0, 1, 0, 1000000);
    this.vel = this.p.createVector(
      20 * this.p.noise(0.005 * this.p.frameCount + this.random_seed),
      20 *
        this.p.noise(
          0.005 * this.p.frameCount + this.random_seed + this.random_offset,
        ),
    );

    this.radius = radius;
    this.sides = sides;
    this.color = color;

    this.maxSpeed = 5;
    this.maxForce = 0.05;
    this.perceptionRadius = 50;
  }

  flock(shapes) {
    const { p, pos, vel, perceptionRadius } = this;

    const separation = p.createVector(0, 0);
    const alignment = p.createVector(0, 0);
    let total = 0;

    for (const other of shapes) {
      if (other === this) continue;
      const d = pos.dist(other.pos);

      if (d < perceptionRadius) {
        const diff = p5.Vector.sub(pos, other.pos);
        diff.div(d * d);
        separation.add(diff);
        alignment.add(other.vel);
        total++;
      }
    }

    if (total > 0) {
      separation.div(total);
      separation.setMag(this.maxSpeed);
      separation.sub(vel);
      separation.limit(this.maxForce);

      alignment.div(total);
      alignment.setMag(this.maxSpeed);
      alignment.sub(vel);
      alignment.limit(this.maxForce);
    }

    // seek target instead of cohesion
    const seek = p.createVector(0, 0);
    if (this.target) {
      const desired = p5.Vector.sub(this.target, pos);
      desired.setMag(this.maxSpeed);
      seek.add(p5.Vector.sub(desired, vel));
      seek.limit(this.maxForce);
    }

    // more sides = less repulsion (more likely to collide)
    const separationStrength = p.map(this.sides, 3, 10, 1.5, 0.2);
    separation.mult(separationStrength);
    alignment.mult(1.0);
    seek.mult(1.0); // tweak this weight

    this.vel.add(separation);
    this.vel.add(alignment);
    this.vel.add(seek);
    this.vel.limit(this.maxSpeed);
  }

  isSplittable() {
    return this.sides > 16;
  }

  update(shapes) {
    const { p, pos, vel, radius, random_seed } = this;

    if (this.spawnCooldown > 0) this.spawnCooldown--;

    // slowly gain sides over time
    if (p.frameCount % 60 === 0 && p.random() < 0.1) {
      this.sides++;
    }

    // more sides = faster movement
    this.maxSpeed = 3 + this.sides * 0.5;

    this.flock(shapes);
    pos.add(vel);

    const wrapBoost = 3;

    if (pos.x > p.width - radius) {
      this.pos.x = radius;
      this.vel.x = Math.abs(this.vel.x) + wrapBoost;
    }

    if (pos.x < radius) {
      this.pos.x = p.width - radius;
      this.vel.x = -Math.abs(this.vel.x) - wrapBoost;
    }

    if (pos.y > p.height - radius) {
      this.pos.y = radius;
      this.vel.y = Math.abs(this.vel.y) + wrapBoost;
    }

    if (pos.y < radius) {
      this.pos.y = p.height - radius;
      this.vel.y = -Math.abs(this.vel.y) - wrapBoost;
    }
  }

  draw() {
    const { p, pos, radius, sides, color } = this;
    const { x, y } = pos;

    p.fill(color);
    p.beginShape();
    for (let i = 0; i < sides; i++) {
      const angle = p.map(i, 0, sides, 0, p.TWO_PI) - p.HALF_PI;
      const vx = x + p.cos(angle) * radius;
      const vy = y + p.sin(angle) * radius;
      p.vertex(vx, vy);
    }
    p.endShape(p.CLOSE);
  }

  collidesWith(other) {
    return this.pos.dist(other.pos) < this.radius + other.radius;
  }
}

function getMode(shapes) {
  const counts = {};
  for (const s of shapes) {
    counts[s.sides] = (counts[s.sides] || 0) + 1;
  }
  let mode = 3;
  let maxCount = 0;
  for (const [sides, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mode = parseInt(sides);
    }
  }
  return mode;
}

function generateFormationPoints(p, sides, count, radius) {
  const points = [];
  const centerX = p.width / 2;
  const centerY = p.height / 2;

  // points per edge
  const pointsPerEdge = Math.ceil(count / sides);

  for (let i = 0; i < sides; i++) {
    const angle1 = p.map(i, 0, sides, 0, p.TWO_PI) - p.HALF_PI;
    const angle2 = p.map(i + 1, 0, sides, 0, p.TWO_PI) - p.HALF_PI;

    const x1 = centerX + p.cos(angle1) * radius;
    const y1 = centerY + p.sin(angle1) * radius;
    const x2 = centerX + p.cos(angle2) * radius;
    const y2 = centerY + p.sin(angle2) * radius;

    for (let j = 0; j < pointsPerEdge; j++) {
      const t = j / pointsPerEdge;
      points.push(p.createVector(p.lerp(x1, x2, t), p.lerp(y1, y2, t)));
    }
  }

  return points;
}

function assignTargets(shapes, points) {
  const available = [...points];

  for (const shape of shapes) {
    if (available.length === 0) break;

    // find nearest available point
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < available.length; i++) {
      const d = shape.pos.dist(available[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    shape.target = available[nearestIdx];
    available.splice(nearestIdx, 1);
  }
}

let shapes;
let lastShapeCount = 0;
let modeSides = 3;
let smoothedModeSides = 3;
let avgSides = 3;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);

    shapes = [];
    for (let i = 0; i < 50; i++) {
      shapes.push(
        new Shape(
          p,
          p.random(p.width),
          p.random(p.height),
          p.random(10, 20),
          p.floor(p.random(3, 5)),
          p.color(255, 255, 255),
        ),
      );
    }

    // Initialize Hydra source with p5 canvas
    s0.init({ src: p.canvas });
    p.canvas.style.display = "none";

    // Hydra pipeline
    // solid color based on average sides - moderate variation
    solid(
      () => (Math.sin(avgSides * 0.3) + 1) / 2,
      () => (Math.sin(avgSides * 0.3 + 1.0) + 1) / 2,
      () => (Math.sin(avgSides * 0.3 + 2.0) + 1) / 2,
    ).out(o2);

    // p5 canvas with color in black areas
    src(o2).diff(src(s0)).out(o0);

    // shape with color in black areas (using average sides)
    src(o2)
      .mult(
        shape(() => avgSides, 0.5, 0.01)
          .invert()
          .rotate(Math.PI),
      )
      .add(shape(() => avgSides, 0.5, 0.01).rotate(Math.PI))
      .out(o1);

    // blend o0 and o1
    src(o0).blend(src(o1), 0.5).out(o3);

    render(o3);
  };

  p.draw = () => {
    p.background(0);

    const shapesChanged = shapes.length !== lastShapeCount;
    lastShapeCount = shapes.length;

    modeSides = getMode(shapes);
    smoothedModeSides = p.lerp(smoothedModeSides, modeSides, 0.05);

    const totalSides = shapes.reduce((sum, s) => sum + s.sides, 0);
    avgSides = Math.round(totalSides / shapes.length) || 3;
    const radius = Math.min(p.width, p.height) * 0.4;

    if (p.frameCount % 30 === 0 || shapesChanged) {
      const points = generateFormationPoints(p, avgSides, shapes.length, radius);
      assignTargets(shapes, points);
    }
    const toRemove = new Set();
    const toAdd = new Set();

    shapes.forEach((shape, i) => {
      if (toRemove.has(shape)) return;
      shape.update(shapes);
      // check for collissions and resolve
      shapes.slice(i + 1).forEach((other) => {
        if (shape.collidesWith(other)) {
          if (shape.spawnCooldown > 0 || other.spawnCooldown > 0) return;

          if (toRemove.has(other)) return;

          const more_sides = shape.sides >= other.sides ? shape : other;
          const less_sides = shape.sides < other.sides ? shape : other;

          const c1 = p.color(more_sides.color);
          const c2 = p.color(less_sides.color);

          toRemove.add(less_sides);

          more_sides.sides += less_sides.sides;
          more_sides.color = p.lerpColor(c1, c2, 0.5);

          // reproduce if the shape has enough sides
          if (more_sides.isSplittable()) {
            toRemove.add(more_sides);
            const offset = more_sides.radius * 1.5;
            const s1 = new Shape(
              p,
              more_sides.pos.x - offset,
              more_sides.pos.y - offset,
              Math.max(more_sides.radius / 2, 7),
              3,
              p.lerpColor(c1, c2, 0.5),
            );
            s1.spawnCooldown = 10;

            const s2 = new Shape(
              p,
              less_sides.pos.x + offset,
              less_sides.pos.y + offset,
              Math.max(less_sides.radius / 2, 7),
              3,
              p.lerpColor(c1, c2, 0.5),
            );
            s2.spawnCooldown = 10;
            toAdd.add(s1).add(s2);
          }
        }
      });

      shape.draw();
    });

    // resolve removals and additions of shapes
    shapes.push(...toAdd);
    shapes = shapes.filter((s) => !toRemove.has(s));

    // spawn higher-sided shapes when population is low
    if (shapes.length < 40) {
      const newShape = new Shape(
        p,
        p.random(p.width),
        p.random(p.height),
        p.random(10, 20),
        p.floor(p.random(6, 11)),
        p.color(255, 255, 255),
      );
      newShape.spawnCooldown = 10;
      shapes.push(newShape);
    }

    // burst events - spawn waves of shapes periodically
    if (p.frameCount % 300 === 0) {
      const burstType = p.random() < 0.5 ? "high" : "low";
      const burstCount = p.floor(p.random(8, 15));
      for (let i = 0; i < burstCount; i++) {
        const sides = burstType === "high" ? p.floor(p.random(6, 9)) : 3;
        const newShape = new Shape(
          p,
          p.random(p.width),
          p.random(p.height),
          p.random(10, 20),
          sides,
          p.color(255, 255, 255),
        );
        newShape.spawnCooldown = 10;
        shapes.push(newShape);
      }
    }
  };
};

new p5(sketch);
