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

/** All statements for schema version 1, in the order they must run. */
export const SCHEMA_V1_STATEMENTS = [
  CREATE_TOPICS_TABLE,
  CREATE_TERMS_TABLE,
  CREATE_DESCRIPTIONS_TABLE,
  CREATE_GAME_HISTORY_TABLE,
  ...CREATE_INDEXES,
];
