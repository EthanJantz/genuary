import p5 from "p5";
import {
  getMode,
  generateFormationPoints,
  assignTargets,
} from "./flock_shaping";
import { Shape } from "./shape";

const sketch = (p) => {
  let shapes;
  let lastShapeCount = 0;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    shapes = [];
    for (let i = 0; i < 500; i++) {
      shapes.push(
        new Shape(
          p,
          p.random(p.width),
          p.random(p.height),
          p.random(10, 20),
          p.floor(p.random(3, 5)),
          p.color(p.random(255), p.random(255), p.random(255)),
        ),
      );
    }
  };

  p.draw = () => {
    p.background(220);

    const shapesChanged = shapes.length !== lastShapeCount;
    lastShapeCount = shapes.length;

    if (p.frameCount % 30 === 0 || shapesChanged) {
      const mode = getMode(shapes);
      const radius = Math.min(p.width, p.height) * 0.4;
      const points = generateFormationPoints(p, mode, shapes.length, radius);
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
  };
};

new p5(sketch);
