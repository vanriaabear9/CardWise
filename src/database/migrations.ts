import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_V1_STATEMENTS, SCHEMA_V3_STATEMENTS } from './schema';
import { seedBuiltinTopics } from './seed';

/**
 * Versioned database migrations.
 *
 * The database stores its current version in SQLite's built-in `PRAGMA user_version`
 * (0 for a brand-new database). On startup, every migration with a higher version
 * runs once, in order, and the stored version is updated.
 *
 * RULES for future changes:
 * - Never edit or remove a migration that has already shipped; users' databases already ran it.
 * - To change the schema, ADD a new migration with the next version number.
 */
export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'Create topics, terms, descriptions, and game_history tables',
    up: async (db) => {
      for (const statement of SCHEMA_V1_STATEMENTS) {
        await db.execAsync(statement);
      }
    },
  },
  {
    version: 2,
    name: 'Insert built-in topics',
    up: seedBuiltinTopics,
  },
  {
    version: 3,
    name: 'Add full game results and answer snapshots to game history',
    up: async (db) => {
      for (const statement of SCHEMA_V3_STATEMENTS) {
        await db.execAsync(statement);
      }
    },
  },
];

export const LATEST_DATABASE_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Reads the database's stored schema version. */
export async function getDatabaseVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/**
 * Runs all pending migrations. Each migration and its version bump run in one
 * transaction: if anything fails, that migration is fully rolled back and the
 * version is not changed, so it will be retried on the next start.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  assertMigrationsAreSequential();

  const currentVersion = await getDatabaseVersion(db);

  if (currentVersion > LATEST_DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than this app supports (${LATEST_DATABASE_VERSION}).`,
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }
    try {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        // PRAGMA can't take ? parameters. `version` is a trusted integer from this file, not user input.
        await db.execAsync(`PRAGMA user_version = ${Math.trunc(migration.version)}`);
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Migration ${migration.version} ("${migration.name}") failed: ${reason}`);
    }
  }
}

/** Guards against mistakes like duplicate or skipped version numbers. */
function assertMigrationsAreSequential(): void {
  MIGRATIONS.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migrations must be numbered 1, 2, 3, ... Found version ${migration.version} at position ${index + 1}.`,
      );
    }
  });
}
