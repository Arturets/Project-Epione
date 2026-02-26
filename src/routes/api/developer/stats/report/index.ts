import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { readDatabase } from '../../../../../lib/db';
import { getEventBreakdown, getInterventionsBreakdown, getKpis, getMetricsBreakdown, getPageTraffic, getUserCohorts } from '../../../../../lib/developer-stats';
import { parseDateRange } from '../../../../../lib/events';
import { parseJsonBody, sendApiError } from '../../../../../lib/http';
import { parseDeveloperReportPayload } from '../../../../../lib/validation';

export const onPost: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);
    const payload = parseDeveloperReportPayload(await parseJsonBody(event));
    const db = await readDatabase();

    const window = resolvePeriodWindow(payload.period, event.url.searchParams);
    const report = {
      generatedAt: new Date().toISOString(),
      period: payload.period,
      sections: payload.sections,
      kpis: payload.sections.includes('kpis') || payload.sections.includes('KPI Summary') ? getKpis(db, window) : null,
      eventBreakdown:
        payload.sections.includes('events') || payload.sections.includes('Event Breakdown Table') ? getEventBreakdown(db, window) : null,
      metricsBreakdown:
        payload.sections.includes('metrics') || payload.sections.includes('Top Metrics Logged') ? getMetricsBreakdown(db, window) : null,
      interventionsBreakdown:
        payload.sections.includes('interventions') || payload.sections.includes('Top Interventions') ? getInterventionsBreakdown(db, window) : null,
      pageTraffic:
        payload.sections.includes('page_traffic') || payload.sections.includes('Page Traffic') ? getPageTraffic(db, window) : null,
      cohorts: payload.sections.includes('cohorts') || payload.sections.includes('User Cohorts') ? getUserCohorts(db, window) : null
    };

    if (payload.format === 'csv') {
      const csv = buildCsv(report);
      event.headers.set('Content-Type', 'text/csv; charset=utf-8');
      event.headers.set('Content-Disposition', 'attachment; filename="developer-report.csv"');
      event.send(200, csv);
      return;
    }

    if (payload.format === 'pdf') {
      const pseudoPdf = `%PDF-1.1\n1 0 obj\n<< /Type /Catalog >>\nendobj\n2 0 obj\n<< /Length 44 >>\nstream\nDeveloper report generated in JSON fallback mode\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
      event.headers.set('Content-Type', 'application/pdf');
      event.headers.set('Content-Disposition', 'attachment; filename="developer-report.pdf"');
      event.send(200, pseudoPdf);
      return;
    }

    event.json(200, {
      ok: true,
      data: report
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

function resolvePeriodWindow(period: string, searchParams: URLSearchParams) {
  if (period === 'last_24h') {
    return parseDateRange(searchParams, { hours: 24 });
  }

  if (period === 'last_30d') {
    return parseDateRange(searchParams, { days: 30 });
  }

  return parseDateRange(searchParams, { days: 7 });
}

function buildCsv(report: Record<string, unknown>) {
  const rows = [
    ['section', 'payload'],
    ...Object.entries(report).map(([key, value]) => [key, JSON.stringify(value ?? null)])
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}
