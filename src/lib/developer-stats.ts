import { AppDatabase, EventRecord, EventType, UserRole } from './types';
import { countBy, eventInRange, eventMetadataString, percentage, trend } from './events';

const ONLINE_WINDOW_MS = 30 * 60 * 1000;

type TimeWindow = { startDate: Date; endDate: Date };

export function getKpis(db: AppDatabase, window: TimeWindow) {
  const events = selectEvents(db, window);
  const previousEvents = selectEvents(db, previousWindow(window));

  const metricsLogged = byType(events, 'metric_logged').length;
  const metricsLoggedPrev = byType(previousEvents, 'metric_logged').length;

  const interventionsViewed = byType(events, 'intervention_viewed').length;
  const interventionsViewedPrev = byType(previousEvents, 'intervention_viewed').length;

  const snapshotsSaved = byType(events, 'snapshot_saved').length;
  const snapshotsSavedPrev = byType(previousEvents, 'snapshot_saved').length;

  const pageVisits = byType(events, 'page_visited').length;
  const pageVisitsPrev = byType(previousEvents, 'page_visited').length;

  const appleSyncEvents = byType(events, 'applehealth_sync');
  const appleSyncSuccess = appleSyncEvents.filter((entry) => eventMetadataString(entry.metadata, 'status') !== 'failed').length;
  const appleSyncFailed = appleSyncEvents.filter((entry) => eventMetadataString(entry.metadata, 'status') === 'failed').length;

  const selected = byType(events, 'intervention_selected')
    .map((entry) => eventMetadataString(entry.metadata, 'interventionId'))
    .filter((item): item is string => Boolean(item));

  const selectedCounts = countBy(selected);
  const mostSelected = selectedCounts[0] ?? null;

  return {
    usersOnline: usersOnline(db),
    metricsLogged: {
      value: metricsLogged,
      trend: trend(metricsLogged, metricsLoggedPrev)
    },
    interventionsViewed: {
      value: interventionsViewed,
      trend: trend(interventionsViewed, interventionsViewedPrev),
      mostSelected
    },
    snapshotsSaved: {
      value: snapshotsSaved,
      trend: trend(snapshotsSaved, snapshotsSavedPrev)
    },
    appleHealthSyncs: {
      success: appleSyncSuccess,
      failed: appleSyncFailed
    },
    pageVisits: {
      value: pageVisits,
      trend: trend(pageVisits, pageVisitsPrev)
    }
  };
}

export function getEventBreakdown(db: AppDatabase, window: TimeWindow) {
  const events = selectEvents(db, window);
  const previousEvents = selectEvents(db, previousWindow(window));

  const total = events.length;
  const eventTypes = countBy(events.map((entry) => entry.eventType));
  return eventTypes.map(({ key, count }) => {
    const previousCount = previousEvents.filter((entry) => entry.eventType === key).length;
    const direction = trend(count, previousCount);

    return {
      eventType: key,
      count,
      percentage: percentage(count, total),
      trend: direction
    };
  });
}

export function getMetricsBreakdown(db: AppDatabase, window: TimeWindow) {
  const events = byType(selectEvents(db, window), 'metric_logged');
  const metricNames = events
    .map((entry) => eventMetadataString(entry.metadata, 'metricName'))
    .filter((item): item is string => Boolean(item));

  const total = metricNames.length;
  return countBy(metricNames).map(({ key, count }) => ({
    metricName: key,
    count,
    percentage: percentage(count, total)
  }));
}

export function getInterventionsBreakdown(db: AppDatabase, window: TimeWindow) {
  const events = selectEvents(db, window);
  const views = byType(events, 'intervention_viewed');
  const selected = byType(events, 'intervention_selected');

  const ids = new Set<string>();
  for (const event of [...views, ...selected]) {
    const id = eventMetadataString(event.metadata, 'interventionId');
    if (id) ids.add(id);
  }

  const rows: Array<{ interventionId: string; views: number; selected: number; conversion: number }> = [];

  for (const interventionId of ids) {
    const viewCount = views.filter((entry) => eventMetadataString(entry.metadata, 'interventionId') === interventionId).length;
    const selectedCount = selected.filter((entry) => eventMetadataString(entry.metadata, 'interventionId') === interventionId).length;
    rows.push({
      interventionId,
      views: viewCount,
      selected: selectedCount,
      conversion: viewCount > 0 ? Number(((selectedCount / viewCount) * 100).toFixed(1)) : 0
    });
  }

  return rows.sort((a, b) => b.views - a.views);
}

export function getPageTraffic(db: AppDatabase, window: TimeWindow) {
  const events = byType(selectEvents(db, window), 'page_visited');
  const routes = events.map((entry) => eventMetadataString(entry.metadata, 'route')).filter((item): item is string => Boolean(item));
  const total = routes.length;

  return countBy(routes).map(({ key, count }) => ({
    route: key,
    count,
    percentage: percentage(count, total)
  }));
}

export function getUserCohorts(db: AppDatabase, window: TimeWindow) {
  const events = selectEvents(db, window);
  const sessionsByUser = new Map<string, number>();

  for (const session of db.sessions) {
    sessionsByUser.set(session.userId, (sessionsByUser.get(session.userId) ?? 0) + 1);
  }

  const byRole = new Map<UserRole, { userIds: Set<string>; sessionTotal: number }>();

  for (const event of events) {
    const user = db.users.find((entry) => entry.id === event.userId);
    const role = user?.role ?? 'customer';
    const entry = byRole.get(role) ?? { userIds: new Set<string>(), sessionTotal: 0 };

    if (!entry.userIds.has(event.userId)) {
      entry.userIds.add(event.userId);
      entry.sessionTotal += sessionsByUser.get(event.userId) ?? 0;
    }

    byRole.set(role, entry);
  }

  return Array.from(byRole.entries()).map(([role, value]) => ({
    role,
    users: value.userIds.size,
    avgSessions: value.userIds.size > 0 ? Number((value.sessionTotal / value.userIds.size).toFixed(1)) : 0
  }));
}

function selectEvents(db: AppDatabase, window: TimeWindow) {
  return db.events.filter((event) => eventInRange(event, window.startDate, window.endDate));
}

function byType(events: EventRecord[], type: EventType) {
  return events.filter((entry) => entry.eventType === type);
}

function usersOnline(db: AppDatabase) {
  const now = Date.now();
  return db.sessions.filter((session) => {
    const lastSeen = new Date(session.lastSeenAt).getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    return Number.isFinite(lastSeen) && Number.isFinite(expiresAt) && expiresAt > now && now - lastSeen <= ONLINE_WINDOW_MS;
  }).length;
}

function previousWindow(window: TimeWindow): TimeWindow {
  const duration = window.endDate.getTime() - window.startDate.getTime();
  const endDate = new Date(window.startDate.getTime() - 1);
  const startDate = new Date(endDate.getTime() - duration);
  return { startDate, endDate };
}
