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
        exportedAt: new Date().toISOString(),
        base,
        custom: {
          metrics: db.graphCustomMetrics,
          edges: db.graphCustomEdges
        },
        merged,
        importTemplate: {
          mode: 'append',
          metrics: db.graphCustomMetrics.map((metric) => ({
            id: metric.id,
            label: metric.label,
            domain: metric.domain,
            tier: metric.tier,
            x: metric.x,
            y: metric.y,
            description: metric.description
          })),
          edges: db.graphCustomEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            direction: edge.direction,
            effectStrength: edge.effectStrength,
            type: edge.type,
            description: edge.description
          }))
        }
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
