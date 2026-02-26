import { mutateDatabase, readDatabase } from './db';
import { ensureInterventionVersionSeed } from './developer-interventions';

export async function ensureInterventionVersionsSeeded() {
  return mutateDatabase(async (db) => {
    if (!db.interventionVersions.length) {
      db.interventionVersions = ensureInterventionVersionSeed(db.interventionVersions);
    }
    return db.interventionVersions;
  });
}

export async function readInterventionVersions() {
  const db = await readDatabase();
  if (db.interventionVersions.length) {
    return db.interventionVersions;
  }

  return ensureInterventionVersionsSeeded();
}
