import type { SQLiteDatabase } from 'expo-sqlite';

import type { NewTermInput } from '@/types';
import { nowIso } from '@/utils/time';

interface BuiltinTopicSeed {
  title: string;
  description: string;
  category: string;
  terms: NewTermInput[];
}

/** Topics preloaded with the app. They appear under "Explore Topics". */
export const BUILTIN_TOPICS: BuiltinTopicSeed[] = [
  {
    title: 'Human Anatomy',
    description: 'Bones, organs, and body systems explained simply.',
    category: 'Science',
    terms: [
      {
        termText: 'Femur',
        descriptions: [
          'The longest and strongest bone in the human body.',
          'Located in the thigh, connecting the hip to the knee.',
        ],
      },
      {
        termText: 'Heart',
        descriptions: [
          'A muscular organ that pumps blood through the body.',
          'Has four chambers: two atria and two ventricles.',
        ],
      },
      {
        termText: 'Alveoli',
        descriptions: ['Tiny air sacs in the lungs where oxygen and carbon dioxide are exchanged.'],
      },
      {
        termText: 'Neuron',
        descriptions: ['A nerve cell that sends electrical and chemical signals.'],
      },
      { termText: 'Skin', descriptions: ['The largest organ of the human body.'] },
    ],
  },
  {
    title: 'World Capitals',
    description: 'Match countries with their capital cities.',
    category: 'Geography',
    terms: [
      { termText: 'Japan', descriptions: ['Tokyo'] },
      { termText: 'Philippines', descriptions: ['Manila'] },
      { termText: 'Canada', descriptions: ['Ottawa', 'Often confused with Toronto, the largest city.'] },
      {
        termText: 'Australia',
        descriptions: ['Canberra', 'Chosen as a compromise between Sydney and Melbourne.'],
      },
      { termText: 'Brazil', descriptions: ['Brasília'] },
      { termText: 'Egypt', descriptions: ['Cairo'] },
    ],
  },
  {
    title: 'Basic Chemistry',
    description: 'Elements, compounds, and common reactions.',
    category: 'Science',
    terms: [
      {
        termText: 'Atom',
        descriptions: [
          'The smallest unit of a chemical element.',
          'Made of protons, neutrons, and electrons.',
        ],
      },
      { termText: 'H₂O', descriptions: ['The chemical formula for water.'] },
      {
        termText: 'pH',
        descriptions: ['A scale from 0 to 14 that measures how acidic or basic a substance is.', 'A pH of 7 is neutral.'],
      },
      {
        termText: 'Catalyst',
        descriptions: ['A substance that speeds up a reaction without being used up.'],
      },
      {
        termText: 'Noble gases',
        descriptions: ['Group 18 elements that rarely react, such as helium and neon.'],
      },
    ],
  },
  {
    title: 'Programming Terms',
    description: 'Key words every beginner developer should know.',
    category: 'Technology',
    terms: [
      { termText: 'Variable', descriptions: ['A named container that stores a value.'] },
      {
        termText: 'Function',
        descriptions: [
          'A reusable block of code that performs a task.',
          'Can take inputs (parameters) and return an output.',
        ],
      },
      { termText: 'Loop', descriptions: ['Repeats a block of code while a condition is true.'] },
      {
        termText: 'Bug',
        descriptions: ['An error in a program that causes wrong or unexpected behavior.'],
      },
      { termText: 'Array', descriptions: ['An ordered list of values accessed by index.'] },
    ],
  },
];

/**
 * Inserts the built-in topics. Called by a migration, so it runs once per device.
 * As an extra safety net, a built-in topic is skipped if one with the same title exists.
 * Must be called inside a transaction (the migration runner provides one).
 */
export async function seedBuiltinTopics(db: SQLiteDatabase): Promise<void> {
  const timestamp = nowIso();

  for (const topic of BUILTIN_TOPICS) {
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM topics WHERE is_builtin = 1 AND title = ?',
      [topic.title],
    );
    if (existing) {
      continue;
    }

    const topicResult = await db.runAsync(
      `INSERT INTO topics (title, description, category, is_builtin, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [topic.title, topic.description, topic.category, timestamp, timestamp],
    );

    for (const [termIndex, term] of topic.terms.entries()) {
      const termResult = await db.runAsync(
        'INSERT INTO terms (topic_id, term_text, position) VALUES (?, ?, ?)',
        [topicResult.lastInsertRowId, term.termText, termIndex],
      );
      for (const [descriptionIndex, text] of term.descriptions.entries()) {
        await db.runAsync(
          'INSERT INTO descriptions (term_id, description_text, position) VALUES (?, ?, ?)',
          [termResult.lastInsertRowId, text, descriptionIndex],
        );
      }
    }
  }
}
