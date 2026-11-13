import type { SQLiteDatabase } from 'expo-sqlite';

import type { TopicSummary } from '@/types';
import { nowIso } from '@/utils/time';

import { notifyDataChanged } from './dataEvents';
import { NotFoundError, requireId } from './errors';
import { SUMMARY_SELECT, toTopicSummary, type TopicSummaryRow } from './topicService';

/*
 * Favorite topics (built-in or user-created), stored in the `favorites` table.
 * Every read JOINs `topics`, so a favorite of a deleted topic can never show up.
 */

/** Favorite topics, most recently favorited first. */
export async function getFavoriteTopics(db: SQLiteDatabase): Promise<TopicSummary[]> {
  const rows = await db.getAllAsync<TopicSummaryRow>(
    `${SUMMARY_SELECT}
     JOIN favorites f ON f.topic_id = t.id
     ORDER BY f.created_at DESC, f.id DESC`,
  );
  return rows.map(toTopicSummary);
}

/** Ids of all favorite topics (to show the filled heart on topic cards). */
export async function getFavoriteTopicIds(db: SQLiteDatabase): Promise<number[]> {
  const rows = await db.getAllAsync<{ topic_id: number }>(
    'SELECT f.topic_id FROM favorites f JOIN topics t ON t.id = f.topic_id ORDER BY f.created_at DESC, f.id DESC',
  );
  return rows.map((row) => row.topic_id);
}

/** Adds or removes a topic from favorites. Doing the same thing twice is harmless. */
export async function setFavorite(db: SQLiteDatabase, topicId: number, favorite: boolean): Promise<void> {
  requireId(topicId, 'topic');
  if (favorite) {
    const topic = await db.getFirstAsync<{ id: number }>('SELECT id FROM topics WHERE id = ?', [topicId]);
    if (!topic) {
      throw new NotFoundError('This topic no longer exists.');
    }
    await db.runAsync('INSERT OR IGNORE INTO favorites (topic_id, created_at) VALUES (?, ?)', [topicId, nowIso()]);
  } else {
    await db.runAsync('DELETE FROM favorites WHERE topic_id = ?', [topicId]);
  }
  notifyDataChanged();
}
