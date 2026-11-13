import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from '@/utils/time';

import { notifyDataChanged } from './dataEvents';

/*
 * App settings stored in the `app_settings` table (key → text value).
 * A setting that was never changed has no row, and its default is used.
 */

const SOUND_EFFECTS_KEY = 'sound_effects_enabled';

/** Sound effects are ON unless the player turned them off. */
export const DEFAULT_SOUND_EFFECTS_ENABLED = true;

async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, nowIso()],
  );
  notifyDataChanged();
}

export async function getSoundEffectsEnabled(db: SQLiteDatabase): Promise<boolean> {
  const value = await getSetting(db, SOUND_EFFECTS_KEY);
  if (value === '1') return true;
  if (value === '0') return false;
  return DEFAULT_SOUND_EFFECTS_ENABLED; // not set yet (or unreadable): use the default
}

export async function setSoundEffectsEnabled(db: SQLiteDatabase, enabled: boolean): Promise<void> {
  await setSetting(db, SOUND_EFFECTS_KEY, enabled ? '1' : '0');
}
