import p5 from "p5";

const sketch = (p) => {
  const boids = [];
  const numBoids = 100;
  let dayNightCycle = 0; // 0 = white/day, 1 = black/night
  let cycleSpeed = 0.002;

  class Boid {
    constructor(x, y) {
      this.pos = p.createVector(x, y);
      this.vel = p5.Vector.random2D().mult(p.random(2, 4));
      this.acc = p.createVector();
      this.maxForce = 0.2;
      this.maxSpeed = 4;
      this.size = 4;

      // Orbital state
      this.orbitCenter = p.createVector();
      this.orbitRadius = 0;
      this.orbitAngle = 0;
      this.orbitSpeed = 0;
    }

    // Boid flocking behaviors
    align(boids) {
      let steering = p.createVector();
      let total = 0;
      const perceptionRadius = 50;

      for (let other of boids) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (other !== this && d < perceptionRadius) {
          steering.add(other.vel);
          total++;
        }
      }
      if (total > 0) {
        steering.div(total);
        steering.setMag(this.maxSpeed);
        steering.sub(this.vel);
        steering.limit(this.maxForce);
      }
      return steering;
    }

    cohesion(boids) {
      let steering = p.createVector();
      let total = 0;
      const perceptionRadius = 50;

      for (let other of boids) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (other !== this && d < perceptionRadius) {
          steering.add(other.pos);
          total++;
        }
      }
      if (total > 0) {
        steering.div(total);
        steering.sub(this.pos);
        steering.setMag(this.maxSpeed);
        steering.sub(this.vel);
        steering.limit(this.maxForce);
      }
      return steering;
    }

    separation(boids) {
      let steering = p.createVector();
      let total = 0;
      const perceptionRadius = 25;

      for (let other of boids) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (other !== this && d < perceptionRadius) {
          let diff = p5.Vector.sub(this.pos, other.pos);
          diff.div(d * d);
          steering.add(diff);
          total++;
        }
      }
      if (total > 0) {
        steering.div(total);
        steering.setMag(this.maxSpeed);
        steering.sub(this.vel);
        steering.limit(this.maxForce);
      }
      return steering;
    }

    flock(boids) {
      let alignment = this.align(boids);
      let cohesion = this.cohesion(boids);
      let separation = this.separation(boids);

      this.acc.add(alignment);
      this.acc.add(cohesion);
      this.acc.add(separation.mult(1.5));
    }

    // Orbital star behavior
    initOrbit() {
      // Orbit center is offset from current position
      this.orbitRadius = p.random(20, 80);
      this.orbitAngle = p.random(p.TWO_PI);
      this.orbitSpeed = p.random(0.005, 0.02) * (p.random() > 0.5 ? 1 : -1);

      // Calculate center so current position is on the orbit
      this.orbitCenter = p.createVector(
        this.pos.x - Math.cos(this.orbitAngle) * this.orbitRadius,
        this.pos.y - Math.sin(this.orbitAngle) * this.orbitRadius
      );
    }

    moveOrbital() {
      this.orbitAngle += this.orbitSpeed;
      this.pos.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
      this.pos.y = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius;
    }

    // Update based on blend factor (0 = boid, 1 = orbital)
    update(blend, boids) {
      if (blend < 0.5) {
        // Boid behavior
        this.flock(boids);
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // Wrap around edges
        if (this.pos.x > p.width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = p.width;
        if (this.pos.y > p.height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = p.height;
      } else {
        // Orbital star behavior
        this.moveOrbital();
      }
    }

    // Called when transitioning to orbital mode
    transitionToOrbit() {
      this.initOrbit();
    }

    // Called when transitioning back to boid mode
    transitionToBoid() {
      // Calculate velocity from orbital motion tangent
      let tangentAngle = this.orbitAngle + (this.orbitSpeed > 0 ? p.HALF_PI : -p.HALF_PI);
      let speed = Math.abs(this.orbitSpeed) * this.orbitRadius * 60;
      this.vel = p.createVector(Math.cos(tangentAngle), Math.sin(tangentAngle)).mult(speed);
      this.vel.limit(this.maxSpeed);
    }

    draw(blend) {
      // Color transitions from black (day) to white (night)
      let col = p.lerpColor(p.color(30), p.color(255), blend);
      p.fill(col);
      p.noStroke();

      if (blend < 0.5) {
        // Draw as triangle pointing in direction of movement
        let angle = this.vel.heading();
        p.push();
        p.translate(this.pos.x, this.pos.y);
        p.rotate(angle);
        p.triangle(
          this.size * 2, 0,
          -this.size, -this.size,
          -this.size, this.size
        );
        p.pop();
      } else {
        // Draw as twinkling star
        let twinkle = p.map(Math.sin(p.frameCount * 0.1 + this.orbitAngle * 10), -1, 1, 0.5, 1);
        p.push();
        p.translate(this.pos.x, this.pos.y);
        p.ellipse(0, 0, this.size * 2 * twinkle, this.size * 2 * twinkle);
        p.pop();
      }
    }
  }

  let wasNight = false;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);

    for (let i = 0; i < numBoids; i++) {
      boids.push(new Boid(p.random(p.width), p.random(p.height)));
    }
  };

  p.draw = () => {
    // Oscillate between 0 and 1
    dayNightCycle = (Math.sin(p.frameCount * cycleSpeed) + 1) / 2;

    // Background: 255 (white) at cycle=0, 0 (black) at cycle=1
    let bgColor = p.lerp(255, 0, dayNightCycle);
    p.background(bgColor);

    // Detect state transitions at 50%
    let isNight = dayNightCycle >= 0.5;
    if (isNight !== wasNight) {
      for (let boid of boids) {
        if (isNight) {
          boid.transitionToOrbit();
        } else {
          boid.transitionToBoid();
        }
      }
      wasNight = isNight;
    }

    // Update and draw all boids
    for (let boid of boids) {
      boid.update(dayNightCycle, boids);
      boid.draw(dayNightCycle);
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

new p5(sketch);
