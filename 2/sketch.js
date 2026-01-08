import p5 from "p5";

class Particle {
  constructor(p, x, y) {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.vel = p.createVector(p.random(-10, 10), p.random(-10, 10));
    this.trail = []; // Array of {x, y, time, isDash}
    this.nextIsDash = true;
    this.fadeDuration = 5000; // 5 seconds in milliseconds
    this.dashLength = 5;
    this.gapLength = 5;
    this.radius = 4;
    this.acc = p.createVector(0, 0);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  collideWith(other) {
    const dist = this.pos.dist(other.pos);
    const minDist = this.radius + other.radius;

    if (dist < minDist && dist > 0) {
      // Collision normal
      const normal = p5.Vector.sub(other.pos, this.pos).normalize();

      // Relative velocity
      const relVel = p5.Vector.sub(this.vel, other.vel);
      const velAlongNormal = relVel.dot(normal);

      // Only resolve if particles are moving toward each other
      if (velAlongNormal > 0) {
        // Transfer velocity along the collision normal
        const impulse = normal.copy().mult(velAlongNormal);
        this.vel.sub(impulse);
        other.vel.add(impulse);

        // Separate particles to prevent overlap
        const overlap = minDist - dist;
        const separation = normal.copy().mult(overlap / 2);
        this.pos.sub(separation);
        other.pos.add(separation);
      }
    }
  }

  update() {
    // Dash length scales with velocity
    const speed = this.vel.mag();
    const dynamicDashLength = this.p.map(speed, 0, 5, 2, 20);
    const minDist = dynamicDashLength + this.gapLength;
    const last = this.trail[this.trail.length - 1];

    if (
      !last ||
      this.p.dist(this.pos.x, this.pos.y, last.x, last.y) >= minDist
    ) {
      this.trail.push({
        x: this.pos.x,
        y: this.pos.y,
        time: this.p.millis(),
        isDash: this.nextIsDash,
      });
      this.nextIsDash = !this.nextIsDash;
    }

    // Remove old trail points (older than fade duration)
    const now = this.p.millis();
    this.trail = this.trail.filter(
      (point) => now - point.time < this.fadeDuration,
    );

    // Apply acceleration to velocity
    this.vel.add(this.acc);
    this.acc.mult(0);

    // Update position
    this.pos.add(this.vel);

    // Friction
    this.vel.mult(0.99);

    // Bounce off edges
    if (this.pos.x < 0 || this.pos.x > this.p.width) {
      this.vel.x *= -1.2;
      this.vel.y += this.p.random(-0.2, 0.2);
    }
    if (this.pos.y < 0 || this.pos.y > this.p.height) {
      this.vel.y *= -1.2;
      this.vel.x += this.p.random(-0.2, 0.2);
    }
  }

  display() {
    const now = this.p.millis();

    this.p.strokeWeight(2);
    this.p.noFill();

    for (let i = 1; i < this.trail.length; i++) {
      const p1 = this.trail[i - 1];
      const p2 = this.trail[i];

      if (!p1.isDash) continue;

      // Calculate alpha based on age (older = more faded)
      const age = now - p1.time;
      const alpha = this.p.map(age, 0, this.fadeDuration, 255, 0);

      this.p.stroke(0, alpha);
      this.p.line(p1.x, p1.y, p2.x, p2.y);
    }

    // Draw particle
    this.p.fill(0);
    this.p.noStroke();
    this.p.ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
  }

  drawDashedLine(x1, y1, x2, y2) {
    const d = this.p.dist(x1, y1, x2, y2);
    const dx = (x2 - x1) / d;
    const dy = (y2 - y1) / d;

    let drawn = 0;

    while (drawn < d) {
      const segmentLength = this.dashLength;
      const remaining = d - drawn;
      const len = Math.min(segmentLength, remaining);

      const startX = x1 + dx * drawn;
      const startY = y1 + dy * drawn;
      const endX = startX + dx * len;
      const endY = startY + dy * len;
      this.p.line(startX, startY, endX, endY);

      drawn += len;
    }
  }
}

const sketch = (p) => {
  let particles = [];
  const numParticles = 10;
  let gravity;
  const gravityStrength = 0.2;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    gravity = p.createVector(0, 0);
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle(p, p.random(p.width), p.random(p.height)));
    }
  };

  p.draw = () => {
    p.background(220);

    // Calculate tilt direction from canvas center to mouse position
    const center = p.createVector(p.width / 2, p.height / 2);
    const mouse = p.createVector(p.mouseX, p.mouseY);
    const tilt = p5.Vector.sub(mouse, center);
    // Scale by distance from center (further = steeper tilt)
    const maxDist = p.mag(p.width / 2, p.height / 2);
    const tiltAmount = tilt.mag() / maxDist;
    gravity = tilt.normalize().mult(gravityStrength * tiltAmount);

    // Check collisions between all pairs
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        particles[i].collideWith(particles[j]);
      }
    }

    // Update and display all particles
    for (const particle of particles) {
      particle.applyForce(gravity);
      particle.update();
      particle.display();
    }
  };
};

new p5(sketch);
