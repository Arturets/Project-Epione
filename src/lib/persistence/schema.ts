import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { AppDatabase } from '../types';

export const APP_STATE_KEY = 'primary';

export const appStateTable = pgTable('app_state', {
  key: text('key').primaryKey(),
  data: jsonb('data').$type<AppDatabase>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
