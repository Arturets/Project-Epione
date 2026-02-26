import { ROUTES_MANIFEST, SHARED_COMPONENTS } from '../config/routes-manifest';

export function getRoutesManifestPayload() {
  return {
    routes: ROUTES_MANIFEST,
    sharedComponents: SHARED_COMPONENTS
  };
}

export function buildRoutesSvg() {
  const width = 1200;
  const height = 760;
  const nodeWidth = 220;
  const nodeHeight = 64;

  const roleColumns: Record<string, number> = {
    public: 80,
    customer: 360,
    coach: 660,
    admin: 960
  };

  const roleRows = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();

  for (const route of ROUTES_MANIFEST) {
    const current = roleRows.get(route.role) ?? 0;
    const x = roleColumns[route.role] ?? 80;
    const y = 80 + current * 110;
    roleRows.set(route.role, current + 1);
    positions.set(route.id, { x, y });
  }

  const edgePaths: string[] = [];
  const seenEdge = new Set<string>();

  for (const route of ROUTES_MANIFEST) {
    const from = positions.get(route.id);
    if (!from) continue;

    for (const targetId of route.linksTo) {
      const to = positions.get(targetId);
      if (!to) continue;
      const edgeKey = `${route.id}->${targetId}`;
      if (seenEdge.has(edgeKey)) continue;
      seenEdge.add(edgeKey);

      const x1 = from.x + nodeWidth;
      const y1 = from.y + nodeHeight / 2;
      const x2 = to.x;
      const y2 = to.y + nodeHeight / 2;
      const c1 = x1 + 45;
      const c2 = x2 - 45;

      edgePaths.push(`<path d=\"M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}\" stroke=\"#6f91a0\" stroke-width=\"1.4\" fill=\"none\" marker-end=\"url(#arrow)\"/>`);
    }
  }

  const nodes = ROUTES_MANIFEST.map((route) => {
    const pos = positions.get(route.id)!;
    const fill =
      route.role === 'admin'
        ? '#ffe7dd'
        : route.role === 'coach'
          ? '#dafaf6'
          : route.role === 'customer'
            ? '#e4f8ff'
            : '#ffeedd';

    return `<g>
      <rect x=\"${pos.x}\" y=\"${pos.y}\" width=\"${nodeWidth}\" height=\"${nodeHeight}\" rx=\"12\" fill=\"${fill}\" stroke=\"#2f5660\" stroke-width=\"1\"/>
      <text x=\"${pos.x + 12}\" y=\"${pos.y + 26}\" font-family=\"Avenir Next, Segoe UI, sans-serif\" font-size=\"13\" fill=\"#10212a\">${escapeXml(route.title)}</text>
      <text x=\"${pos.x + 12}\" y=\"${pos.y + 45}\" font-family=\"Avenir Next, Segoe UI, sans-serif\" font-size=\"11\" fill=\"#3f6470\">${escapeXml(route.path)}</text>
    </g>`;
  });

  return `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\">\n  <defs>\n    <marker id=\"arrow\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"3.5\" orient=\"auto\">\n      <polygon points=\"0 0, 8 3.5, 0 7\" fill=\"#6f91a0\" />\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"#f6fffd\"/>\n  ${edgePaths.join('\n  ')}\n  ${nodes.join('\n  ')}\n</svg>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
