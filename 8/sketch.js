import p5 from "p5";

class Node {
  constructor(pos) {
    this.pos = pos;
    this.edges = [];
  }
}

const sketch = (p) => {
  let nodes = [];
  let boundary;
  const minDist = 50;
  const candidatesPerNode = 30;

  // Check if a point is inside the boundary (circle)
  const isInBoundary = (pos) => {
    return p.dist(pos.x, pos.y, boundary.x, boundary.y) < boundary.r;
  };

  // Check if a point is far enough from all existing nodes
  const isFarEnough = (pos) => {
    for (let node of nodes) {
      if (p.dist(pos.x, pos.y, node.pos.x, node.pos.y) < minDist) {
        return false;
      }
    }
    return true;
  };

  // Generate nodes using the algorithm
  const generateNodes = () => {
    const openList = [];

    // Start with center point
    const startNode = new Node(p.createVector(boundary.x, boundary.y), 4);
    nodes.push(startNode);
    openList.push(startNode);

    while (openList.length > 0) {
      // Pick first element and remove it
      const current = openList.shift();

      // Generate candidates around it
      for (let i = 0; i < candidatesPerNode; i++) {
        const angle = p.random(p.TWO_PI);
        const dist = p.random(minDist, minDist * 2);
        const candidatePos = p.createVector(
          current.pos.x + p.cos(angle) * dist,
          current.pos.y + p.sin(angle) * dist,
        );

        // Check if candidate is valid
        if (isInBoundary(candidatePos) && isFarEnough(candidatePos)) {
          const newNode = new Node(candidatePos, 4);
          nodes.push(newNode);
          openList.push(newNode);
        }
      }
    }
  };

  // Check if two line segments intersect (excluding endpoints)
  const segmentsIntersect = (a1, a2, b1, b2) => {
    const ccw = (A, B, C) => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };

    // Check if segments share an endpoint
    if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
      return false;
    }

    return (
      ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2)
    );
  };

  // Check if edge already exists between two nodes
  const edgeExists = (nodeA, nodeB) => {
    return nodeA.edges.some((e) => e === nodeB);
  };

  // Check if adding edge would create a triangle
  const wouldCreateTriangle = (nodeA, nodeB) => {
    for (let neighbor of nodeA.edges) {
      if (neighbor.edges.includes(nodeB)) {
        return true;
      }
    }
    return false;
  };

  // Check if new edge would cross any existing edge
  const wouldCross = (nodeA, nodeB) => {
    for (let node of nodes) {
      for (let neighbor of node.edges) {
        if (segmentsIntersect(nodeA.pos, nodeB.pos, node.pos, neighbor.pos)) {
          return true;
        }
      }
    }
    return false;
  };

  // Get all edges as pairs for drawing
  const getEdges = () => {
    const edges = [];
    const seen = new Set();
    for (let node of nodes) {
      for (let neighbor of node.edges) {
        const key = [nodes.indexOf(node), nodes.indexOf(neighbor)]
          .sort()
          .join("-");
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([node, neighbor]);
        }
      }
    }
    return edges;
  };

  // Find best node to connect to given constraints
  const findBestNode = (fromNode, direction) => {
    let candidates = [];

    for (let node of nodes) {
      if (node === fromNode) continue;
      if (node.edges.length >= 4) continue; // No 5+-way intersections
      if (edgeExists(fromNode, node)) continue; // No doubling up
      if (wouldCreateTriangle(fromNode, node)) continue; // No triangles
      if (wouldCross(fromNode, node)) continue; // No crossings

      candidates.push(node);
    }

    if (candidates.length === 0) return null;

    // Score candidates: alignment with direction + lower distance is better
    let best = null;
    let bestScore = -Infinity;

    for (let candidate of candidates) {
      const toCandidate = p5.Vector.sub(candidate.pos, fromNode.pos);
      const dist = toCandidate.mag();
      const alignment = p5.Vector.dot(
        direction.copy().normalize(),
        toCandidate.copy().normalize(),
      );

      // Score: higher alignment is better, lower distance is better
      const score = alignment - dist / 200;

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    return best;
  };

  // Create a street starting from a node
  const createStreet = (startNode) => {
    let edgesCreated = 0;
    let currentNode = startNode;
    let direction = p5.Vector.fromAngle(p.random(p.TWO_PI));

    while (true) {
      if (currentNode.edges.length >= 4) break;

      const bestNode = findBestNode(currentNode, direction);
      if (!bestNode) break;

      // Create edge
      currentNode.edges.push(bestNode);
      bestNode.edges.push(currentNode);
      edgesCreated++;

      // Update direction for next iteration
      direction = p5.Vector.sub(bestNode.pos, currentNode.pos).normalize();
      currentNode = bestNode;
    }

    return edgesCreated;
  };

  // Generate all edges
  const generateEdges = () => {
    const openList = [...nodes];

    while (openList.length > 0) {
      // Pick a random node
      const idx = Math.floor(p.random(openList.length));
      const node = openList[idx];

      // If degree is 4, remove from list
      if (node.edges.length >= 4) {
        openList.splice(idx, 1);
        continue;
      }

      // Create a street from this node
      const edgesCreated = createStreet(node);

      // If no edges created, remove from list
      if (edgesCreated === 0) {
        openList.splice(idx, 1);
      }
    }
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    boundary = {
      x: p.windowWidth / 2,
      y: p.windowHeight / 2,
      r: p.min(p.windowWidth, p.windowHeight) * 0.4,
    };
    generateNodes();
    generateEdges();
    // Remove isolated nodes and dead ends (degree 1)
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].edges.length <= 1) {
          const node = nodes[i];
          // Remove this node from its neighbor's edges
          for (let neighbor of node.edges) {
            neighbor.edges = neighbor.edges.filter((e) => e !== node);
          }
          nodes.splice(i, 1);
          changed = true;
        }
      }
    }
    console.log(
      `Generated ${nodes.length} nodes and ${getEdges().length} edges`,
    );
  };

  p.draw = () => {
    p.background(220);

    // Draw boundary
    p.noFill();
    p.stroke(150);
    p.strokeWeight(2);
    p.circle(boundary.x, boundary.y, boundary.r * 2);

    // Draw edges
    p.stroke(0);
    p.strokeWeight(2);
    for (let [a, b] of getEdges()) {
      p.line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
    }

    // Draw nodes
    //     p.fill(0);
    //     p.noStroke();
    //     for (let node of nodes) {
    //       p.circle(node.pos.x, node.pos.y, 8);
    //     }
  };
};

new p5(sketch);
