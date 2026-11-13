import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Description,
  NewTermInput,
  NewTopicInput,
  Topic,
  TopicEditInput,
  TopicSummary,
  TopicUpdate,
  TopicWithTerms,
  TermWithDescriptions,
} from '@/types';
import { nowIso } from '@/utils/time';

import { notifyDataChanged } from './dataEvents';
import { NotFoundError, ValidationError, optionalText, requireId, requireText } from './errors';

/*
 * All topic, term, and description database operations.
 *
 * Every function takes the database as its first argument (from useSQLiteContext()).
 * All values are passed as `?` parameters, never inserted into SQL text,
 * which prevents SQL injection.
 */

// ---------- Limits ----------

export const LIMITS = {
  topicTitle: 100,
  topicDescription: 300,
  category: 50,
  termText: 200,
  descriptionText: 1000,
} as const;

const DEFAULT_CATEGORY = 'General';

// ---------- Row types (column names exactly as stored in SQLite) ----------

interface TopicRow {
  id: number;
  title: string;
  description: string;
  category: string;
  is_builtin: number;
  created_at: string;
  updated_at: string;
}

interface TopicSummaryRow extends TopicRow {
  card_count: number;
}

interface TermRow {
  id: number;
  topic_id: number;
  term_text: string;
  position: number;
}

interface DescriptionRow {
  id: number;
  term_id: number;
  description_text: string;
  position: number;
}

function toTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    isBuiltin: row.is_builtin === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDescription(row: DescriptionRow): Description {
  return {
    id: row.id,
    termId: row.term_id,
    descriptionText: row.description_text,
    position: row.position,
  };
}

// ---------- Reading topics ----------

const SUMMARY_SELECT = `
  SELECT t.id, t.title, t.description, t.category, t.is_builtin, t.created_at, t.updated_at,
         (SELECT COUNT(*) FROM terms te WHERE te.topic_id = t.id) AS card_count
  FROM topics t`;

async function getTopicSummaries(
  db: SQLiteDatabase,
  filter: 'all' | 'builtin' | 'user',
): Promise<TopicSummary[]> {
  let sql: string;
  let params: number[] = [];

  if (filter === 'all') {
    sql = `${SUMMARY_SELECT} ORDER BY t.is_builtin DESC, t.title COLLATE NOCASE`;
  } else {
    // Built-in topics alphabetically; user topics with the most recently edited first.
    const order =
      filter === 'builtin' ? 't.title COLLATE NOCASE' : 't.updated_at DESC, t.id DESC';
    sql = `${SUMMARY_SELECT} WHERE t.is_builtin = ? ORDER BY ${order}`;
    params = [filter === 'builtin' ? 1 : 0];
  }

  const rows = await db.getAllAsync<TopicSummaryRow>(sql, params);
  return rows.map((row) => ({ ...toTopic(row), cardCount: row.card_count }));
}

/** All topics (built-in first, then user-created), each with its card count. */
export function getAllTopics(db: SQLiteDatabase): Promise<TopicSummary[]> {
  return getTopicSummaries(db, 'all');
}

/** Topics preloaded with the app ("Explore Topics"). */
export function getBuiltinTopics(db: SQLiteDatabase): Promise<TopicSummary[]> {
  return getTopicSummaries(db, 'builtin');
}

/** Topics the user created ("My Topics"), most recently edited first. */
export function getUserTopics(db: SQLiteDatabase): Promise<TopicSummary[]> {
  return getTopicSummaries(db, 'user');
}

/**
 * One topic with all of its terms and each term's descriptions, in display order.
 * Returns null if the topic does not exist.
 */
