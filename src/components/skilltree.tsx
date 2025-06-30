// src/components/StarCircles.tsx
import { component$ } from '@builder.io/qwik';

import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';

interface Node extends SimulationNodeDatum {
  id: string;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

// Create 5 nodes
const nodes: Node[] = [
  { id: 'A' },
  { id: 'B' },
  { id: 'C' },
  { id: 'D' },
  { id: 'E' },
];

// Connect them in a star pattern (A is the center)
const links: Link[] = [
  { source: 'A', target: 'B' },
  { source: 'A', target: 'C' },
  { source: 'A', target: 'D' },
  { source: 'A', target: 'E' },
];

// Create simulation
const sim = forceSimulation<Node>(nodes)
  .force('charge', forceManyBody().strength(-200))
  .force('link', forceLink<Node, Link>(links).id(d => d.id).distance(100))
  .force('center', forceCenter(0, 0))
  .stop();

// Run simulation manually for a few ticks
for (let i = 0; i < 300; i++) sim.tick();

// Output final positions
for (const node of nodes) {
  console.log(`${node.id}: x=${node.x?.toFixed(1)}, y=${node.y?.toFixed(1)}`);
}

export const SkillTree = component$(() => {
  const radius = 10;
  const positions = [
    { cx: 50, cy: 10 },   // Top
    { cx: 90, cy: 35 },   // Top-right
    { cx: 72, cy: 80 },   // Bottom-right
    { cx: 28, cy: 80 },   // Bottom-left
    { cx: 10, cy: 35 },   // Top-left
  ];

  return (
    <svg viewBox="0 0 100 100" class="w-full h-auto max-w-xs mx-auto">
      {positions.map((pos, i) => (
        <circle key={i} cx={pos.cx} cy={pos.cy} r={radius} fill="#4ade80" />
      ))}
    </svg>
  );
});
