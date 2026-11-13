import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import {
  addDescription,
  addTerm,
  createTopic,
  deleteDescription,
  deleteTerm,
  deleteTopic,
  getAllTopics,
  getBuiltinTopics,
  getTopicWithTerms,
  getUserTopics,
  updateDescription,
  updateTerm,
  updateTopic,
} from '@/services/topicService';
import { addGameResult, getRecentGameResults } from '@/services/gameHistoryService';
import { ValidationError, getErrorMessage } from '@/services/errors';

import { initializeDatabase } from './database';
import { LATEST_DATABASE_VERSION, getDatabaseVersion, runMigrations } from './migrations';
import { BUILTIN_TOPICS } from './seed';

/**
 * DEVELOPMENT-ONLY database self-test.
 *
 * Runs every database operation against a SEPARATE file (cardwise-selftest.db),
 * so the real app data in cardwise.db is never touched.
 * Results are printed to the terminal running `npx expo start`.
 *
 * Persistence check: the first run saves a marker topic and does not delete it.
 * After you fully close and reopen the app, the next run finds it and reports PASS.
 */

const SELF_TEST_DATABASE = 'cardwise-selftest.db';
const PERSISTENCE_MARKER_TITLE = 'Persistence marker';
const TEST_TOPIC_PREFIX = '[self-test]';

interface CheckResult {
  ok: boolean;
  name: string;
  detail?: string;
}

export interface SelfTestReport {
  passed: number;
  failed: number;
  results: CheckResult[];
  persistence: 'verified' | 'first-run';
}

