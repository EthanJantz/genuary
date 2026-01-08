export function getMode(shapes) {
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

export function generateFormationPoints(p, sides, count, radius) {
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

export function assignTargets(shapes, points) {
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
