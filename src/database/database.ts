import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

/** File name of the app's local database (stored privately on the device). */
export const DATABASE_NAME = 'cardwise.db';

/**
 * Prepares the database. Runs once every time the app starts
 * (passed to <SQLiteProvider onInit>, before any screen renders).
 *
 * 1. WAL journal mode: faster, safer writes (recommended by Expo).
 * 2. Foreign keys ON: required for ON DELETE CASCADE / SET NULL.
 *    SQLite turns this OFF by default and it must be set per connection,
 *    outside of any transaction — so it is done here, first.
 * 3. Run pending migrations (create tables, insert built-in topics).
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    const foreignKeys = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    if (foreignKeys?.foreign_keys !== 1) {
      throw new Error('Foreign key constraints could not be enabled.');
    }

    await runMigrations(db);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not initialize the CardWise database. ${reason}`);
  }
}
