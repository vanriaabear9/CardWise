# database/

CardWise's **offline local storage**, built on [Expo SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/).
Everything is stored on the device in `cardwise.db`. No internet or backend is needed.

| File | Purpose |
|---|---|
| `database.ts` | Database name and `initializeDatabase()` (enables WAL + foreign keys, runs migrations). Called once at app start by `<SQLiteProvider>` in `src/app/_layout.tsx`. |
| `schema.ts` | `CREATE TABLE` / `CREATE INDEX` statements. |
| `migrations.ts` | Versioned migrations tracked with `PRAGMA user_version`. |
| `seed.ts` | Built-in topics for "Explore Topics" (inserted once by migration 2). |
| `selfTest.ts` | Development-only test of every operation, on a separate `cardwise-selftest.db`. |

## Tables

```
topics 1 ──< terms 1 ──< descriptions        (ON DELETE CASCADE)
topics 1 ──< game_history                    (ON DELETE SET NULL)
game_history 1 ──< game_history_answers      (ON DELETE CASCADE)
```

- **topics**: `id, title, description, category, is_builtin, created_at, updated_at`
- **terms**: `id, topic_id → topics, term_text, position`
- **descriptions**: `id, term_id → terms, description_text, position` (a term can have many)
- **game_history**: `id, game_uid (unique), topic_id → topics (nullable), topic_title, score, total_questions,
  correct_matches, incorrect_attempts, duration_ms, started_at, completed_at`.
  `score` = first-try points. Columns added in v3 are NULL for older rows ("not recorded").
- **game_history_answers** (v3): `id, game_id → game_history, position, term_position, term_text,
  description_text, first_attempt_term_text, first_attempt_correct, attempts`.
  Text **snapshots** of what was played, so past games stay accurate after a topic is edited or deleted.

A finished game and its answers are saved together in one transaction by
`saveCompletedGame()`; saving the same `game_uid` again returns the existing record (no duplicates).

## Migrations

| Version | Change |
| --- | --- |
| 1 | Create topics, terms, descriptions, game_history |
| 2 | Insert the built-in topics |
| 3 | Add full game results + `game_history_answers` (adds only; keeps existing data) |

## Changing the schema later

Never edit a migration that has already shipped. Add a new entry to `MIGRATIONS` in
`migrations.ts` with the next version number; it will run once on every device.

## Reading and writing data

Screens don't write SQL. They use the functions in `src/services/` (`topicService.ts`,
`gameHistoryService.ts`), usually through the hooks in `src/hooks/`.