export async function getTopicWithTerms(
  db: SQLiteDatabase,
  topicId: number,
): Promise<TopicWithTerms | null> {
  requireId(topicId, 'topic');

  const topicRow = await db.getFirstAsync<TopicRow>(
    'SELECT id, title, description, category, is_builtin, created_at, updated_at FROM topics WHERE id = ?',
    [topicId],
  );
  if (!topicRow) {
    return null;
  }

  const termRows = await db.getAllAsync<TermRow>(
    'SELECT id, topic_id, term_text, position FROM terms WHERE topic_id = ? ORDER BY position, id',
    [topicId],
  );
  const descriptionRows = await db.getAllAsync<DescriptionRow>(
    `SELECT d.id, d.term_id, d.description_text, d.position
     FROM descriptions d
     JOIN terms t ON t.id = d.term_id
     WHERE t.topic_id = ?
     ORDER BY d.term_id, d.position, d.id`,
    [topicId],
  );

  // Group descriptions under their term.
  const descriptionsByTerm = new Map<number, Description[]>();
  for (const row of descriptionRows) {
    const list = descriptionsByTerm.get(row.term_id) ?? [];
    list.push(toDescription(row));
    descriptionsByTerm.set(row.term_id, list);
  }

  const terms: TermWithDescriptions[] = termRows.map((row) => ({
    id: row.id,
    topicId: row.topic_id,
    termText: row.term_text,
    position: row.position,
    descriptions: descriptionsByTerm.get(row.id) ?? [],
  }));

  return { ...toTopic(topicRow), terms };
}

// ---------- Writing topics ----------

/** Validates term input up front, so nothing is written if any part is invalid. */
function validateTerms(terms: NewTermInput[]): NewTermInput[] {
  return terms.map((term, index) => ({
    termText: requireText(term.termText, `Term ${index + 1}`, LIMITS.termText),
    descriptions: (term.descriptions ?? []).map((text, descriptionIndex) =>
      requireText(
        text,
        `Description ${descriptionIndex + 1} of term ${index + 1}`,
        LIMITS.descriptionText,
      ),
    ),
  }));
}

/** Inserts one term and its descriptions. Caller must provide the transaction. */
async function insertTermWithDescriptions(
  db: SQLiteDatabase,
  topicId: number,
  term: NewTermInput,
  position: number,
): Promise<number> {
  const termResult = await db.runAsync(
    'INSERT INTO terms (topic_id, term_text, position) VALUES (?, ?, ?)',
    [topicId, term.termText, position],
  );
  for (const [index, text] of term.descriptions.entries()) {
    await db.runAsync(
      'INSERT INTO descriptions (term_id, description_text, position) VALUES (?, ?, ?)',
      [termResult.lastInsertRowId, text, index],
    );
  }
  return termResult.lastInsertRowId;
}

/**
 * Creates a user topic, optionally together with its terms and descriptions.
 * Everything is saved in ONE transaction: if any insert fails, nothing is saved.
 * Returns the new topic's id.
 */
