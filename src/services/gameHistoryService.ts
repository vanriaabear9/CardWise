import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  GameAnswer,
  GameResult,
  GameResultDetail,
  NewGameAnswerInput,
  NewGameResultInput,
} from '@/types';
import { nowIso } from '@/utils/time';

import { notifyDataChanged } from './dataEvents';
import { ValidationError, requireText } from './errors';
import { LIMITS } from './topicService';

/*
 * Game history operations. A finished game is saved once, together with a snapshot of
 * every description it contained (game_history + game_history_answers).
 */

interface GameHistoryRow {
  id: number;
  topic_id: number | null;
  topic_title: string;
  score: number;
  total_questions: number;
  correct_matches: number | null;
  incorrect_attempts: number | null;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string;
}

interface GameAnswerRow {
  id: number;
  term_position: number;
  term_text: string;
  description_text: string;
  first_attempt_term_text: string | null;
  first_attempt_correct: number | null;
  attempts: number | null;
}

const HISTORY_COLUMNS = `id, topic_id, topic_title, score, total_questions, correct_matches,
  incorrect_attempts, duration_ms, started_at, completed_at`;

function toGameResult(row: GameHistoryRow): GameResult {
  return {
    id: row.id,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    score: row.score,
    totalQuestions: row.total_questions,
    correctMatches: row.correct_matches,
    incorrectAttempts: row.incorrect_attempts,
    durationMs: row.duration_ms,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

function toGameAnswer(row: GameAnswerRow): GameAnswer {
  return {
    id: row.id,
    termPosition: row.term_position,
    termText: row.term_text,
    descriptionText: row.description_text,
    firstAttemptTermText: row.first_attempt_term_text,
    firstAttemptCorrect: row.first_attempt_correct === null ? null : row.first_attempt_correct === 1,
    attempts: row.attempts,
  };
}

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

function optionalCount(value: number | undefined, label: string): number | null {
  if (value === undefined) return null;
  if (!isCount(value)) {
    throw new ValidationError(`${label} must be a whole number of 0 or more.`);
  }
  return value;
}

function validateAnswer(answer: NewGameAnswerInput, index: number): NewGameAnswerInput {
  const label = `Answer ${index + 1}`;
  if (!isCount(answer.termPosition)) {
    throw new ValidationError(`${label}: term position must be a whole number of 0 or more.`);
  }
  if (answer.attempts !== null && !isCount(answer.attempts)) {
    throw new ValidationError(`${label}: attempts must be a whole number of 0 or more.`);
  }
  return {
    termPosition: answer.termPosition,
    termText: requireText(answer.termText, `${label} term`, LIMITS.termText),
    descriptionText: requireText(answer.descriptionText, `${label} description`, LIMITS.descriptionText),
    firstAttemptTermText: answer.firstAttemptTermText,
    firstAttemptCorrect: answer.firstAttemptCorrect,
    attempts: answer.attempts,
  };
}

async function findIdByGameUid(db: SQLiteDatabase, gameUid: string): Promise<number | null> {
  const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM game_history WHERE game_uid = ?', [gameUid]);
  return row?.id ?? null;
}

export interface SaveGameResult {
  id: number;
  /** true if this game had already been saved (nothing new was written). */
  alreadySaved: boolean;
}

/**
 * Saves a finished game and its answer snapshots in ONE transaction:
 * either everything is written, or nothing is.
 *
 * Calling this again with the same `gameUid` (a retry, a double tap, a re-render)
 * returns the existing record instead of creating a duplicate.
 */
export async function saveCompletedGame(db: SQLiteDatabase, input: NewGameResultInput): Promise<SaveGameResult> {
  const topicTitle = requireText(input.topicTitle, 'Topic title', LIMITS.topicTitle);
  const { score, totalQuestions } = input;

  if (!isCount(totalQuestions)) {
    throw new ValidationError('Total questions must be a whole number of 0 or more.');
  }
  if (!isCount(score) || score > totalQuestions) {
    throw new ValidationError('Score must be a whole number between 0 and the total questions.');
  }
  const correctMatches = optionalCount(input.correctMatches, 'Correct matches');
  if (correctMatches !== null && correctMatches > totalQuestions) {
    throw new ValidationError('Correct matches cannot be more than the total questions.');
  }
  const incorrectAttempts = optionalCount(input.incorrectAttempts, 'Incorrect attempts');
  const durationMs = input.durationMs === undefined ? null : Math.round(input.durationMs);
  if (durationMs !== null && !isCount(durationMs)) {
    throw new ValidationError('Duration must be 0 or more.');
  }
  const answers = (input.answers ?? []).map(validateAnswer);
  if (input.answers && answers.length !== totalQuestions) {
    throw new ValidationError('The answer list must contain every description in the game.');
  }
  const gameUid = input.gameUid?.trim() || null;

  // Already saved? Return the existing record.
  if (gameUid) {
    const existingId = await findIdByGameUid(db, gameUid);
    if (existingId !== null) return { id: existingId, alreadySaved: true };
  }

  let newId = 0;
  try {
    await db.withTransactionAsync(async () => {
      // Keep the topic link only if the topic still exists (otherwise NULL; the title snapshot remains).
      const result = await db.runAsync(
        `INSERT INTO game_history (
           game_uid, topic_id, topic_title, score, total_questions, correct_matches,
           incorrect_attempts, duration_ms, started_at, completed_at)
         VALUES (?, (SELECT id FROM topics WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gameUid,
          input.topicId,
          topicTitle,
          score,
          totalQuestions,
          correctMatches,
          incorrectAttempts,
          durationMs,
          input.startedAt ?? null,
          input.completedAt ?? nowIso(),
        ],
      );
      newId = result.lastInsertRowId;

      for (const [index, answer] of answers.entries()) {
        await db.runAsync(
          `INSERT INTO game_history_answers (
             game_id, position, term_position, term_text, description_text,
             first_attempt_term_text, first_attempt_correct, attempts)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            index,
            answer.termPosition,
            answer.termText,
            answer.descriptionText,
            answer.firstAttemptTermText,
            answer.firstAttemptCorrect === null ? null : answer.firstAttemptCorrect ? 1 : 0,
            answer.attempts,
          ],
        );
      }
    });
  } catch (error) {
    // Two saves of the same game raced: the other one won, so use its record.
    if (gameUid) {
      const existingId = await findIdByGameUid(db, gameUid);
      if (existingId !== null) return { id: existingId, alreadySaved: true };
    }
    throw error;
  }

  notifyDataChanged();
  return { id: newId, alreadySaved: false };
}

