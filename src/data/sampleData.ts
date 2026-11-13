/*
 * TEMPORARY sample data for UI development.
 * Replace these with real queries once local storage (src/database) is implemented.
 */
import type { GameResult, TopicSummary } from '@/types';

/** Ready-made topics shown under "Explore Topics". */
export const SAMPLE_EXPLORE_TOPICS: TopicSummary[] = [
  {
    id: 'explore-1',
    title: 'Human Anatomy',
    description: 'Bones, organs, and body systems explained simply.',
    cardCount: 24,
  },
  {
    id: 'explore-2',
    title: 'World Capitals',
    description: 'Match countries with their capital cities.',
    cardCount: 30,
  },
  {
    id: 'explore-3',
    title: 'Basic Chemistry',
    description: 'Elements, compounds, and common reactions.',
    cardCount: 18,
  },
  {
    id: 'explore-4',
    title: 'Programming Terms',
    description: 'Key words every beginner developer should know.',
    cardCount: 20,
  },
];

/** Topics the user created, shown under "My Topics". */
export const SAMPLE_MY_TOPICS: TopicSummary[] = [
  {
    id: 'mine-1',
    title: 'Biology Midterm',
    description: 'Cell structure and photosynthesis review.',
    cardCount: 12,
  },
  {
    id: 'mine-2',
    title: 'Spanish Verbs',
    description: 'Common regular and irregular verbs.',
    cardCount: 15,
  },
  {
    id: 'mine-3',
    title: 'Philippine History',
    description: 'Important events and national heroes.',
    cardCount: 10,
  },
];

/** Recently finished games, newest first. */
export const SAMPLE_RECENT_GAMES: GameResult[] = [
  {
    id: 'game-1',
    topicId: 'mine-1',
    topicTitle: 'Biology Midterm',
    score: 10,
    totalQuestions: 12,
    playedAt: '2026-11-12T19:30:00',
  },
  {
    id: 'game-2',
    topicId: 'explore-2',
    topicTitle: 'World Capitals',
    score: 24,
    totalQuestions: 30,
    playedAt: '2026-11-10T16:05:00',
  },
  {
    id: 'game-3',
    topicId: 'mine-2',
    topicTitle: 'Spanish Verbs',
    score: 9,
    totalQuestions: 15,
    playedAt: '2026-11-08T09:45:00',
  },
];
