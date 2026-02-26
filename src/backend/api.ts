import type { RequestHandler } from '@builder.io/qwik-city';
import { getElectricClient } from '../electric/client';

export const onGet: RequestHandler = async ({ json }) => {
  const electric = await getElectricClient();

  // Placeholder: fetch a small summary of graph meta from ElectricSQL.
  // You can replace this with real queries once you've defined your schema.
  const meta = {
    nodes: 6,
    edges: 5,
    pattern: 'star',
    lastSyncedAt: new Date().toISOString()
  };

  void electric; // suppress unused warning until real queries are wired up

  json(200, meta);
};


