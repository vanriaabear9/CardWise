/**
 * CardWise database schema (version 1).
 *
 * Relationships:
 *   topics 1 ──< terms 1 ──< descriptions
 *   topics 1 ──< game_history (topic_id becomes NULL if the topic is deleted)
 *
 * Deleting a topic deletes its terms, and deleting a term deletes its descriptions
 * (ON DELETE CASCADE). This only works while `PRAGMA foreign_keys = ON`,
 * which initializeDatabase() enables on every app start.
 *
 * Timestamps are stored as ISO 8601 text in UTC, e.g. "2026-11-13T08:15:30.000Z".
 */

export const CREATE_TOPICS_TABLE = `
  CREATE TABLE IF NOT EXISTS topics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT    NOT NULL DEFAULT '',
    category    TEXT    NOT NULL DEFAULT 'General',
    is_builtin  INTEGER NOT NULL DEFAULT 0 CHECK (is_builtin IN (0, 1)),
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
  );`;

export const CREATE_TERMS_TABLE = `
  CREATE TABLE IF NOT EXISTS terms (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id  INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    term_text TEXT    NOT NULL CHECK (length(trim(term_text)) > 0),
    position  INTEGER NOT NULL DEFAULT 0
  );`;

export const CREATE_DESCRIPTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS descriptions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    term_id          INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    description_text TEXT    NOT NULL CHECK (length(trim(description_text)) > 0),
    position         INTEGER NOT NULL DEFAULT 0
  );`;

export const CREATE_GAME_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS game_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id        INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    topic_title     TEXT    NOT NULL,
    score           INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
    completed_at    TEXT    NOT NULL,
    CHECK (score <= total_questions)
  );`;

/** Indexes speed up the most common lookups (by parent id, ordered by position). */
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_topics_is_builtin ON topics(is_builtin);',
  'CREATE INDEX IF NOT EXISTS idx_terms_topic_position ON terms(topic_id, position);',
  'CREATE INDEX IF NOT EXISTS idx_descriptions_term_position ON descriptions(term_id, position);',
  'CREATE INDEX IF NOT EXISTS idx_game_history_topic ON game_history(topic_id);',
  'CREATE INDEX IF NOT EXISTS idx_game_history_completed_at ON game_history(completed_at);',
];

/**
 * Schema version 3 (Phase 6): full game results and answer snapshots.
 *
 * Only ADDS columns and a table, so existing rows are kept. Older rows get NULL in the
 * new columns, which the app shows as "not recorded".
 *
 *   game_history 1 ──< game_history_answers (deleted together)
 *
 * The answers table stores TEXT COPIES of the terms and descriptions (not ids), so a
 * game's review stays accurate even after the topic is edited or deleted.
 */
export const SCHEMA_V3_STATEMENTS = [
  // Unique id of a play-through: the same game can never be saved twice.
  'ALTER TABLE game_history ADD COLUMN game_uid TEXT;',
  'ALTER TABLE game_history ADD COLUMN started_at TEXT;',
  'ALTER TABLE game_history ADD COLUMN correct_matches INTEGER CHECK (correct_matches IS NULL OR correct_matches >= 0);',
  'ALTER TABLE game_history ADD COLUMN incorrect_attempts INTEGER CHECK (incorrect_attempts IS NULL OR incorrect_attempts >= 0);',
  'ALTER TABLE game_history ADD COLUMN duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0);',
  // NULLs don't clash in a UNIQUE index, so older rows without a game_uid are fine.
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_game_history_game_uid ON game_history(game_uid);',
  `CREATE TABLE IF NOT EXISTS game_history_answers (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id                 INTEGER NOT NULL REFERENCES game_history(id) ON DELETE CASCADE,
    position                INTEGER NOT NULL DEFAULT 0,
    term_position           INTEGER NOT NULL DEFAULT 0,
    term_text               TEXT    NOT NULL,
    description_text        TEXT    NOT NULL,
    first_attempt_term_text TEXT,
    first_attempt_correct   INTEGER CHECK (first_attempt_correct IS NULL OR first_attempt_correct IN (0, 1)),
    attempts                INTEGER CHECK (attempts IS NULL OR attempts >= 0)
  );`,
  'CREATE INDEX IF NOT EXISTS idx_game_history_answers_game ON game_history_answers(game_id, position);',
];

/**
 * Schema version 4 (Phase 7): favorites and the local player profile.
 *
 *   topics 1 ──o favorites (a favorite is removed automatically when its topic is deleted)
 *
 * Only ADDS tables; nothing existing changes.
 */
export const SCHEMA_V4_STATEMENTS = [
  // UNIQUE topic_id: a topic is either a favorite or not, never twice.
  `CREATE TABLE IF NOT EXISTS favorites (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id   INTEGER NOT NULL UNIQUE REFERENCES topics(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL
  );`,
  // Exactly one local profile row (id is always 1). No email, password, or other personal data.
  `CREATE TABLE IF NOT EXISTS user_profile (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    display_name TEXT    NOT NULL CHECK (length(trim(display_name)) > 0 AND length(display_name) <= 30),
    avatar_id    TEXT    NOT NULL,
    updated_at   TEXT    NOT NULL
  );`,
];

/**
 * Schema version 5: app settings (e.g. sound effects on/off), one row per setting.
 * A missing row means "use the default", so no rows are inserted here.
 */
export const SCHEMA_V5_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY NOT NULL,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
];

/** All statements for schema version 1, in the order they must run. */
export const SCHEMA_V1_STATEMENTS = [
  CREATE_TOPICS_TABLE,
  CREATE_TERMS_TABLE,
  CREATE_DESCRIPTIONS_TABLE,
  CREATE_GAME_HISTORY_TABLE,
  ...CREATE_INDEXES,
];
