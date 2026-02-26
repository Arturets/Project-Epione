import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type AppPostgresDb = PostgresJsDatabase<typeof schema>;

let dbClient: AppPostgresDb | null = null;
let sqlClient: postgres.Sql | null = null;

function requireDatabaseUrl() {
  const runtimeProcess = process as { env?: Record<string, string | undefined> };
  const databaseUrl = runtimeProcess.env?.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when using Postgres persistence.');
  }
  return databaseUrl;
}

export function getPostgresDb() {
  if (!dbClient) {
    const databaseUrl = requireDatabaseUrl();
    sqlClient = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
    dbClient = drizzle(sqlClient, { schema });
  }
  return dbClient;
}

export async function closePostgresDb() {
  if (sqlClient) {
    await sqlClient.end({ timeout: 5 });
    sqlClient = null;
    dbClient = null;
  }
}
