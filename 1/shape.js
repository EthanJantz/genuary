import p5 from "p5";

export class Shape {
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

    separation.mult(1.5);
    alignment.mult(1.0);
    seek.mult(1.0); // tweak this weight

    this.vel.add(separation);
    this.vel.add(alignment);
    this.vel.add(seek);
    this.vel.limit(this.maxSpeed);
  }

  isSplittable() {
    return this.sides > 8;
  }

  update(shapes) {
    const { p, pos, vel, radius, random_seed } = this;

    if (this.spawnCooldown > 0) this.spawnCooldown--;

    this.flock(shapes);
    pos.add(vel);

    if (pos.x > p.width - radius) {
      this.pos.x = 0;
    }

    if (pos.x < 0) {
      this.pos.x = p.width;
    }

    if (pos.y > p.height - radius) {
      this.pos.y = 0;
    }

    if (pos.y < 0) {
      this.pos.y = p.height;
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