export async function runDatabaseSelfTest(
  openDatabase: (name: string) => Promise<SQLiteDatabase> = openDatabaseAsync,
): Promise<SelfTestReport> {
  const results: CheckResult[] = [];
  const check = (name: string, ok: boolean, detail?: string) => {
    results.push({ ok, name, detail });
  };
  let persistence: SelfTestReport['persistence'] = 'first-run';
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabase(SELF_TEST_DATABASE);

    // 1. Initialization ------------------------------------------------------
    await initializeDatabase(db);
    const fk = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    check('Foreign keys are enabled', fk?.foreign_keys === 1);
    check(
      'Schema is at the latest version',
      (await getDatabaseVersion(db)) === LATEST_DATABASE_VERSION,
      `version ${await getDatabaseVersion(db)}`,
    );
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('topics','terms','descriptions','game_history')",
    );
    check('All 4 tables exist', tables.length === 4);

    // 2. Built-in topics are seeded exactly once ------------------------------
    const builtinCountBefore = (await getBuiltinTopics(db)).length;
    await initializeDatabase(db); // simulate an app restart
    await runMigrations(db);
    const builtins = await getBuiltinTopics(db);
    check(
      'Built-in topics inserted once (no duplicates after restart)',
      builtinCountBefore === BUILTIN_TOPICS.length && builtins.length === BUILTIN_TOPICS.length,
      `${builtins.length} built-in topics`,
    );
    check(
      'Built-in topics have their terms',
      builtins.every((topic) => topic.cardCount > 0),
    );

    // 3. Persistence across app restarts --------------------------------------
    const marker = (await getUserTopics(db)).find((t) => t.title === PERSISTENCE_MARKER_TITLE);
    if (marker) {
      persistence = 'verified';
      check('Data persisted from a previous app launch', true, `saved ${marker.createdAt}`);
    } else {
      await createTopic(db, {
        title: PERSISTENCE_MARKER_TITLE,
        description: 'Kept on purpose to verify data survives app restarts.',
      });
    }

    // Clean up leftovers if a previous run crashed halfway.
    for (const leftover of (await getUserTopics(db)).filter((t) => t.title.startsWith(TEST_TOPIC_PREFIX))) {
      await deleteTopic(db, leftover.id);
    }

    // 4. Create a topic with 2 terms × 2 descriptions (one transaction) ------
    const topicId = await createTopic(db, {
      title: `${TEST_TOPIC_PREFIX} Planets`,
      description: 'Test topic',
      category: 'Science',
      terms: [
        { termText: 'Mars', descriptions: ['The red planet.', 'Fourth planet from the Sun.'] },
        { termText: 'Jupiter', descriptions: ['The largest planet.', 'A gas giant.'] },
      ],
    });
    let topic = await getTopicWithTerms(db, topicId);
    check('Created topic can be retrieved', topic !== null);
    check(
      'Topic has 2 terms in the right order',
      topic?.terms.map((t) => t.termText).join(',') === 'Mars,Jupiter',
    );
    check(
      'Each term has its own 2 descriptions in order',
      topic?.terms[0].descriptions.map((d) => d.descriptionText).join('|') ===
        'The red planet.|Fourth planet from the Sun.' &&
        topic?.terms[1].descriptions.map((d) => d.descriptionText).join('|') ===
          'The largest planet.|A gas giant.',
    );
    check(
      'Descriptions point to the correct term',
      !!topic && topic.terms.every((term) => term.descriptions.every((d) => d.termId === term.id)),
    );

    // 5. Explore vs. My Topics separation -------------------------------------
    const userTopics = await getUserTopics(db);
    check('New topic appears in My Topics', userTopics.some((t) => t.id === topicId));
    check(
      'New topic does NOT appear in Explore Topics',
      !(await getBuiltinTopics(db)).some((t) => t.id === topicId),
    );
    check(
      'Card count is correct',
      userTopics.find((t) => t.id === topicId)?.cardCount === 2,
    );
    check('getAllTopics includes both kinds', (await getAllTopics(db)).length === builtins.length + userTopics.length);

    // 6. Updates ---------------------------------------------------------------
    await updateTopic(db, topicId, { title: `${TEST_TOPIC_PREFIX} Solar System` });
    const marsId = topic!.terms[0].id;
    await updateTerm(db, marsId, 'Mars (planet)');
    await updateDescription(db, topic!.terms[0].descriptions[0].id, 'Known as the red planet.');
    const saturnId = await addTerm(db, topicId, 'Saturn', ['Has bright rings.']);
    await addDescription(db, saturnId, 'Sixth planet from the Sun.');
    topic = await getTopicWithTerms(db, topicId);
    check('Topic title updated', topic?.title === `${TEST_TOPIC_PREFIX} Solar System`);
    check('Term text updated', topic?.terms[0].termText === 'Mars (planet)');
    check('Description updated', topic?.terms[0].descriptions[0].descriptionText === 'Known as the red planet.');
    check(
      'Added term goes last with its 2 descriptions',
      topic?.terms[2].termText === 'Saturn' && topic?.terms[2].descriptions.length === 2,
    );

    // 7. Deletes (with cascade) -----------------------------------------------
    await deleteDescription(db, topic!.terms[1].descriptions[0].id);
    const jupiterId = topic!.terms[1].id;
    await deleteTerm(db, marsId);
    topic = await getTopicWithTerms(db, topicId);
    check('Description deleted', topic?.terms.find((t) => t.id === jupiterId)?.descriptions.length === 1);
    const orphanDescriptions = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM descriptions WHERE term_id = ?',
      [marsId],
    );
    check('Deleting a term deletes its descriptions', topic?.terms.length === 2 && orphanDescriptions?.n === 0);

    const gameId = await addGameResult(db, {
      topicId,
      topicTitle: topic!.title,
      score: 2,
      totalQuestions: 2,
    });
    await deleteTopic(db, topicId);
    const leftoverTerms = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM terms WHERE topic_id = ?',
      [topicId],
    );
    const leftoverDescriptions = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM descriptions d LEFT JOIN terms t ON t.id = d.term_id WHERE t.id IS NULL',
    );
    check('Deleted topic is gone', (await getTopicWithTerms(db, topicId)) === null);
    check(
      'Deleting a topic deletes its terms and descriptions',
      leftoverTerms?.n === 0 && leftoverDescriptions?.n === 0,
    );
    const game = (await getRecentGameResults(db, 50)).find((g) => g.id === gameId);
    check(
      'Game history keeps the record (topic_id = NULL, title preserved)',
      game?.topicId === null && game?.topicTitle === `${TEST_TOPIC_PREFIX} Solar System`,
    );
    await db.runAsync('DELETE FROM game_history WHERE id = ?', [gameId]);

    // 8. Safety: rollback, validation, SQL injection ---------------------------
    const countBefore = (await getAllTopics(db)).length;
    try {
      await db.withTransactionAsync(async () => {
        await db!.runAsync(
          "INSERT INTO topics (title, is_builtin, created_at, updated_at) VALUES ('rollback test', 0, 'x', 'x')",
        );
        throw new Error('simulated failure');
      });
    } catch {
      // expected
    }
    check('Failed transaction is rolled back', (await getAllTopics(db)).length === countBefore);

    let rejected = false;
    try {
      await createTopic(db, { title: '   ' });
    } catch (error) {
      rejected = error instanceof ValidationError;
    }
    check('Empty title is rejected', rejected);

    const nastyTitle = `${TEST_TOPIC_PREFIX} x'); DROP TABLE topics; --`;
    const nastyId = await createTopic(db, { title: nastyTitle });
    const nasty = await getTopicWithTerms(db, nastyId);
    check('SQL injection attempt is stored as plain text', nasty?.title === nastyTitle);
    await deleteTopic(db, nastyId);

    let fkRejected = false;
    try {
      await db.runAsync('INSERT INTO terms (topic_id, term_text, position) VALUES (?, ?, 0)', [999999, 'orphan']);
    } catch {
      fkRejected = true;
    }
    check('Foreign keys block terms without a topic', fkRejected);
  } catch (error) {
    check('Self-test ran without crashing', false, getErrorMessage(error));
  } finally {
    await db?.closeAsync().catch(() => undefined);
  }

  const failed = results.filter((r) => !r.ok).length;
  const report: SelfTestReport = { passed: results.length - failed, failed, results, persistence };
  printReport(report);
  return report;
}

function printReport(report: SelfTestReport): void {
  const lines = report.results.map(
    (r) => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`,
  );
  const persistenceLine =
    report.persistence === 'verified'
      ? 'Persistence: VERIFIED (data survived an app restart)'
      : 'Persistence: first run — fully close and reopen the app, then check this log again';
  const summary = `${report.failed === 0 ? '✅' : '❌'} ${report.passed} passed, ${report.failed} failed`;
  console.log(['', '===== CardWise database self-test =====', ...lines, persistenceLine, summary, ''].join('\n'));
}
