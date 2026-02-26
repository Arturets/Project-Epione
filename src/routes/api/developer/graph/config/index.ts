import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { readDatabase } from '../../../../../lib/db';
import { getBaseGraphConfig, getMergedGraphConfig } from '../../../../../lib/graph-admin';
import { sendApiError } from '../../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    const db = await readDatabase();
    const base = getBaseGraphConfig();
    const merged = getMergedGraphConfig(db);

    event.json(200, {
      ok: true,
      data: {
        baseNodes: base.nodes,
        baseEdges: base.edges,
        customNodes: db.graphCustomMetrics,
        customEdges: db.graphCustomEdges,
        nodes: merged.nodes,
        edges: merged.edges
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
