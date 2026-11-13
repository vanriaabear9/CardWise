import type { SQLiteDatabase } from 'expo-sqlite';

import { AVATARS, DEFAULT_AVATAR_ID, DEFAULT_PLAYER_NAME, MAX_PLAYER_NAME_LENGTH } from '@/constants/avatars';
import type { PlayerProfile, ProfileInput } from '@/types';
import { nowIso } from '@/utils/time';

import { notifyDataChanged } from './dataEvents';
import { ValidationError, requireText } from './errors';

/*
 * The local player profile: one row (id = 1) in user_profile.
 * Only a display name and a built-in avatar. No email, password, or other personal data.
 */

interface ProfileRow {
  display_name: string;
  avatar_id: string;
  updated_at: string;
}

/** The saved profile, or the defaults if none has been saved yet. */
export async function getProfile(db: SQLiteDatabase): Promise<PlayerProfile> {
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT display_name, avatar_id, updated_at FROM user_profile WHERE id = 1',
  );
  if (!row) {
    return { displayName: DEFAULT_PLAYER_NAME, avatarId: DEFAULT_AVATAR_ID, isDefault: true, updatedAt: null };
  }
  return {
    displayName: row.display_name,
    // An unknown avatar id (e.g. removed in a later version) falls back to the default.
    avatarId: AVATARS.some((a) => a.id === row.avatar_id) ? row.avatar_id : DEFAULT_AVATAR_ID,
    isDefault: false,
    updatedAt: row.updated_at,
  };
}

/** Saves the display name and avatar (creates the profile the first time). */
export async function saveProfile(db: SQLiteDatabase, input: ProfileInput): Promise<void> {
  const displayName = requireText(input.displayName, 'Display name', MAX_PLAYER_NAME_LENGTH);
  if (!AVATARS.some((a) => a.id === input.avatarId)) {
    throw new ValidationError('Please choose one of the available avatars.');
  }
  await db.runAsync(
    `INSERT INTO user_profile (id, display_name, avatar_id, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       avatar_id = excluded.avatar_id,
       updated_at = excluded.updated_at`,
    [displayName, input.avatarId, nowIso()],
  );
  notifyDataChanged();
}
