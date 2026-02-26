import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { getPostgresDb } from './persistence/client';
import { APP_STATE_KEY, appStateTable } from './persistence/schema';
import { AppDatabase, User, UserRole, UserTwoFactorSettings } from './types';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'health-db.json');

function readEnv(name: string) {
  const runtimeProcess = process as { env?: Record<string, string | undefined> };
  return runtimeProcess.env?.[name];
}

const DATABASE_URL = readEnv('DATABASE_URL')?.trim() ?? '';

const EMPTY_DB: AppDatabase = {
  users: [],
  sessions: [],
  authChallenges: [],
  metrics: [],
  userPreferences: [],
  snapshots: [],
  auditLogs: [],
  events: [],
  interventionVersions: [],
  graphCustomMetrics: [],
  graphCustomEdges: []
};

let writeChain = Promise.resolve();
let postgresInitPromise: Promise<void> | null = null;

type DatabaseBackend = 'postgres' | 'file';

function resolveBackend(): DatabaseBackend {
  const normalized = DATABASE_URL.toLowerCase();
  if (normalized.startsWith('postgres://') || normalized.startsWith('postgresql://')) {
    return 'postgres';
  }
  return 'file';
}

async function ensureDatabaseFile() {
  await mkdir(DB_DIR, { recursive: true });

  try {
    await readFile(DB_PATH, 'utf-8');
  } catch {
    await writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
  }
}

async function ensurePostgresState() {
  if (!postgresInitPromise) {
    postgresInitPromise = (async () => {
      const db = getPostgresDb();
      await db.execute(sql`
        create table if not exists app_state (
          key text primary key,
          data jsonb not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `);

      await db
        .insert(appStateTable)
        .values({
          key: APP_STATE_KEY,
          data: EMPTY_DB
        })
        .onConflictDoNothing();
    })();
  }

  await postgresInitPromise;
}

export async function readDatabase(): Promise<AppDatabase> {
  if (resolveBackend() === 'postgres') {
    await ensurePostgresState();
    const db = getPostgresDb();
    const rows = await db
      .select({
        data: appStateTable.data
      })
      .from(appStateTable)
      .where(eq(appStateTable.key, APP_STATE_KEY))
      .limit(1);

    if (!rows.length) {
      return structuredClone(EMPTY_DB);
    }

    return normalizeDatabase(rows[0].data);
  }

  await ensureDatabaseFile();
  const raw = await readFile(DB_PATH, 'utf-8');

  try {
    const parsed = JSON.parse(raw) as Partial<AppDatabase>;
    return normalizeDatabase(parsed);
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function normalizeDatabase(db: Partial<AppDatabase>): AppDatabase {
  return {
    users: normalizeUsers(db.users ?? []),
    sessions: db.sessions ?? [],
    authChallenges: db.authChallenges ?? [],
    metrics: db.metrics ?? [],
    userPreferences: db.userPreferences ?? [],
    snapshots: db.snapshots ?? [],
    auditLogs: db.auditLogs ?? [],
    events: db.events ?? [],
    interventionVersions: db.interventionVersions ?? [],
    graphCustomMetrics: db.graphCustomMetrics ?? [],
    graphCustomEdges: db.graphCustomEdges ?? []
  };
}

function normalizeUsers(users: User[]): User[] {
  return users.map((user) => ({
    ...user,
    oauthProviders: user.oauthProviders ?? {},
    twoFactor: normalizeTwoFactorSettings(user.twoFactor),
    role: normalizeRole(user.role),
    adminApiKey: user.adminApiKey ?? null
  }));
}

function normalizeTwoFactorSettings(settings: User['twoFactor'] | undefined): UserTwoFactorSettings {
  return {
    enabled: Boolean(settings?.enabled),
    secret: settings?.secret ?? null,
    pendingSecret: settings?.pendingSecret ?? null,
    enabledAt: settings?.enabledAt ?? null,
    recoveryCodes: Array.isArray(settings?.recoveryCodes)
      ? settings.recoveryCodes.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  };
}

function normalizeRole(role: User['role'] | undefined): UserRole {
  if (role === 'admin' || role === 'coach' || role === 'customer') {
    return role;
  }
  return 'customer';
}

async function writeDatabase(db: AppDatabase) {
  if (resolveBackend() === 'postgres') {
    await ensurePostgresState();
    const postgresDb = getPostgresDb();
    await postgresDb
      .update(appStateTable)
      .set({
        data: db,
        updatedAt: new Date()
      })
      .where(eq(appStateTable.key, APP_STATE_KEY));
    return;
  }

  await ensureDatabaseFile();
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function mutateDatabase<T>(mutator: (db: AppDatabase) => Promise<T> | T): Promise<T> {
  const next = writeChain.then(async () => {
    if (resolveBackend() === 'postgres') {
      await ensurePostgresState();
      const db = getPostgresDb();

      return db.transaction(async (tx) => {
        await tx.execute(sql`select key from app_state where key = ${APP_STATE_KEY} for update`);

        const rows = await tx
          .select({
            data: appStateTable.data
          })
          .from(appStateTable)
          .where(eq(appStateTable.key, APP_STATE_KEY))
          .limit(1);

        const state = rows.length ? normalizeDatabase(rows[0].data) : structuredClone(EMPTY_DB);
        const result = await mutator(state);

        await tx
          .update(appStateTable)
          .set({
            data: state,
            updatedAt: new Date()
          })
          .where(eq(appStateTable.key, APP_STATE_KEY));

        return result;
      });
    }

    const fileDb = await readDatabase();
    const result = await mutator(fileDb);
    await writeDatabase(fileDb);
    return result;
  });

  writeChain = next.then(
    () => undefined,
    () => undefined
  );

  return next;
}

export function getDatabasePath() {
  if (resolveBackend() === 'postgres') {
    return DATABASE_URL;
  }
  return DB_PATH;
}