export async function createTopic(db: SQLiteDatabase, input: NewTopicInput): Promise<number> {
  const title = requireText(input.title, 'Topic title', LIMITS.topicTitle);
  const description = optionalText(input.description, 'Topic description', LIMITS.topicDescription);
  const category =
    optionalText(input.category, 'Category', LIMITS.category) || DEFAULT_CATEGORY;
  const terms = validateTerms(input.terms ?? []);
  const timestamp = nowIso();

  let topicId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO topics (title, description, category, is_builtin, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?)`,
      [title, description, category, timestamp, timestamp],
    );
    topicId = result.lastInsertRowId;

    for (const [index, term] of terms.entries()) {
      await insertTermWithDescriptions(db, topicId, term, index);
    }
  });

  notifyDataChanged();
  return topicId;
}

/** Updates a topic's title, description, and/or category. */
export async function updateTopic(
  db: SQLiteDatabase,
  topicId: number,
  changes: TopicUpdate,
): Promise<void> {
  requireId(topicId, 'topic');

  const assignments: string[] = [];
  const params: (string | number)[] = [];

  if (changes.title !== undefined) {
    assignments.push('title = ?');
    params.push(requireText(changes.title, 'Topic title', LIMITS.topicTitle));
  }
  if (changes.description !== undefined) {
    assignments.push('description = ?');
    params.push(optionalText(changes.description, 'Topic description', LIMITS.topicDescription));
  }
  if (changes.category !== undefined) {
    assignments.push('category = ?');
    params.push(optionalText(changes.category, 'Category', LIMITS.category) || DEFAULT_CATEGORY);
  }
  if (assignments.length === 0) {
    throw new ValidationError('Nothing to update.');
  }

  assignments.push('updated_at = ?');
  params.push(nowIso(), topicId);

  // Only fixed column names are joined into the SQL; all values remain ? parameters.
  const result = await db.runAsync(
    `UPDATE topics SET ${assignments.join(', ')} WHERE id = ?`,
    params,
  );
  if (result.changes === 0) {
    throw new NotFoundError('Topic not found.');
  }
  notifyDataChanged();
}

/**
 * Deletes a topic. Its terms and their descriptions are deleted automatically
 * (ON DELETE CASCADE). Game history keeps the record with topic_id set to NULL.
 */
export async function deleteTopic(db: SQLiteDatabase, topicId: number): Promise<void> {
  requireId(topicId, 'topic');
  const result = await db.runAsync('DELETE FROM topics WHERE id = ?', [topicId]);
  if (result.changes === 0) {
    throw new NotFoundError('Topic not found.');
  }
  notifyDataChanged();
}

/** Throws if the same id appears twice in an edit (would make the result ambiguous). */
function assertUniqueIds(ids: number[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new ValidationError(`The same ${label} appears more than once.`);
  }
}

/**
 * Saves an edited topic — its fields, terms, and descriptions — in ONE transaction.
 *
 * - Terms/descriptions WITH an id are updated (they keep their id).
 * - Terms/descriptions WITHOUT an id are inserted.
 * - Existing terms/descriptions that are missing from `input` are deleted.
 * - Display order (position) is rewritten to match the order in `input`.
 *
 * If anything fails, the whole edit is rolled back and the topic stays as it was.
 */
export async function updateTopicWithTerms(
  db: SQLiteDatabase,
  topicId: number,
  input: TopicEditInput,
): Promise<void> {
  requireId(topicId, 'topic');

  // Validate everything before touching the database.
  const title = requireText(input.title, 'Topic title', LIMITS.topicTitle);
  const description = optionalText(input.description, 'Topic description', LIMITS.topicDescription);
  const category =
    input.category === undefined
      ? undefined
      : optionalText(input.category, 'Category', LIMITS.category) || DEFAULT_CATEGORY;

  const terms = input.terms.map((term, termIndex) => ({
    id: term.id === undefined ? undefined : requireId(term.id, 'term'),
    termText: requireText(term.termText, `Term ${termIndex + 1}`, LIMITS.termText),
    descriptions: term.descriptions.map((desc, descriptionIndex) => ({
      id: desc.id === undefined ? undefined : requireId(desc.id, 'description'),
      text: requireText(
        desc.descriptionText,
        `Description ${descriptionIndex + 1} of term ${termIndex + 1}`,
        LIMITS.descriptionText,
      ),
    })),
  }));

  const keptTermIds = terms.flatMap((term) => (term.id === undefined ? [] : [term.id]));
  assertUniqueIds(keptTermIds, 'term');
  assertUniqueIds(
    terms.flatMap((term) => term.descriptions.flatMap((d) => (d.id === undefined ? [] : [d.id]))),
    'description',
  );

  await db.withTransactionAsync(async () => {
    // 1. Topic fields
    const topicRow = await db.getFirstAsync<{ id: number }>('SELECT id FROM topics WHERE id = ?', [
      topicId,
    ]);
    if (!topicRow) {
      throw new NotFoundError('Topic not found. It may have been deleted.');
    }
    if (category === undefined) {
      await db.runAsync(
        'UPDATE topics SET title = ?, description = ?, updated_at = ? WHERE id = ?',
        [title, description, nowIso(), topicId],
      );
    } else {
      await db.runAsync(
        'UPDATE topics SET title = ?, description = ?, category = ?, updated_at = ? WHERE id = ?',
        [title, description, category, nowIso(), topicId],
      );
    }

    // 2. Remove terms that were deleted in the form (their descriptions cascade).
    const existingTermIds = new Set(
      (
        await db.getAllAsync<{ id: number }>('SELECT id FROM terms WHERE topic_id = ?', [topicId])
      ).map((row) => row.id),
    );
    for (const id of keptTermIds) {
      if (!existingTermIds.has(id)) {
        throw new NotFoundError('A term in this topic no longer exists. Reopen the topic and try again.');
      }
    }
    const keptTermIdSet = new Set(keptTermIds);
    for (const id of existingTermIds) {
      if (!keptTermIdSet.has(id)) {
        await db.runAsync('DELETE FROM terms WHERE id = ?', [id]);
      }
    }

    // 3. Update or insert each term, then sync its descriptions.
    for (const [termPosition, term] of terms.entries()) {
      let termId: number;
      let existingDescriptionIds = new Set<number>();

      if (term.id !== undefined) {
        termId = term.id;
        await db.runAsync('UPDATE terms SET term_text = ?, position = ? WHERE id = ?', [
          term.termText,
          termPosition,
          termId,
        ]);
        existingDescriptionIds = new Set(
          (
            await db.getAllAsync<{ id: number }>('SELECT id FROM descriptions WHERE term_id = ?', [
              termId,
            ])
          ).map((row) => row.id),
        );
      } else {
        const result = await db.runAsync(
          'INSERT INTO terms (topic_id, term_text, position) VALUES (?, ?, ?)',
          [topicId, term.termText, termPosition],
        );
        termId = result.lastInsertRowId;
      }

      const keptDescriptionIds = new Set<number>();
      for (const desc of term.descriptions) {
        if (desc.id !== undefined) {
          if (!existingDescriptionIds.has(desc.id)) {
            throw new NotFoundError(
              'A description in this topic no longer exists. Reopen the topic and try again.',
            );
          }
          keptDescriptionIds.add(desc.id);
        }
      }
      for (const id of existingDescriptionIds) {
        if (!keptDescriptionIds.has(id)) {
          await db.runAsync('DELETE FROM descriptions WHERE id = ?', [id]);
        }
      }

      for (const [descriptionPosition, desc] of term.descriptions.entries()) {
        if (desc.id !== undefined) {
          await db.runAsync(
            'UPDATE descriptions SET description_text = ?, position = ? WHERE id = ?',
            [desc.text, descriptionPosition, desc.id],
          );
        } else {
          await db.runAsync(
            'INSERT INTO descriptions (term_id, description_text, position) VALUES (?, ?, ?)',
            [termId, desc.text, descriptionPosition],
          );
        }
      }
    }
  });

  notifyDataChanged();
}

// ---------- Terms ----------

/** Marks a topic as edited now. */
async function touchTopic(db: SQLiteDatabase, topicId: number): Promise<void> {
  await db.runAsync('UPDATE topics SET updated_at = ? WHERE id = ?', [nowIso(), topicId]);
}

/** Marks the topic that owns a term as edited now. */
async function touchTopicOfTerm(db: SQLiteDatabase, termId: number): Promise<void> {
  await db.runAsync(
    'UPDATE topics SET updated_at = ? WHERE id = (SELECT topic_id FROM terms WHERE id = ?)',
    [nowIso(), termId],
  );
}

/**
 * Adds a term to the end of a topic, optionally with descriptions (saved in one transaction).
 * Returns the new term's id.
 */
export async function addTerm(
  db: SQLiteDatabase,
  topicId: number,
  termText: string,
  descriptions: string[] = [],
): Promise<number> {
  requireId(topicId, 'topic');
  const [term] = validateTerms([{ termText, descriptions }]);

  let termId = 0;
  await db.withTransactionAsync(async () => {
    const topic = await db.getFirstAsync<{ id: number }>('SELECT id FROM topics WHERE id = ?', [
      topicId,
    ]);
    if (!topic) {
      throw new NotFoundError('Topic not found.');
    }
    const next = await db.getFirstAsync<{ next_position: number }>(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM terms WHERE topic_id = ?',
      [topicId],
    );
    termId = await insertTermWithDescriptions(db, topicId, term, next?.next_position ?? 0);
    await touchTopic(db, topicId);
  });

  notifyDataChanged();
  return termId;
}

/** Changes a term's text. */
export async function updateTerm(db: SQLiteDatabase, termId: number, termText: string): Promise<void> {
  requireId(termId, 'term');
  const text = requireText(termText, 'Term', LIMITS.termText);

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync('UPDATE terms SET term_text = ? WHERE id = ?', [text, termId]);
    if (result.changes === 0) {
      throw new NotFoundError('Term not found.');
    }
    await touchTopicOfTerm(db, termId);
  });
  notifyDataChanged();
}

/** Deletes a term. Its descriptions are deleted automatically (ON DELETE CASCADE). */
export async function deleteTerm(db: SQLiteDatabase, termId: number): Promise<void> {
  requireId(termId, 'term');

  await db.withTransactionAsync(async () => {
    // Touch the topic first, while the term (and its topic_id) still exists.
    await touchTopicOfTerm(db, termId);
    const result = await db.runAsync('DELETE FROM terms WHERE id = ?', [termId]);
    if (result.changes === 0) {
      throw new NotFoundError('Term not found.');
    }
  });
  notifyDataChanged();
}

// ---------- Descriptions ----------

/** Adds a description to the end of a term's description list. Returns the new id. */
export async function addDescription(
  db: SQLiteDatabase,
  termId: number,
  descriptionText: string,
): Promise<number> {
  requireId(termId, 'term');
  const text = requireText(descriptionText, 'Description', LIMITS.descriptionText);

  let descriptionId = 0;
  await db.withTransactionAsync(async () => {
    const term = await db.getFirstAsync<{ id: number }>('SELECT id FROM terms WHERE id = ?', [
      termId,
    ]);
    if (!term) {
      throw new NotFoundError('Term not found.');
    }
    const result = await db.runAsync(
      `INSERT INTO descriptions (term_id, description_text, position)
       SELECT ?, ?, COALESCE(MAX(position), -1) + 1 FROM descriptions WHERE term_id = ?`,
      [termId, text, termId],
    );
    descriptionId = result.lastInsertRowId;
    await touchTopicOfTerm(db, termId);
  });

  notifyDataChanged();
  return descriptionId;
}

/** Changes a description's text. */
export async function updateDescription(
  db: SQLiteDatabase,
  descriptionId: number,
  descriptionText: string,
): Promise<void> {
  requireId(descriptionId, 'description');
  const text = requireText(descriptionText, 'Description', LIMITS.descriptionText);

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'UPDATE descriptions SET description_text = ? WHERE id = ?',
      [text, descriptionId],
    );
    if (result.changes === 0) {
      throw new NotFoundError('Description not found.');
    }
    await db.runAsync(
      `UPDATE topics SET updated_at = ?
       WHERE id = (SELECT t.topic_id FROM terms t JOIN descriptions d ON d.term_id = t.id WHERE d.id = ?)`,
      [nowIso(), descriptionId],
    );
  });
  notifyDataChanged();
}

/** Deletes one description. */
export async function deleteDescription(db: SQLiteDatabase, descriptionId: number): Promise<void> {
  requireId(descriptionId, 'description');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE topics SET updated_at = ?
       WHERE id = (SELECT t.topic_id FROM terms t JOIN descriptions d ON d.term_id = t.id WHERE d.id = ?)`,
      [nowIso(), descriptionId],
    );
    const result = await db.runAsync('DELETE FROM descriptions WHERE id = ?', [descriptionId]);
    if (result.changes === 0) {
      throw new NotFoundError('Description not found.');
    }
  });
  notifyDataChanged();
}