/** Records a finished game. Returns the record's id. */
export async function addGameResult(db: SQLiteDatabase, input: NewGameResultInput): Promise<number> {
  return (await saveCompletedGame(db, input)).id;
}

/** Most recent games first. */
export async function getRecentGameResults(db: SQLiteDatabase, limit = 10): Promise<GameResult[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const rows = await db.getAllAsync<GameHistoryRow>(
    `SELECT ${HISTORY_COLUMNS}
     FROM game_history
     ORDER BY completed_at DESC, id DESC
     LIMIT ?`,
    [safeLimit],
  );
  return rows.map(toGameResult);
}

/** Every saved game, most recent first. */
export async function getAllGameResults(db: SQLiteDatabase): Promise<GameResult[]> {
  const rows = await db.getAllAsync<GameHistoryRow>(
    `SELECT ${HISTORY_COLUMNS}
     FROM game_history
     ORDER BY completed_at DESC, id DESC`,
  );
  return rows.map(toGameResult);
}

/**
 * One saved game with its answer snapshots (in the topic's order at the time of playing).
 * Returns null if there is no such record.
 */
export async function getGameResultDetail(db: SQLiteDatabase, id: number): Promise<GameResultDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = await db.getFirstAsync<GameHistoryRow>(
    `SELECT ${HISTORY_COLUMNS} FROM game_history WHERE id = ?`,
    [id],
  );
  if (!row) return null;
  const answerRows = await db.getAllAsync<GameAnswerRow>(
    `SELECT id, term_position, term_text, description_text, first_attempt_term_text,
            first_attempt_correct, attempts
     FROM game_history_answers
     WHERE game_id = ?
     ORDER BY position ASC, id ASC`,
    [id],
  );
  return { ...toGameResult(row), answers: answerRows.map(toGameAnswer) };
}
