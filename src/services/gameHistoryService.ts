import type { SQLiteDatabase } from 'expo-sqlite';

import type { GameResult, NewGameResultInput } from '@/types';
import { nowIso } from '@/utils/time';

import { notifyDataChanged } from './dataEvents';
import { ValidationError, requireText } from './errors';

/*
 * Game history operations. The table is ready now; gameplay (a later phase)
 * will call addGameResult() when a game finishes.
 */

interface GameHistoryRow {
  id: number;
  topic_id: number | null;
  topic_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

function toGameResult(row: GameHistoryRow): GameResult {
  return {
    id: row.id,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    score: row.score,
    totalQuestions: row.total_questions,
    completedAt: row.completed_at,
  };
}

/** Records a finished game. Returns the new record's id. */
export async function addGameResult(db: SQLiteDatabase, input: NewGameResultInput): Promise<number> {
  const topicTitle = requireText(input.topicTitle, 'Topic title', 100);
  const { score, totalQuestions } = input;

  if (!Number.isInteger(totalQuestions) || totalQuestions < 0) {
    throw new ValidationError('Total questions must be a whole number of 0 or more.');
  }
  if (!Number.isInteger(score) || score < 0 || score > totalQuestions) {
    throw new ValidationError('Score must be a whole number between 0 and the total questions.');
  }

  const result = await db.runAsync(
    `INSERT INTO game_history (topic_id, topic_title, score, total_questions, completed_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.topicId, topicTitle, score, totalQuestions, input.completedAt ?? nowIso()],
  );
  notifyDataChanged();
  return result.lastInsertRowId;
}

/** Most recent games first. */
export async function getRecentGameResults(db: SQLiteDatabase, limit = 10): Promise<GameResult[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const rows = await db.getAllAsync<GameHistoryRow>(
    `SELECT id, topic_id, topic_title, score, total_questions, completed_at
     FROM game_history
     ORDER BY completed_at DESC, id DESC
     LIMIT ?`,
    [safeLimit],
  );
  return rows.map(toGameResult);
}
